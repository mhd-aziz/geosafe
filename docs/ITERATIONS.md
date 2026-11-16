# Catatan iterasi

Log kerja per iterasi: apa yang ditambahkan, **apa buktinya**, dan temuan yang
harus diingat. README sengaja tidak memuat rincian ini supaya tetap jadi pintu
gerbang, bukan buku harian.

Aturan penulisan entri: tulis angka yang benar-benar keluar dari perintah, sebut
perintahnya, dan jangan menyembunyikan yang meleset.

---

## Ringkasan

| Iterasi | Cabang | Isi | PR | Tag |
|---|---|---|---|---|
| 01 | `feat/api-database` | koneksi PostgreSQL + `GET /api/v1/sources` (T1) | #1 | `iter-01-api-database` |
| 02 | `feat/api-tiles` | tile MVT kabupaten/kota (P1) | #2 | `iter-02-api-tiles` |
| 03 | `feat/api-panel` | panel kabupaten/kota (W2) | #3 | `iter-03-api-panel` |
| 04 | `fix/tile-missing-regions` | tile memuat wilayah tanpa baris fakta | #4 | `iter-04-tile-missing-regions` |

Semua dikerjakan 2026-11-16. Cabang **tidak dihapus** setelah digabung (lihat
[`CONVENTIONS.md`](CONVENTIONS.md) bagian 4).

---

## Iterasi 01 — `feat/api-database` (PR #1)

Menambah lapisan data pertama: `app/config.py` (DSN dari variabel lingkungan),
`app/db.py` (satu koneksi psycopg per permintaan, `autocommit`, hanya membaca),
`app/routers/transparency.py` (`GET /api/v1/sources` dari tabel `data_sources`),
dan `tests/test_sources.py`.

Bukti:

- `uv sync` memasang 25 paket dari `uv.lock`; venv Python 3.13.14.
- `uv run pytest` → **2 passed**.
- `GET /api/v1/sources` → `count = 7`, kode 200; kode sumbernya `BNPB-EVENT`,
  `BNPB-REKAP`, `BNPB-STATUS`, `FIRMS`, `GEOPORTAL-BNPB`, `GWIS`, `INARISK-IRBI`;
  waktu respons 0,028–0,033 dtk.
- `GET /health`, `/docs`, `/openapi.json` → 200.

Temuan: **koneksi psycopg per permintaan hanya 0,028–0,029 dtk**, jadi
`psycopg_pool` belum diperlukan. Ditambahkan hanya kalau pengukuran berikutnya
menuntut — bukan atas dasar dugaan.

## Iterasi 02 — `feat/api-tiles` (PR #2)

`app/routers/maps.py`: `GET /tiles/regions/{z}/{x}/{y}.mvt?year=YYYY`. Amplop tile
diproyeksikan ke 4326 untuk `WHERE` (supaya indeks GiST `ix_region_geom` tetap
terpakai), lalu geometri diproyeksikan ke 3857 untuk `ST_AsMVTGeom`. Tile tanpa
poligon dibalas `204`. `tests/test_tiles.py`: 3 uji.

Bukti (`uv run pytest` **5 passed**):

| Permintaan | Waktu (3 kali) | Ukuran | Ambang `SRS-NF-04` |
|---|---|---|---|
| `z0/0/0` tahun 2020 (514 poligon) | 0,302 · 0,254 · 0,256 dtk | 47.657 B | ≤ 500 ms — lolos |
| `z6/51/33` (Jawa) tahun 2023 | 0,169 · 0,177 · 0,151 dtk | 15.917 B | idem |
| `z1/0/1` (laut) | kode 204, 0 B | — | idem |

Temuan penting yang mengubah dokumen perencanaan: **angka 93 ms pada
`SRS-NF-04` salah**. Angka itu diukur tanpa `ST_Transform` per poligon, sedangkan
MVT mensyaratkan Web Mercator. SQL yang sama di `psql` = **247,993 ms**; lewat
HTTP = **0,25–0,30 dtk**. Hampir seluruh waktu adalah biaya basis data, bukan HTTP.
Akibatnya SRS naik ke **v1.6** (lihat bagian Riwayat perubahan di bawah).

## Iterasi 03 — `feat/api-panel` (PR #3)

`app/routers/panels.py`: `GET /api/v1/panel/kabupaten_kota/{kode}` — satu query
agregat per wilayah. Hanya baris tahunan (`month is null`) dan total
(`confidence is null`); kolom `series` dikirim apa adanya (`main`/`fill`/`nrt`
tidak digabung); kelas IRBI dibaca dari `value_text` (bukan `value`). Wilayah tidak
dikenal → `404`. Medan `notes` memuat batasan data.

Bukti (`uv run pytest` **9 passed**; ambang `SRS-NF-10` ≤ 300 ms):

