# GeoSafe

Sistem informasi geografis berbasis web untuk memetakan **sebaran titik panas
(hotspot)** sebagai indikator kerawanan **kebakaran hutan dan lahan (karhutla)**
di Indonesia, rentang data 1 Januari 2020 sampai sekarang.

Pengguna sasarannya **masyarakat umum**: dibuka lewat peramban, tanpa akun, tanpa
pemasangan. Unit analisisnya **514 kabupaten/kota**; angka kecamatan dan
desa/kelurahan disajikan sebagai pendukung, sedangkan tingkat nasional dan
provinsi sebagai konteks.

> **titik panas bukan kebakaran.** Titik panas adalah anomali termal yang
> terdeteksi satelit — indikasi awal, bukan kebakaran terkonfirmasi. Kejadian
> karhutla (kategori resmi BNPB) adalah seri terpisah dan tidak pernah
> dijumlahkan dengan titik panas.

Repo ini berisi **kode aplikasi**. Data mentah, proposal, SRS, ERD, dan alur
sistem ada di repo perencanaan `../planning-GeoSafe/` — lihat bagian Dokumen.

---

## Status

| Bagian | Keadaan |
|---|---|
| Backend (`backend/`) | berjalan — 16 endpoint, `uv run pytest` 91 passed, koneksi lewat kolam kecil (`psycopg_pool`) |
| Frontend (`frontend/`) | berjalan — 3 halaman (peta + lapisan titik terkini + lapisan kerawanan kabupaten/kota + lapisan kerawanan desa · tren · sumber data), basemap PMTiles z12, `npm test` 112 passed |
| Deploy (**berkas di mesin, tidak di git**) | berjalan — API sebagai unit systemd pengguna, nginx menyajikan halaman, proxy API, dan basemap PMTiles z12 (216 MB) di `127.0.0.1:8080` |
| Iterasi selesai | **11e** (lapisan kelas kerawanan desa di antarmuka + kolam koneksi basis data) — `P4` kerawanan desa di API 11d, `P4` kerawanan di antarmuka 11c, `P4` di API 11b, basis data pindah ke Aiven pada 11a, `P2`/`W1` di API 10a dan di antarmuka 10b, basemap 09c, nginx 09b, unit systemd 09a, penyisipan 08a, 07a, 06b) — rincian dan hasil ukurnya di [`docs/ITERATIONS.md`](docs/ITERATIONS.md) |

Purwarupa untuk penilaian tugas akhir; belum layak dipakai publik.

## Mulai dari sini

| Kalau Anda ingin tahu… | Buka |
|---|---|
| produk ini untuk siapa dan mengerjakan apa | [`docs/PRD.md`](docs/PRD.md) |
| apa yang harus jalan lebih dulu (batas MVP) | [`docs/MVP.md`](docs/MVP.md) |
| apa saja yang sudah dikerjakan + hasil ukurnya | [`docs/ITERATIONS.md`](docs/ITERATIONS.md) |
| aturan penamaan, bahasa, commit, dan alur git | [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) |
| daftar isi folder `docs/` | [`docs/README.md`](docs/README.md) |

## Struktur

```
project-GeoSafe/
├── backend/                    FastAPI + PostgreSQL/PostGIS (Python 3.12+)
│   ├── pyproject.toml · uv.lock        dependensi + versi terkunci (uv)
│   ├── app/
│   │   ├── main.py                     aplikasi FastAPI, daftar router
│   │   ├── config.py                   DSN basis data dari variabel lingkungan
│   │   ├── db.py                       koneksi psycopg per permintaan
│   │   └── routers/                    satu berkas per kelompok fitur
│   └── tests/                          pytest (butuh basis data hidup)
├── frontend/                   React + TypeScript · Vite 7.3.8 · Tailwind 4 · MapLibre
│   ├── package.json · package-lock.json
│   ├── vite.config.ts                  plugin, proxy API, konfigurasi Vitest
│   ├── README.md                       cara jalan, struktur, yang sengaja belum ada
│   └── src/
│       ├── App.tsx                     tata letak halaman + keadaan tahun/tingkat/pilihan
│       ├── api/                        client fetch + satu fungsi per endpoint
│       ├── components/                 map/ · search/ · panel/ · common/
│       ├── hooks/                      pencarian, panel, sumber data, debounce
│       ├── lib/                        konstanta, format angka, kelas choropleth
│       ├── types/                      bentuk balasan API
│       └── test/                       setup Vitest
├── deploy/                     berkas layanan: nginx (situs) · systemd (unit) — **di luar git**
└── docs/                       dokumen kerja (PRD, MVP, iterasi, konvensi)
```

`deploy/` sengaja **tidak** masuk repo (keputusan 2026-11-17): isinya terikat ke
mesin ini (jalur mutlak, nama pengguna, port), sedangkan repo dipublikasikan.
Berkasnya tetap ada di disk dan `/etc/nginx/sites-enabled/geosafe` serta
`~/.config/systemd/user/geosafe-api.service` adalah symlink ke sana; kalau mesin
ini hilang, keduanya perlu ditulis ulang dari `docs/ITERATIONS.md`.

