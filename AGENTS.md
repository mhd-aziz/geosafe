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
set -a; . ~/.config/geosafe/geosafe.env; set +a
export GEOSAFE_DATABASE_URL               # Aiven (dev); lokal: GEOSAFE_DATABASE_URL_LOKAL
uv run pytest -q                         # 96 passed, 30-115 dtk (Aiven); butuh basis data hidup
uv run uvicorn app.main:app --reload     # http://127.0.0.1:8000
```
```bash
cd frontend
npm ci                                   # sekali, dari package-lock.json
npm test                                 # 113 passed (16 berkas, Vitest + jsdom), tanpa DB
npm run typecheck                        # tsc --noEmit
npm run build                            # tsc --noEmit + vite build ke dist/ (di-gitignore);
                                         #   nginx menyajikan dist/ di 127.0.0.1:8080
npm run dev                              # 127.0.0.1:5173, proxy /api + /tiles ke 8000
```

Kedua layanan sudah jalan: `systemctl --user restart geosafe-api` (kode baru),
`sudo systemctl reload nginx` (setelah build), `systemctl restart nginx`. Situsnya
`/etc/nginx/sites-enabled/geosafe` → `deploy/nginx/geosafe.conf`.

CI ada di GitHub Actions (`.github/workflows/ci.yml`, sejak 2026-11-19): setiap push dan PR
menjalankan `frontend` (typecheck · `npm test` · build) dan `backend` (`uv sync --frozen` →
`pytest --collect-only` → `pytest` ke basis data hidup). Uji basis data memakai rahasia repo
`GEOSAFE_DATABASE_URL` berisi role **baca-saja** `geosafe_ci` (hanya SELECT); PR dari fork tidak
menerima secret itu, jadi hanya koleksi uji yang diperiksa dan alasannya ditulis di ringkasan job.
Tidak ada ESLint/Prettier — yang diperiksa CI persis yang diperiksa di mesin ini. Dua uji unduhan
(`test_daftar_unduhan_memuat_tabel_siap_pakai`, `test_unduh_berkas_tabel_siap_pakai_berisi_csv_nyata`)
**dilewati** di runner karena folder `../planning-GeoSafe/data/siap-pakai/` ada di luar repo; jangan
menggantinya dengan tiruan — endpoint-nya sendiri sudah menjawab jujur (`count: 0` + catatan).

CD ada di `.github/workflows/deploy.yml` dan berjalan **hanya pada push ke `main`**: runner
**self-hosted** di mesin ini (label `geosafe`, `~/actions-runner`, unit pengguna
`geosafe-runner.service`) menyinkronkan working copy (`git fetch` + `merge --ff-only origin/main` —
**tidak** `reset --hard`, supaya cabang lain dan pekerjaan yang belum di-commit tidak tertimpa;
deploy gagal dengan pesan jelas kalau working copy tidak di `main` atau kotor), menjalankan
`uv sync --frozen`, `npm ci && npm run build`, `systemctl --user restart geosafe-api`,
`sudo systemctl reload nginx`, lalu uji asap `:8080` + `/health` + panel Merauke. Runner ini
mengeksekusi kode di mesin yang menyimpan layanan, karena itu workflow-nya **tidak pernah** memakai
pemicu `pull_request`; jangan menambahkannya.

Pratinjau di Vercel memakai **frontend saja**; API tetap di mesin ini dan dijangkau lewat Cloudflare
Tunnel `geosafe-api.zisaltech.site` → `127.0.0.1:8000` (`/etc/cloudflared/config-geosafe-api.yml`,
unit sistem `cloudflared-geosafe-api.service`). Karena origin pratinjau berbeda domain, `app/main.py`
memasang `CORSMiddleware`: origin dari `GEOSAFE_ALLOWED_ORIGINS` (dipisah koma, bawaan dua alamat
lokal) plus pola `https://geosafe*.vercel.app`, hanya metode `GET`. Alamat API untuk build Vercel
diberikan lewat `VITE_API_BASE`; jangan menulis alamat itu di kode.

