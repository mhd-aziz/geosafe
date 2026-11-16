# GeoSafe — aplikasi web pemetaan sebaran titik panas

Purwarupa aplikasi (kode sistem). Ini **bukan** repo perencanaan: data mentah,
proposal, SRS, ERD, dan alur sistem ada di `../planning-GeoSafe/`.

Aplikasi **belum dibangun**. Berkas ini penunjuk struktur dan aturan yang sudah
diputuskan; isi kode menyusul.

## Struktur

```
project-GeoSafe/
├── backend/                FastAPI + uvicorn + psycopg + httpx (Python 3.12+)
│   ├── app/                paket Python (huruf kecil sesuai PEP 8)
│   │   ├── main.py         (menyusul) aplikasi FastAPI + daftar router
│   │   ├── config.py       (menyusul) baca .env
│   │   ├── db.py           (menyusul) koneksi ke PostgreSQL `geosafe`
│   │   ├── cache.py        (menyusul) cache 15 menit + snapshot.json
│   │   ├── firms.py        (menyusul) tarik NASA FIRMS
│   │   └── routers/        satu berkas per kelompok fitur:
│   │                       peta · panel · analisis · cari · terkini · transparansi
│   └── tests/              pytest: endpoint + join titik→wilayah
├── frontend/               React + TypeScript · Vite 7.3.8 · MapLibre · ECharts
└── deploy/                 nginx (SPA + reverse proxy) · systemd (Restart=always)
```

Nama berkas di `backend/app/routers/` sengaja sama dengan kode fitur di dokumen
perencanaan — `peta` = P1–P5, `panel` = W1–W4, `analisis` = A1–A3, `cari` = C1,
`terkini` = P2, `transparansi` = T1.

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

Rujukan keputusan (di `../planning-GeoSafe/docs/`): `ARSITEKTUR.md` (penempatan
fisik) · `API-P2.md` (kontrak alur terkini) · `SRS-GeoSafe.md` (kebutuhan ber-ID) ·
`ERD-GeoSafe.md` (14 tabel) · `alur-sistem.md` (DFD dan kamus data).

## Menjalankan (belum bisa)

Backend dan frontend belum ada isinya. Urutan pengerjaan yang direncanakan:

```bash
cd backend && uv sync            # menyusul: pyproject.toml
uv run uvicorn app.main:app --reload
cd frontend && npm install       # menyusul: package.json (Vite 7.3.8, Node 22 LTS)
```

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