Berkas router dinamai Inggris dan dipetakan ke kode fitur dokumen perencanaan
supaya bisa ditelusuri: `maps.py` (P1–P5) · `panels.py` (W1–W4) ·
`analysis.py` (A1–A3) · `search.py` (C1) · `latest.py` (P2) ·
`transparency.py` (T1). Berkas yang belum ada berarti fiturnya belum dikerjakan.

## Menjalankan backend

Prasyarat: `uv` terpasang, dan basis data `geosafe` hidup. **Sejak 2026-11-17 basis
data pengembangan ada di Aiven** (PostgreSQL 18.7 + PostGIS 3.6.4, TLS wajib); isi
kedua basis data identik, dipindahkan `pg_dump -Fc` + `pg_restore`. Koneksi basis
data dipinjam dari kolam kecil (`psycopg_pool`, maksimal 3 koneksi) karena
`max_connections` server Aiven hanya 15 — satu lapisan peta bisa meminta belasan
tile MVT sekaligus. Kontainer lokal
`pg` (port 5433, PostGIS 3.7.0) tetap dipakai untuk ETL lewat
`../planning-GeoSafe/data/pembangun/muat_postgres.py`.

```bash
cd backend
uv sync                                 # sekali; membuat .venv + uv.lock

# DSN basis data — di server lewat EnvironmentFile pada unit systemd
set -a; . ~/.config/geosafe/geosafe.env; set +a
export GEOSAFE_DATABASE_URL              # sudah menunjuk Aiven; lokal: GEOSAFE_DATABASE_URL_LOKAL

uv run pytest -q                        # uji endpoint (butuh basis data hidup)
uv run uvicorn app.main:app --reload    # http://127.0.0.1:8000
```

Cara pakai: uvicorn dapat dinyalakan manual seperti di atas, atau (di homelab) lewat
unit systemd pengguna `geosafe-api.service` — lihat [`docs/ITERATIONS.md`](docs/ITERATIONS.md)
penyisipan 09a. Halaman hasil build disajikan nginx di `http://127.0.0.1:8080`
(penyisipan 09b): `/` peta, `/tren` dan `/sumber` diarahkan ke `index.html`, `/api`
serta `/tiles` diteruskan ke API di port 8000, dan `/pmtiles/` menyajikan basemap
216 MB yang tersimpan di luar repo (penyisipan 09c).

Memuat kode backend yang baru: `systemctl --user restart geosafe-api`.
Memuat konfigurasi nginx yang baru: `npm run build` di `frontend/`, lalu
`sudo systemctl reload nginx` (permintaan beberapa saat setelah reload masih
dilayani proses lama — periksa ulang sebelum menyimpulkan).

Dokumentasi API hidup sendiri di `/docs` dan `/openapi.json` — dibuat FastAPI
dari kode, jadi tidak ada berkas daftar endpoint yang bisa tertinggal.

## Menjalankan frontend

Prasyarat: **Node 20.19 atau lebih baru** (Vite 7 menolak versi lebih lama).
Uji tidak butuh basis data; memakai aplikasinya butuh API di atas hidup.

```bash
cd frontend
npm ci            # sekali; memasang dari package-lock.json
npm run dev       # http://127.0.0.1:5173 — Vite mem-proxy /api dan /tiles ke 127.0.0.1:8000
npm test          # uji Vitest (jsdom), tanpa basis data dan tanpa jaringan
npm run build     # tsc --noEmit + vite build ke dist/
```

Rincian struktur, keputusan versi (Vite 7.3.8 karena CPU tanpa AVX), dan daftar
yang sengaja belum dikerjakan ada di [`frontend/README.md`](frontend/README.md).

### Endpoint