Pratinjau frontend ada di Vercel: proyek **`geosafe`** (`prj_SoYy4Gxw8MXbVFjLc8GZH9p4B3IB`, tim
`muhamad-azizs-projects-83e323d5`), Root Directory `frontend`, framework Vite, Node `26.x`.
Variabel proyek `VITE_API_BASE=https://geosafe-api.zisaltech.site` untuk production + preview +
development; nilainya masuk ke bundle **saat build**, jadi mengubahnya butuh deploy ulang. Alias:
`geosafe-muhamad-azizs-projects-83e323d5.vercel.app` (produksi) dan `geosafe-git-<cabang>-…` (pratinjau).
Vercel Authentication dimatikan supaya tautannya bisa dibuka tanpa login; jangan dinyalakan lagi tanpa
alasan. **Repo ini juga tertaut ke proyek Vercel lain `omniroute-relay`** yang berada di luar scope
token MCP (API membalas 404 walau check-nya muncul di PR); melepas tautan itu harus lewat dasbor
Vercel: proyek `omniroute-relay` → Settings → Git → Disconnect.

Basemap PMTiles (216 MB) **tidak** ikut ke Vercel sebagai berkas repo; berkasnya diunggah ke **Vercel
Blob** (store `geosafe-basemap-files`, publik, region `sin1`) dan alamatnya diberikan lewat
`VITE_BASEMAP_URL` (`pmtiles://https://nwn0yxwn6uggklp6.public.blob.vercel-storage.com/indonesia.pmtiles`).
Unggahannya 206,1 MB dalam 43,7 dtk lewat token unggah sisi-klien (`@vercel/blob/client`), bukan lewat
badan fungsi: fungsi Vercel membatasi badan permintaan beberapa MB dan percobaan pertama berakhir
`terminated`. **Server homelab tidak lagi melayani basemap ke internet**: host
`geosafe-tiles.zisaltech.site` sudah dicabut dari ingress tunnel dan record CNAME-nya dihapus; nginx
tetap menyajikan `/pmtiles/indonesia.pmtiles` untuk `npm run dev` lokal. Tunnel yang tersisa hanya
`geosafe-api.zisaltech.site` → `127.0.0.1:8000`. **Kalau basemap gagal dimuat, seluruh peta kosong** —
bukan hanya latar: layer tematik dipasang setelah gaya selesai dimuat, jadi kegagalan sumber basemap
menunda semuanya.

**Jangan menyimpulkan "peta kosong" dari tab latar belakang.** Chrome menahan `requestAnimationFrame`
di tab yang tidak aktif, sehingga MapLibre tidak pernah menggambar: `isStyleLoaded()` selamanya
`false`, `getStyle()` tanpa layer, tanpa satu pun permintaan tile di `performance`, dan tangkapan layar
hanya abu-abu rata — sama persis dengan gaya yang benar-benar rusak. Aktifkan tabnya dulu
(`Page.bringToFront` lewat CDP atau buka di jendela yang terlihat) sebelum menyimpulkan ada bug.
Pewaktu juga ikut ditahan, jadi perbaikan berbasis `setTimeout` tampak mati di tab latar.

