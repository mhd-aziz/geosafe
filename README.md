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
│   │   ├── main.py             aplikasi FastAPI + endpoint /health
│   │   ├── config.py           (menyusul) baca .env
│   │   ├── db.py               (menyusul) koneksi ke PostgreSQL `geosafe`
│   │   ├── cache.py            (menyusul) cache 15 menit + snapshot.json
│   │   ├── firms.py            (menyusul) tarik NASA FIRMS
│   │   └── routers/            (menyusul) satu berkas per kelompok fitur
│   └── tests/
│       └── test_health.py      pytest
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
uv run pytest -q                        # uji endpoint
uv run uvicorn app.main:app --reload    # /health · /docs · /openapi.json
```

Hasil nyata 2026-11-16: `uv sync` memasang 25 paket dari `uv.lock`; `uv run pytest`
**1 passed**; server hidup dan `GET /health` balas
`{"status":"ok","service":"geosafe-api","version":"0.1.0"}` dengan kode 200,
`/docs` dan `/openapi.json` juga 200.

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