| Endpoint | Fitur | Isi |
|---|---|---|
| `GET /health` | — | status proses API |
| `GET /api/v1/sources` | T1 | daftar dataset sumber, institusi, tanggal akses, jumlah baris |
| `GET /tiles/regions/{z}/{x}/{y}.mvt?year=` | P1 | *vector tile* MVT kabupaten/kota + jumlah titik panas tahun itu |
| `GET /tiles/provinces/{z}/{x}/{y}.mvt?year=` | P1 | *vector tile* MVT provinsi (saklar tingkat tampilan) |
| `GET /tiles/risk/{z}/{x}/{y}.mvt?scheme=` | P4 | *vector tile* MVT kabupaten/kota + skor dan kelas kerawanan satu skema bobot (`a`/`b`/`c`) |
| `GET /api/v1/risk/schemes` | P4 | tiga skema bobot + uji sensitivitasnya (korelasi peringkat, jumlah wilayah berpindah kelas) + batasan yang wajib ditampilkan |
| `GET /tiles/risk/villages/{z}/{x}/{y}.mvt?province=` | P4 | *vector tile* MVT desa/kelurahan + kelas kerawanannya (`rendah`/`sedang`/`tinggi`/`tidak_ada_deteksi`), **satu provinsi**, hanya zoom 8–14 |
| `GET /api/v1/provinces` | P4 | 38 provinsi (kode, nama, kotak wilayah) + sebaran kelas kerawanan desa + dua celah datanya — bahan pemilih lapisan desa |
| `GET /api/v1/panel/kabupaten_kota/{kode}` | W2 | panel satu kabupaten/kota: titik panas per tahun, kejadian, status darurat 2025, IRBI |
| `GET /api/v1/search/regions?q=` | C1 | pencarian wilayah empat tingkat (provinsi, kabupaten/kota, kecamatan, desa/kelurahan), maksimal 20 baris + `bbox` untuk memperbesar peta |
| `GET /api/v1/analysis/national_trend` | A1 | tren nasional 2020–2026: titik panas (seri `main`/`fill`/`nrt` apa adanya + `archive_total`) dan kejadian, plus luas terbakar sebagai konteks |
| `GET /api/v1/point_coverage?year=` | T1 | berapa titik panas masuk poligon wilayah, berapa yang di luar (tidak dihitung nol) |
| `GET /api/v1/downloads` · `.../{berkas}` | T1 | daftar 29 tabel siap pakai + unduhan CSV-nya |
| `/api/v1/latest?window=` | P2 | titik panas terkini 24/48/72 jam (`series: nrt`), `region_code` hasil join saat permintaan, `satellites` beserta ketersediaannya |
| `/api/v1/latest/summary?window=` | W1 | ringkasan nasional: jumlah titik, kabupaten/kota terdampak, 10 provinsi terbanyak — tanpa titik mentah |

Catatan pemakaian: tile tanpa poligon dibalas `204`; wilayah yang belum punya
baris fakta tetap terkirim dengan properti `has_fact = 0` (pada lapisan kerawanan
namanya `has_score`, karena `0` di sana berarti *skor tidak diketahui*, bukan *nol
deteksi*); koordinat tile di luar rentang `0..2^z-1` dibalas `422`, bukan `500`;
lapisan desa hanya dilayani **per provinsi** (`?province=`) dan pada **zoom 8 ke
atas** — di bawah itu `422`, karena lapisan yang tetap dilayani justru menumpuk
seluruh provinsi ke segelintir tile raksasa; kelas `tidak_ada_deteksi` pada
lapisan desa berarti tidak ada satu pun deteksi, dan **bukan** kerawanan rendah;
panel menyertakan medan `notes` berisi batasan data yang **wajib** ikut
ditampilkan; pencarian membalas `200` dengan `results: []` + `notes` saat kata
kuncinya tidak menemukan wilayah (bukan `404`).

## Aturan singkat

Lima hal yang paling sering menentukan keputusan harian (lengkapnya di
[`docs/CONVENTIONS.md`](docs/CONVENTIONS.md)):

1. **Angka dan geometri hanya dari PostgreSQL.** Aplikasi tidak membaca CSV
   `siap-pakai/` langsung, dan tidak mengulang join titik ke wilayah di JavaScript.
2. **Tidak ada berkas atau folder cadangan.** Dibuat saat isinya ditulis, bukan
   sebagai placeholder.
3. **Gap berarti nol, dan itu harus dinyatakan.** ETL tidak menulis baris bernilai
   nol, jadi setiap endpoint yang angkanya bisa nol wajib menyebut tahun/seri yang
   tidak punya baris.
4. **Kode: nama Inggris, penjelasan Indonesia.** Pesan commit Bahasa Inggris
   (Conventional Commits); README dan dokumen Bahasa Indonesia.
5. **Berkas layanan hidup di mesin, bukan di repo.** `deploy/` diabaikan git —
   alasan, isi, dan cara memulihkannya ada di [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md).

## Dokumen

Dokumen akademik dan data tinggal di repo perencanaan — satu sumber kebenaran,
tidak disalin ke sini:

| Dokumen | Isi |
|---|---|
| `../planning-GeoSafe/docs/SRS-GeoSafe.md` | 126 kebutuhan ber-ID (`SRS-*`), 32 halaman |
| `../planning-GeoSafe/docs/ERD-GeoSafe.md` | 14 tabel, 30 relasi |
| `../planning-GeoSafe/docs/ARSITEKTUR.md` | pilihan bahasa, framework, basis data, penyajian, deploy |
| `../planning-GeoSafe/docs/alur-sistem.md` | aktor, use case, DFD, kamus data |
| `../planning-GeoSafe/docs/API-P2.md` | kontrak alur "titik panas terkini" |
| `../planning-GeoSafe/data/SUMBER.md` | seluruh dataset + URL + tanggal akses |

## Data dan lisensi

Angka berasal dari sumber terbuka: NASA FIRMS (titik panas), BNPB (kejadian
karhutla, rekap, status darurat), BNPB/InaRISK (IRBI), GWIS via OWID (luas
terbakar nasional), dan GeoPortal BNPB (batas administrasi). Masing-masing
mengikuti lisensi sumbernya; raster bahaya InaRISK **tidak** dipakai karena
lisensinya menuntut izin tertulis. Tujuh celah data yang diketahui — termasuk
korban dan kerusakan karhutla yang praktis kosong — tercantum di halaman T1
aplikasi dan di `docs/PRD.md` bagian 6.