Basis data harus hidup: **Aiven PostgreSQL 18.7 + PostGIS 3.6.4** (basis data `geosafe`, TLS wajib)
sejak 2026-11-17, DSN di `~/.config/geosafe/geosafe.env` (jangan pernah ditulis di repo). Koneksi
lewat kolam kecil (`psycopg_pool`, maksimal 3) karena `max_connections` server hanya 15 — lihat
jebakan 16. Kontainer
podman `pg` (port 5433, PostGIS 3.7.0) tetap hidup untuk ETL; `psql` 18.6 ada di host, jadi periksa
isi langsung (`PGPASSWORD=... psql -h 127.0.0.1 -p 5433 -U homelab -d geosafe`) atau lewat Aiven MCP
(`aiven_pg_read`, service `pg`, project `aziz`, database `geosafe` — hanya SELECT). Data dipindahkan
`pg_dump -Fc` + `pg_restore`; setiap perubahan `data/siap-pakai/` wajib dipulangkan ke Aiven dengan
`python3 ../planning-GeoSafe/data/pembangun/sinkron_aiven.py` (data saja, ±10 menit, verifikasi otomatis;
jalankan di latar, bukan di sel kode — batas 300 dtk memotongnya). Tidak ada `Makefile` dan tidak ada
ESLint/Prettier — penjaga mutunya `pytest`, `npm test`, `tsc --noEmit`, dan CI GitHub Actions
(`.github/workflows/ci.yml`) yang menjalankan ketiganya pada setiap push dan PR. Dokumentasi API hidup
sendiri di `/docs` dan `/openapi.json`, jangan dibuatkan berkas daftar endpoint.

## Konvensi yang berlaku di kode

- Satu berkas router per kelompok fitur, namanya Inggris, dipetakan ke kode fitur dokumen perencanaan:
  `maps.py` (P1, P3, P5 — tile MVT jumlah titik panas), `risk.py` (P4 — skor kerawanan +
  uji sensitivitas + kelas kerawanan desa per provinsi), `panels.py` (W1–W4), `analysis.py` (A1–A3), `search.py` (C1), `latest.py`
  (P2 — terkini, cache 15 menit), `transparency.py` (T1). Berkas dipisah saat fiturnya membawa
  perilaku sendiri (cache/snapshot di `latest.py`, skema bobot di `risk.py`), bukan menurut nomor
  kelompoknya. Buat berkas **saat** fiturnya dikerjakan; berkas yang belum ada berarti belum
  dikerjakan.
- Router didaftarkan di `app/main.py`; tag memuat kode fitur (`tags=["P1 peta titik panas"]`).
- Endpoint yang menyentuh basis data ditulis `def` biasa (psycopg sinkron, FastAPI menjalankannya di
  threadpool), koneksi via `Depends(get_connection)` dari `app/db.py` (satu koneksi per permintaan,
  `autocommit`, hanya baca). Jangan diubah jadi `async def`.
- SQL: konstanta modul huruf besar (`QUERY_PANEL`) berisi parameter bernama `%(nama)s`, dijalankan dengan
  `dict_row`. Query ditulis di berkas router, bukan modul terpisah.
- Semua angka dan geometri dibaca dari PostgreSQL. Aplikasi **tidak** membaca CSV `siap-pakai/` dan tidak
  mengulang join titik-ke-wilayah di JavaScript — join hanya di SQL.
- Nol ditulis eksplisit, dan artinya harus dinyatakan: sejak data dibangun ulang 2026-11-19 ETL
  **menulis baris bernilai 0**, jadi `hotspot_count = 0` berarti nol deteksi yang terukur. Yang
  masih mungkin tidak punya baris adalah wilayah yang belum dimuat sama sekali; itu ditandai
  `has_fact = 0` (tile) dan disebut di `notes` (panel). Jangan mencampur dua keadaan itu, dan
  jangan menambah baris nol diam-diam tanpa menyebut tahun/serinya.
- Nama berkas/fungsi/kelas/variabel/kolom JSON: Inggris, `snake_case` (fungsi & variabel), `PascalCase`
  (kelas), kolom JSON sama persis dengan kolom DB (`hotspot_count`, `region_code`). Komentar dan
  docstring: **Bahasa Indonesia**. README dan `docs/`: Bahasa Indonesia.
