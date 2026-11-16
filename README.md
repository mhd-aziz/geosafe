# GeoSafe — aplikasi web pemetaan sebaran titik panas

Purwarupa aplikasi (kode sistem). Ini **bukan** repo perencanaan: data mentah,
proposal, SRS, ERD, dan alur sistem ada di `../planning-GeoSafe/`.

Backend **sudah bisa dijalankan** sejak 2026-11-16 (endpoint `/health`); frontend
belum dikerjakan. Berkas ini penunjuk struktur dan aturan yang sudah diputuskan.

## Struktur

```
project-GeoSafe/
├── backend/                    ada isi
│   ├── pyproject.toml          dependensi (uv); requires-python >=3.12
│   ├── uv.lock                 versi terkunci hasil `uv sync`
│   ├── app/                    paket Python (huruf kecil sesuai PEP 8)
│   │   ├── __init__.py
│   │   ├── main.py             aplikasi FastAPI + /health
│   │   ├── config.py           baca variabel lingkungan (DSN basis data)
│   │   ├── db.py               koneksi psycopg ke PostgreSQL `geosafe`
│   │   ├── routers/
│   │   │   ├── maps.py         P1 — GET /tiles/regions/{z}/{x}/{y}.mvt
│   │   │   └── transparency.py T1 — GET /api/v1/sources
│   │   ├── cache.py            (menyusul) cache 15 menit + snapshot.json
│   │   └── firms.py            (menyusul) tarik NASA FIRMS
│   └── tests/
│       ├── test_health.py
│       ├── test_sources.py     pytest (butuh basis data hidup)
│       └── test_tiles.py
├── frontend/                   kosong — React + TypeScript · Vite 7.3.8
└── deploy/                     kosong — nginx (SPA + proxy) · systemd
```

Hanya folder `backend/` yang berisi berkas nyata. `frontend/` dan `deploy/`
masih kosong dan **tidak** dilacak git (lihat aturan 5).

Nama berkas di `backend/app/routers/` memakai **Bahasa Inggris** (aturan penamaan
2026-11-16). Peta ke kode fitur di dokumen perencanaan:

| Berkas | Fitur | Isi |
|---|---|---|
| `maps.py` | P1–P5 | sebaran titik panas, terkini, kejadian, kerawanan, titik kejadian, tile MVT |
| `panels.py` | W1–W4 | panel wilayah per tingkat (kabupaten/kota, kecamatan, desa) |
| `analysis.py` | A1–A3 | tren, komposisi wilayah, peringkat |
| `search.py` | C1 | pencarian tiga tingkat wilayah |
| `latest.py` | P2 | titik panas terkini 24/48/72 jam + cache 15 menit |
| `transparency.py` | T1 | sumber & batas data, unduh CSV |

## Aturan yang mengikat

1. **Akar repo tanpa manifest dependensi.** `pyproject.toml` (uv) di `backend/`,
   `package.json` (npm) di `frontend/`. Tidak ada `package.json` di akar.
2. **Data besar tidak masuk repo.** PMTiles basemap (216 MB), `siap-pakai/tabel/`
   (31 MB), dan `titik/*.csv.gz` (13 MB) tetap di `../planning-GeoSafe/data/`;
   nginx menunjuk ke sana lewat `deploy/nginx/`.
3. **`.env` hanya di `backend/`.** Kunci NASA FIRMS tidak pernah sampai ke
   `frontend/` dan tidak memakai awalan `VITE_`.
4. **Angka dan geometri hanya dari PostgreSQL** (`geosafe`, kontainer podman `pg`,
   port 5433). Aplikasi tidak membaca CSV `siap-pakai/` langsung, dan tidak
   mengulang join titik→wilayah di JavaScript.
5. **Tidak ada berkas atau folder cadangan.** Hanya berkas yang benar-benar
   dipakai yang dibuat — tidak ada placeholder, fungsi kosong ber-`TODO`,
   konfigurasi untuk nilai yang belum ada, atau folder kosong ber-`.gitkeep`.
   Folder `routers/`, `frontend/`, dan `deploy/` dibuat **saat** isinya ditulis.
6. **Komentar dan docstring Bahasa Indonesia**, sedangkan nama folder, berkas,
   fungsi, kelas, variabel, kolom JSON, dan pesan commit Bahasa Inggris (aturan
   2026-11-16, rincian di bagian Konvensi penulisan).

Rujukan keputusan (di `../planning-GeoSafe/docs/`): `ARSITEKTUR.md` (penempatan
fisik) · `API-P2.md` (kontrak alur terkini) · `SRS-GeoSafe.md` (kebutuhan ber-ID) ·
`ERD-GeoSafe.md` (14 tabel) · `alur-sistem.md` (DFD dan kamus data).

## Menjalankan backend

