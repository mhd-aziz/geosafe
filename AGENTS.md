# AGENTS.md — GeoSafe

Purwarupa web GIS untuk memetakan sebaran titik panas (hotspot) sebagai indikator kerawanan karhutla di
Indonesia, unit analisis 514 kabupaten/kota. Repo ini hanya kode aplikasi: FastAPI (`backend/`) di atas
PostgreSQL 18.7 + PostGIS 3.7, plus `frontend/` (React + TS, Vite 7.3.8) dan `deploy/` (nginx + systemd)
yang **tidak masuk git** — berkas layanan itu hidup di mesin ini saja. Data, SRS, ERD, dan alur sistem
tinggal di repo perencanaan `../planning-GeoSafe/` — jangan disalin ke sini.

## Perintah (yang benar-benar dipakai)

```bash
cd backend
uv sync                                  # sekali; bikin .venv + uv.lock
export GEOSAFE_DATABASE_URL="host=127.0.0.1 port=5433 dbname=geosafe user=homelab password=***"
uv run pytest -q                         # 38 passed, ~11 dtk; butuh basis data hidup
uv run uvicorn app.main:app --reload     # http://127.0.0.1:8000
```
```bash
cd frontend
npm ci                                   # sekali, dari package-lock.json
npm test                                 # 44 passed (Vitest + jsdom), tanpa DB
npm run typecheck                        # tsc --noEmit
npm run build                            # tsc --noEmit + vite build ke dist/ (di-gitignore);
                                         #   nginx menyajikan dist/ di 127.0.0.1:8080
npm run dev                              # 127.0.0.1:5173, proxy /api + /tiles ke 8000
```

Kedua layanan sudah jalan: `systemctl --user restart geosafe-api` (kode baru),
`sudo systemctl reload nginx` (setelah build), `systemctl restart nginx`. Situsnya
`/etc/nginx/sites-enabled/geosafe` → `deploy/nginx/geosafe.conf`.

Basis data harus hidup: kontainer podman `pg`, port 5433, DB `geosafe` (kredensial dev di
`~/pg/KREDENSIAL.md`). Tidak ada klien `psql` di host — periksa isi basis data lewat kontainernya
(`podman exec pg psql -U homelab -d geosafe -c "..."`). Tidak ada `Makefile`, tidak ada CI, tidak ada
ESLint/Prettier — penjaga mutunya hanya `pytest`, `npm test`, dan `tsc --noEmit`. Dokumentasi API hidup
sendiri di `/docs` dan `/openapi.json`, jangan dibuatkan berkas daftar endpoint.

## Konvensi yang berlaku di kode

- Satu berkas router per kelompok fitur, namanya Inggris, dipetakan ke kode fitur dokumen perencanaan:
  `maps.py` (P1–P5), `panels.py` (W1–W4), `analysis.py` (A1–A3), `search.py` (C1), `latest.py` (P2),
  `transparency.py` (T1). Buat berkas **saat** fiturnya dikerjakan; berkas yang belum ada berarti belum
  dikerjakan.
- Router didaftarkan di `app/main.py`; tag memuat kode fitur (`tags=["P1 peta titik panas"]`).
- Endpoint yang menyentuh basis data ditulis `def` biasa (psycopg sinkron, FastAPI menjalankannya di
  threadpool), koneksi via `Depends(get_connection)` dari `app/db.py` (satu koneksi per permintaan,
  `autocommit`, hanya baca). Jangan diubah jadi `async def`.
- SQL: konstanta modul huruf besar (`QUERY_PANEL`) berisi parameter bernama `%(nama)s`, dijalankan dengan
  `dict_row`. Query ditulis di berkas router, bukan modul terpisah.
- Semua angka dan geometri dibaca dari PostgreSQL. Aplikasi **tidak** membaca CSV `siap-pakai/` dan tidak
  mengulang join titik-ke-wilayah di JavaScript — join hanya di SQL.
- Celah berarti nol, dan itu harus dinyatakan: ETL tidak menulis baris bernilai nol, jadi setiap angka
  yang bisa nol wajib menyebut tahun/seri yang tidak punya baris (panel pakai medan `notes`, tile pakai
  properti `has_fact`). Jangan menambah baris nol diam-diam.
- Nama berkas/fungsi/kelas/variabel/kolom JSON: Inggris, `snake_case` (fungsi & variabel), `PascalCase`
  (kelas), kolom JSON sama persis dengan kolom DB (`hotspot_count`, `region_code`). Komentar dan
  docstring: **Bahasa Indonesia**. README dan `docs/`: Bahasa Indonesia.