- Nama fungsi uji Python Bahasa Inggris, melekat ke perilaku (`test_empty_tile_answers_204`;
  perhatikan: aturan ini berlaku untuk **seluruh** nama fungsi Python, uji termasuk); deskripsi
  `it()` di frontend Bahasa Indonesia seperti suite yang sudah ada. Uji backend memakai `TestClient` dan menembak
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
   (80 passed, 1 warning).
6. Nama folder `project-GeoSafe` dan `planning-GeoSafe` sengaja tidak diubah — jangan "dirapikan" tanpa
   persetujuan.
7. Merauke (`9301`) kini provinsi Papua Selatan, bukan Papua. Jangan mengandalkan pengetahuan lama soal
   pemekaran wilayah saat membuat uji.
8. `.env` di luar repo sudah mengutip DSN (2026-11-17), jadi `source` di bash **dan** `EnvironmentFile`
   systemd sama-sama membacanya utuh. Kalau suatu saat berkas sejenis ditulis tanpa kutip, `source`
   hanya menangkap kata pertama (`host=127.0.0.1`), uji gagal di port 5432, sementara systemd tetap
   sehat. Ambil nilainya dengan `sed`, tetapi **buang tanda kutipnya**:

   ```bash
   export GEOSAFE_DATABASE_URL="$(sed -n 's/^GEOSAFE_DATABASE_URL=//p' ~/.config/geosafe/geosafe.env | tr -d '"')"
   ```

   `tr -d '"'` bukan hiasan: berkas yang mengutip DSN membuat `sed` ikut membawa tanda kutip, dan
   psycopg menolak DSN berawalan kutip — 2026-11-17 perintah tanpa `tr` menghasilkan **52 gagal,
   17 lulus** dari 69 uji yang ada saat itu (suite kini 80 uji). Setelah dijalankan, periksa dua hal:
   panjang nilainya (berkutip = 2 karakter lebih panjang) dan `pytest` hijau.
9. nginx harus memetakan `.mjs` ke `text/javascript`; tanpa itu worker MapLibre ditolak Chrome dan
   **peta kosong tanpa galat di antarmuka** (`curl` tetap 200). `reload nginx` tidak seketika, dan
   halaman yang dimuat ulang bisa memakai salinan lama karena `immutable` — uji lewat origin lain
   sebelum menyimpulkan.
10. `deploy/` tidak terlacak git dan hanya ada di disk mesin ini; `git rm --cached` + `git switch` pernah
    menghapus berkasnya (unit systemd selamat hanya karena sudah termuat di memori). Salin `deploy/` ke
    luar repo sebelum berpindah cabang; pulihkan dengan `git show <commit-sebelum-merge>:<path>`.
11. `gh` di sesi Hermes bisa menolak "not logged into any GitHub hosts" karena `XDG_CONFIG_HOME`
    menunjuk `~/.hermes/bot-desktop/xdg` — pakai `GH_CONFIG_DIR="$HOME/.config/gh"`.
12. Basemap 216 MB ada di `../planning-GeoSafe/data/basemap/indonesia.pmtiles` (di luar repo) dan
    dilayani nginx pada `/pmtiles/`; `npm run dev` meneruskan `/pmtiles` ke nginx, jadi nginx harus
    hidup. Kalau peta kosong: `curl -r 0-99 -D- http://127.0.0.1:8080/pmtiles/indonesia.pmtiles`
    harus menjawab `206` + `Content-Range`. Tanpa internet nama tempat hilang (font dan sprite
    diambil dari `protomaps.github.io/basemaps-assets`), geometri tetap tergambar.
13. Koordinat tile yang sah hanya `0..2^z-1`; di luar itu `ST_TileEnvelope` melempar
    `Invalid tile x value` dan permintaan salah alamat berakhir `500`. Setiap endpoint tile baru
    wajib memanggil `check_tile_bounds(z, x, y)` dari `app/tiles.py` (membalas `422`). Aturan
    "tile kosong → 204" juga tinggal di berkas itu (`render_tile`), jangan disalin. Lapisan yang
    poligonnya sangat rapat punya batas zoom minimum di berkas yang sama
    (`check_zoom_floor`, lapisan desa: `z>=8`); uji batas zoom harus memakai koordinat yang
    **sah pada zoom itu** (`z=7` hanya `0..127`), kalau tidak penjaga rentang yang menjawab
    lebih dulu dan ujinya menguji hal yang salah.
