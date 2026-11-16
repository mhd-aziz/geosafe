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
| Backend (`backend/`) | berjalan — 4 endpoint, `uv run pytest` 11 passed |
| Frontend (`frontend/`) | belum mulai |
| Deploy (`deploy/`) | belum mulai (nginx + systemd menyusul) |
| Iterasi selesai | 4 — rincian dan hasil ukurnya di [`docs/ITERATIONS.md`](docs/ITERATIONS.md) |

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
├── frontend/                   React + TypeScript · Vite 7.3.8 (belum diisi)
├── deploy/                     nginx (SPA + proxy) · systemd (belum diisi)
└── docs/                       dokumen kerja (PRD, MVP, iterasi, konvensi)
```

Berkas router dinamai Inggris dan dipetakan ke kode fitur dokumen perencanaan
supaya bisa ditelusuri: `maps.py` (P1–P5) · `panels.py` (W1–W4) ·
`analysis.py` (A1–A3) · `search.py` (C1) · `latest.py` (P2) ·
`transparency.py` (T1). Berkas yang belum ada berarti fiturnya belum dikerjakan.

## Menjalankan backend

Prasyarat: `uv` terpasang, dan basis data `geosafe` hidup (PostgreSQL 18.7 +
PostGIS 3.7 pada kontainer `pg`, port 5433). Isinya dimuat dari repo perencanaan
lewat `data/pembangun/muat_postgres.py`.

```bash
cd backend
uv sync                                 # sekali; membuat .venv + uv.lock

# DSN basis data — di server nanti lewat EnvironmentFile pada unit systemd
export GEOSAFE_DATABASE_URL="host=127.0.0.1 port=5433 dbname=geosafe user=... password=..."

uv run pytest -q                        # uji endpoint (butuh basis data hidup)
uv run uvicorn app.main:app --reload    # http://127.0.0.1:8000
```

Dokumentasi API hidup sendiri di `/docs` dan `/openapi.json` — dibuat FastAPI
dari kode, jadi tidak ada berkas daftar endpoint yang bisa tertinggal.

### Endpoint

| Endpoint | Fitur | Isi |
|---|---|---|
| `GET /health` | — | status proses API |
| `GET /api/v1/sources` | T1 | daftar dataset sumber, institusi, tanggal akses, jumlah baris |
| `GET /tiles/regions/{z}/{x}/{y}.mvt?year=` | P1 | *vector tile* MVT kabupaten/kota + jumlah titik panas tahun itu |
| `GET /api/v1/panel/kabupaten_kota/{kode}` | W2 | panel satu kabupaten/kota: titik panas per tahun, kejadian, status darurat 2025, IRBI |

Catatan pemakaian: tile tanpa poligon dibalas `204`; wilayah yang belum punya
baris fakta tetap terkirim dengan properti `has_fact = 0`; panel menyertakan
medan `notes` berisi batasan data yang **wajib** ikut ditampilkan.

## Aturan singkat

Empat hal yang paling sering menentukan keputusan harian (lengkapnya di
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