- Nama fungsi uji Bahasa Inggris, melekat ke perilaku (`test_empty_tile_answers_204`; perhatikan: aturan
  ini berlaku untuk **seluruh** nama fungsi, uji termasuk). Uji backend memakai `TestClient` dan menembak
  basis data hidup, lalu memeriksa angka nyata (mis. `len(body) > 47_657`); tidak ada tiruan/mock —
  kalau DB mati, uji memang harus gagal. Uji frontend sebaliknya: jsdom, tanpa DB dan jaringan.
- Balasan: tile tanpa poligon → `204` tanpa isi; wilayah tak dikenal → `404`, bukan objek kosong.

## Git

Trunk-based, cabang pendek, `main` selalu bisa dijalankan. Pesan commit Bahasa Inggris gaya Conventional
Commits: `feat|fix|docs|refactor|perf|test|build|ci|chore|style` dengan scope
`api|frontend|deploy|db|docs`, subjek imperatif huruf kecil tanpa titik, ≤ 72 karakter; alasan masuk
badan pesan. Cabang `feat/<slug>` · `fix/<slug>` · `docs/<slug>` · `chore/<slug>`; masuk `main` lewat PR
+ **squash merge**; cabang **tidak dihapus** setelah digabung; tandai hasil merge dengan tag
`iter-NN-<slug>`. `git push --force` dilarang.

Setiap iterasi baru: perbarui tabel Status di `README.md`, entri di `docs/ITERATIONS.md` (tulis perintah
dan angka hasil nyata, jangan yang meleset), dan antrean di `docs/MVP.md`. Perubahan kode lewat cabang;
dokumen boleh langsung ke `main`.

## Jebakan

1. Backend sudah berjalan sebagai unit systemd pengguna (`geosafe-api.service`, symlink ke
   `deploy/systemd/`) — jangan menyalakannya manual: `systemctl --user restart geosafe-api` memuat kode
   baru, `systemctl --user status geosafe-api` memeriksanya. uvicorn latar + port yang masih dipegang
   proses lama mati diam-diam (`address already in use`) dan pengukuran lalu membaca kode lama: cek
   `ss -ltnp` dulu. DSN ada di `~/.config/geosafe/geosafe.env` (di luar repo, `chmod 600`).
2. `uv run` tidak selalu ada di PATH sesi latar → pakai jalur mutlak `backend/.venv/bin/python`.
3. pytest hanya menemukan paket `app` karena `pythonpath = ["."]` di `backend/pyproject.toml`; jangan
   dihapus.
4. Tidak ada `.env` di repo (di-`.gitignore`). DSN **wajib** di-`export` dulu, kalau tidak
   `app/config.py` melempar `RuntimeError`.
5. `StarletteDeprecationWarning` soal `httpx`/`httpx2` adalah peringatan lama, bukan kegagalan
   (38 passed, 1 warning).
6. Nama folder `project-GeoSafe` dan `planning-GeoSafe` sengaja tidak diubah — jangan "dirapikan" tanpa
   persetujuan.
7. Merauke (`9301`) kini provinsi Papua Selatan, bukan Papua. Jangan mengandalkan pengetahuan lama soal
   pemekaran wilayah saat membuat uji.
8. `.env` di luar repo tidak mengutip DSN, jadi `source` di bash memotongnya menjadi `host=127.0.0.1`
   dan uji gagal di port 5432 (systemd membacanya utuh, API tetap sehat): `export
   GEOSAFE_DATABASE_URL="$(sed -n 's/^GEOSAFE_DATABASE_URL=//p' ~/.config/geosafe/geosafe.env)"`.
9. nginx harus memetakan `.mjs` ke `text/javascript`; tanpa itu worker MapLibre ditolak Chrome dan
   **peta kosong tanpa galat di antarmuka** (`curl` tetap 200). `reload nginx` tidak seketika, dan
   halaman yang dimuat ulang bisa memakai salinan lama karena `immutable` — uji lewat origin lain
   sebelum menyimpulkan.
10. `deploy/` tidak terlacak git dan hanya ada di disk mesin ini; `git rm --cached` + `git switch` pernah
    menghapus berkasnya (unit systemd selamat hanya karena sudah termuat di memori). Salin `deploy/` ke
    luar repo sebelum berpindah cabang; pulihkan dengan `git show <commit-sebelum-merge>:<path>`.
11. `gh` di sesi Hermes bisa menolak "not logged into any GitHub hosts" karena `XDG_CONFIG_HOME`
    menunjuk `~/.hermes/bot-desktop/xdg` — pakai `GH_CONFIG_DIR="$HOME/.config/gh"`.

Aturan lengkap dan alasan tiap keputusan: `docs/CONVENTIONS.md`. Batas MVP dan urutan iterasi:
`docs/MVP.md`.