| Permintaan | Waktu (3 kali) | Ukuran |
|---|---|---|
| `panel/kabupaten_kota/9301` (Merauke) | 0,095 · 0,035 · 0,036 dtk | 2.095 B |
| `panel/kabupaten_kota/3204` (Bandung Barat) | 0,038 · 0,041 · 0,037 dtk | 2.157 B |
| `panel/kabupaten_kota/1401` (Kampar) | 0,035 · 0,036 · 0,034 dtk | 2.083 B |
| `panel/kabupaten_kota/9999` | kode 404 | — |

Temuan:

1. **Merauke kini provinsi Papua Selatan** (pemekaran 2022), bukan Papua. Uji
   pertama gagal karena memakai pengetahuan lama.
2. **ETL tidak menulis baris bernilai nol** — 0 dari 5.074 baris titik panas dan
   0 dari 1.149 baris kejadian bernilai 0. Artinya tahun yang hilang = nol
   deteksi. Dijadikan aturan 6 di `CONVENTIONS.md`.
3. **`panel_kabupaten_kota.csv` mencampur seri NRT ke angka tahun**: Merauke 2026
   `hotspot_2026` = 67.453 = main 4.581 + fill 627 + **nrt 62.245**. Endpoint panel
   tidak mengikuti cara itu.
4. `hotspot_per_1000_km2` tidak punya tahun dan mencakup seluruh seri (termasuk NRT).

## Iterasi 04 — `fix/tile-missing-regions` (PR #4)

Perbaikan cacat yang ditemukan di iterasi 03: tile memakai `INNER JOIN`, sehingga
**39 dari 514 wilayah hilang** dari choropleth 2020 karena tidak punya baris
`hotspot_count`. Diganti `LEFT JOIN` + properti baru `has_fact` (1/0);
`hotspot_count` dikirim kosong bila tidak ada baris. Aplikasi **tidak** menambah
baris nol sendiri — peramban yang memutuskan cara menggambarnya.

Bukti (`uv run pytest` **11 passed**):

| Permintaan | Sebelum | Sesudah |
|---|---|---|
| `z0/0/0` tahun 2020 | 47.657 B · 475 wilayah | **50.145 B** · 514 wilayah, 39 bertanda `has_fact = 0` |
| `z6/51/33` tahun 2023 | 15.917 B | 16.571 B · 0,144 dtk |
| `z1/0/1` (laut) | 204 | 204 |

Waktu tile `z0/0/0` 0,24–0,48 dtk (panggilan pertama paling lambat) — masih di bawah
ambang `SRS-NF-04`. Uji baru menghitung 39 wilayah tanpa baris fakta **langsung di
basis data**; kalau suatu hari ETL berubah menulis baris nol, uji itu gagal dan
keputusan `has_fact` perlu ditinjau ulang.

---

## Versi yang terkunci

Dari `uv.lock` (2026-11-16): Python **3.13.14** (venv) · fastapi **0.163.1** ·
starlette **1.10.0** · uvicorn **0.54.0** · psycopg **3.3.9** · httpx **0.28.1** ·
pytest **9.2.0**.

## Riwayat perubahan dokumen perencanaan

Perubahan dokumen di `../planning-GeoSafe/` yang dipicu pekerjaan di repo ini:

| Tanggal | Dokumen | Perubahan |
|---|---|---|
| 2026-11-16 | `docs/SRS-GeoSafe.md` → **v1.6** | `SRS-NF-04` dikoreksi jadi 0,25–0,30 dtk (jalur HTTP); `NF-05`/`NF-06`/`NF-08` ditandai "diukur di `psql`"; satu cacat lama di tabel riwayat diperbaiki. SRS 32 halaman, pengenal `SRS-*` tetap 132 |
| 2026-11-16 | `data/pembangun/LAPORAN-MUAT-POSTGRES.md` | bagian **6b**: koreksi angka 93 ms + pemisahan biaya SQL/HTTP |
| 2026-11-16 | `docs/ARSITEKTUR.md` | bagian 6 tidak lagi menulis `NF-04`/`NF-05`/`NF-06`/`NF-08` "belum diukur" |
| 2026-11-16 | `CATATAN-DISKUSI.md` | status proyek + entri sesi ke-19 |

## Cara menambah entri

1. Kerjakan satu cabang, buka PR, tulis bukti di deskripsi PR.
2. Setelah *squash merge*, tambahkan baris di tabel ringkasan dan satu bagian
   `## Iterasi NN — <slug> (PR #NN)` di berkas ini, isinya: berkas yang ditambah,
   perintah yang dijalankan, dan angka hasilnya.
3. Tambahkan tag `iter-NN-<slug>` di GitHub.
4. Perbarui tabel "Status" di `README.md` dan antrean di `MVP.md`.