```bash
cd backend
uv sync                                 # sekali; membuat .venv + uv.lock

# DSN basis data: di server nanti lewat EnvironmentFile pada unit systemd
set -a; . ~/pg/env; set +a
export GEOSAFE_DATABASE_URL="host=127.0.0.1 port=5433 dbname=geosafe user=$POSTGRES_USER password=$POSTGRES_PASSWORD"

uv run pytest -q                        # uji endpoint (butuh basis data hidup)
uv run uvicorn app.main:app --reload    # /health · /api/v1/sources · /docs
```

Endpoint yang sudah ada:

| Endpoint | Isi | Sumber angka |
|---|---|---|
| `GET /health` | status proses API | — |
| `GET /api/v1/sources` | daftar dataset sumber + jumlah baris | tabel `data_sources` |
| `GET /tiles/regions/{z}/{x}/{y}.mvt?year=` | vector tile MVT kabupaten/kota + jumlah titik panas tahun itu | tabel `regions` ⋈ `region_facts` |

Hasil nyata 2026-11-16 (setelah cabang `feat/api-database`): `uv sync` memasang
25 paket; `uv run pytest` **2 passed**; server hidup dan `GET /api/v1/sources`
balas `count = 7` dengan kode 200 — kode sumbernya `BNPB-EVENT`, `BNPB-REKAP`,
`BNPB-STATUS`, `FIRMS`, `GEOPORTAL-BNPB`, `GWIS`, `INARISK-IRBI`; waktu respons
0,028–0,033 detik. `GET /health`, `/docs`, dan `/openapi.json` semua kode 200.

Hasil nyata 2026-11-16 (setelah cabang `feat/api-tiles`): `uv run pytest`
**5 passed**; tile MVT diperiksa lewat HTTP, bukan hanya lewat SQL.

| Permintaan | Waktu (3 kali) | Ukuran | Anggapan |
|---|---|---|---|
| tile dunia `z0/0/0` tahun 2020 (514 poligon) | 0,302 · 0,254 · 0,256 dtk | 47.657 B | ambang `SRS-NF-04` ≤500 ms — **lolos** |
| tile padat `z6/51/33` (Jawa) tahun 2023 | 0,169 · 0,177 · 0,151 dtk | 15.917 B | idem |
| tile laut `z1/0/1` | kode **204**, 0 B | — | peramban tidak mengurai muatan kosong |

Catatan pengukuran yang harus disebut kalau angkanya dipakai: **248 dari 254 ms
itu biaya SQL**, bukan HTTP — SQL yang sama dijalankan langsung di `psql`
memakan 247,993 ms. Angka 93 ms di `LAPORAN-MUAT-POSTGRES.md` diukur **tanpa**
`ST_Transform` per poligon; endpoint ini memproyeksikan geometri 4326 → 3857
karena MVT mensyaratkan Web Mercator. Jadi angka yang benar untuk `SRS-NF-04`
adalah hasil jalur HTTP ini (0,25–0,30 dtk), bukan 93 ms. Membuka koneksi
psycopg per permintaan hanya 0,028–0,029 dtk, jadi `psycopg_pool` belum
diperlukan — ditambahkan hanya kalau pengukuran berikutnya menuntut.

Versi yang terkunci: Python **3.13.14** (venv), fastapi **0.163.1**,
starlette **1.10.0**, uvicorn **0.54.0**, psycopg **3.3.9**, httpx **0.28.1**,
pytest **9.2.0**.

Catatan: `fastapi.testclient` memunculkan peringatan `StarletteDeprecationWarning`
saat memakai `httpx` dan menyarankan `httpx2`. Baru peringatan; `httpx` tetap
dipakai karena juga diperlukan untuk menarik data NASA FIRMS.

Frontend belum bisa dijalankan (`frontend/` masih kosong).

## Keputusan penamaan (dikunci 2026-11-16)

Aturan yang dipakai: PEP 8 untuk paket Python (huruf kecil semua, tanda hubung
membuat impor gagal), aturan npm untuk `package.json` (tidak boleh huruf besar),
konvensi Git untuk nama repo, dan pola yang sudah ada di mesin ini untuk unit
systemd dan berkas nginx.

| Benda | Nama | Dasar |
|---|---|---|
| paket Python backend | `backend/app/` | huruf kecil semua (PEP 8); mengikuti contoh resmi FastAPI `uvicorn app.main:app` |
| proyek Python (`pyproject.toml`) | `geosafe-api` | huruf kecil; `-api` membedakan dari basis data |
| paket npm | `geosafe-frontend` | npm menolak huruf besar |
| unit systemd | `geosafe-api.service` | pola unit di mesin ini (`backend-abn.service`) |
| berkas nginx | `deploy/nginx/geosafe.conf` | pola situs di mesin ini (`sia-iti`) |
| basis data · kontainer · basemap | `geosafe` · `pg` · `indonesia.pmtiles` | sudah sesuai aturan |
| branch | `main` | konvensi Git |