14. Properti `has_fact` (lapisan titik panas) dan `has_score` (lapisan kerawanan) **tidak sama
    artinya**: `has_fact = 1` dengan `hotspot_count = 0` berarti nol deteksi yang terukur (nol
    eksplisit sejak data dibangun ulang 2026-11-19), sedangkan `has_fact = 0` berarti wilayah itu
    belum punya baris sama sekali; `has_score = 0` berarti skor kerawanan belum ada. Baris
    kerawanan di `region_facts` tidak bertahun/bulan/seri (periksa
    dengan `select ... where metric_code like 'risk_%'`), jadi join-nya wajib mengunci syarat itu
    atau poligon bisa tergandakan di dalam satu tile. Aturan yang sama berlaku untuk
    `village_facts` metrik `risk_class_desa` (83.315 baris, semuanya tanpa tahun).
15. **`minzoom` pada sumber MapLibre mematikan seluruh tile-nya saat peta belum cukup besar.**
    `transform.coveringTiles` berhenti lebih dulu (`z < minzoom` → daftar kosong), jadi sumber
    ber-`minzoom: 8` **tidak meminta satu tile pun** selama zoom peta membulat ke 7 ke bawah —
    gejalanya peta kosong tanpa galat, tanpa permintaan di log nginx, dan tanpa pesan di antarmuka
    (2026-11-17: lapisan desa diam total karena peta duduk di zoom 6,94). Karena itu zoom peta
    ikut dijaga (`map.setMinZoom(8)` selama lapisan desa aktif, `fitBounds` diberi `minZoom`),
    bukan hanya sumbernya.
16. **Koneksi basis data lewat kolam (`app/db.py`, `psycopg_pool`, maksimal 3), bukan satu koneksi
    per permintaan.** `max_connections` Aiven hanya **15** dan 11 di antaranya dipakai proses
    internalnya, sehingga satu lapisan peta yang meminta belasan tile MVT sekaligus membuat server
    menolak koneksi (`FATAL: remaining connection slots are reserved for roles with the SUPERUSER
    attribute`) dan sebagian tile dijawab `500`. Jangan menaikkan `max_size` tanpa memeriksa
    `select count(*) from pg_stat_activity` lebih dulu.
17. **Uji backend memeriksa angka, jadi data yang dibangun ulang membuatnya merah — itu benar,
    bukan regresi.** Setelah Aiven dimuat ulang 2026-11-19 dengan seri baru, **12 dari 91 uji
    gagal** karena angkanya masih angka lama (2023 main 253.127 → 253.345, `nrt` hilang dari seri
    tahunan, kelas kerawanan 138/239/137 → 140/225/149, titik 1.452.263 → 918.319). Tindakan yang
    benar: perbarui angka dan teks `notes` di uji, lalu jalankan ulang; yang salah adalah
    menambahkan tiruan/mock supaya hijau. Kalau angka berubah tanpa data berubah, baru itu bug.
18. **Setiap uji yang menghitung `region_facts` harus menyaring tingkat wilayahnya.** Tabel itu
    memuat baris kabupaten/kota (`region_code` terisi), provinsi (`region_code` kosong,
    `province_code` terisi), dan nasional (keduanya kosong) dalam satu tabel: satu tahun punya
    **553 baris**, bukan 514. Tanpa `where region_code is not null`, hasilnya 553/… dan ujinya
    menguji hal yang salah.

Aturan lengkap dan alasan tiap keputusan: `docs/CONVENTIONS.md`. Batas MVP dan urutan iterasi:
`docs/MVP.md`.