Nama folder repo (`project-GeoSafe` dan `planning-GeoSafe`) **sengaja tidak
diubah** — keputusan 2026-11-16, jadi jangan dirapikan tanpa persetujuan.

## Alur kerja git (dikunci 2026-11-16)

Model **trunk-based dengan cabang pendek**. `main` harus selalu bisa dijalankan:
repo ini publik, tidak ada CI, dan aplikasinya dipakai untuk demo.

| Hal | Aturan |
|---|---|
| `main` | selalu bisa dijalankan; **dilarang** `git push --force` |
| Cabang kerja | `feat/<slug>` · `fix/<slug>` · `docs/<slug>` · `chore/<slug>` — huruf kecil, kebab |
| Umur cabang | satu tujuan, 1–3 sesi; lebih dari itu dipotong jadi lebih kecil |
| Masuk ke `main` | Pull Request, lalu **squash merge** — `main` jadi satu commit per fitur |
| Cabang setelah digabung | **tidak dihapus** (dipilih 2026-11-16 sebagai jejak saat sidang) |
| Jejak iterasi | tag `iter-NN-<slug>` pada commit hasil merge, di-push ke GitHub |
| Deskripsi PR | wajib memuat: apa yang ditambah, kenapa, dan bukti jalannya |
| Perubahan kode | selalu lewat cabang; dokumentasi/aturan kecil boleh langsung ke `main` |

Alasan memilih squash, bukan merge commit: tanpa CI tidak ada penjaga mutu
otomatis, jadi commit tengah cabang yang setengah jalan tidak boleh sampai ke
`main`. Riwayat per-langkah tidak hilang — tetap ada di halaman PR dan di
`refs/pull/<nomor>/head` di GitHub (bisa diambil dengan
`git fetch origin pull/<nomor>/head:<nama-lokal>`).

Cara menjalankan satu fitur:

```bash
git switch -c feat/<slug>
# ... kerja; commit bergaya Conventional Commits ...
git push -u origin feat/<slug>
gh pr create --base main --title "<type>(<scope>): <subject>" --body "<apa, kenapa, bukti>"
gh pr merge <nomor> --squash --subject "<type>(<scope>): <subject>" --body "<ringkasan>"
git switch main && git pull --ff-only
git tag iter-NN-<slug> && git push origin iter-NN-<slug>
```

Riwayat iterasi:

| Tag | PR | Isi |
|---|---|---|
| `iter-01-api-database` | #1 | `config.py` · `db.py` · `GET /api/v1/sources` (T1) |

## Konvensi penulisan (dikunci 2026-11-16)

| Hal | Aturan |
|---|---|
| Nama folder dan berkas | Bahasa Inggris. Python: huruf kecil, `snake_case` (`maps.py`, `hotspot_series.py`). Konfigurasi: `kebab-case` (`geosafe-api.service`, `geosafe.conf`) |
| Nama fungsi, kelas, variabel | Bahasa Inggris. Python: `snake_case` untuk fungsi/variabel, `PascalCase` untuk kelas. TypeScript: `camelCase` untuk fungsi, `PascalCase` untuk komponen React |
| Nama kolom JSON / API | Bahasa Inggris, sama persis dengan nama kolom basis data (`hotspot_count`, `region_code`, `event_count`) |
| Komentar dan docstring | **Bahasa Indonesia** (keputusan 2026-11-16). Nama fungsi, kelas, variabel, dan kolom tetap Inggris; hanya penjelasan di dalam kode yang Indonesia |
| Pesan commit | Bahasa Inggris, Conventional Commits |
| `README.md` dan berkas penunjuk repo | Bahasa Indonesia |
| Dokumen perencanaan (SRS, proposal, ERD) | Bahasa Indonesia, tetap di `../planning-GeoSafe/` |

Kode fitur di dokumen perencanaan (P1–P5, W1–W4, A1–A3, C1, T1) tetap dipakai
**sebagai penanda traceability**, bukan sebagai nama berkas.

### Format pesan commit (Conventional Commits)

```
<type>(<scope>): <subject imperatif, huruf kecil, tanpa titik di akhir>
```

- **type**: `feat` · `fix` · `docs` · `refactor` · `perf` · `test` · `build` · `ci` · `chore` · `style`
- **scope**: bagian yang disentuh — `api` · `frontend` · `deploy` · `db` · `docs`
- baris judul ≤ 72 karakter; alasan perubahan masuk badan pesan, bukan daftar berkas

Contoh yang benar:

```
feat(api): add choropleth tile endpoint for hotspot series
fix(api): return null instead of zero when a hotspot count is missing
perf(api): index village geometry to cut tile time
test(api): cover point-in-polygon join for recent hotspots
docs: record naming and commit conventions
chore(api): add pyproject and uv lockfile
build(deploy): add nginx site config and systemd unit
```

Dilarang: pesan berbahasa Indonesia, `update file`, `fix bug`, `wip`, `revisi`.
