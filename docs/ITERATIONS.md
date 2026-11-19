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
| 05 | `feat/api-search` | pencarian wilayah empat tingkat (C1) | #5 | `iter-05-api-search` |
| 06 | `feat/api-trend` | tren nasional dua seri + luas terbakar konteks (A1) | #6 | `iter-06-api-trend` |
| 06b | `refactor/api-english-identifiers` | seluruh identifier jadi Bahasa Inggris (termasuk nama uji); cabang **dihapus** setelah merge | #7 | `iter-06b-english-names` |
| 07a | `feat/api-province-tiles` | tile provinsi untuk saklar tingkat tampilan (P1) | #8 | `iter-07a-province-tiles` |
| 07 | `feat/frontend-app` | frontend: peta choropleth + pencarian + panel (alur MVP) | #9 | `iter-07-frontend` |
| 09a | `chore/deploy-api-service` | API berjalan sebagai unit systemd pengguna (`Restart=always`) | #10 | `iter-09a-api-service` |
| 09b | `chore/deploy-nginx` | nginx menyajikan halaman hasil build + proxy API; berkas `deploy/` dikeluarkan dari git | #13 | `iter-09b-nginx` |
| 09c | `feat/frontend-basemap` | basemap PMTiles z12 (216 MB) di luar repo, dilayani nginx `/pmtiles/`, gaya Protomaps di frontend | #14 | `iter-09c-basemap` |
| 10a | `feat/api-latest-hotspots` | `P2`/`W1` di API: tarikan FIRMS, cache 15 menit, snapshot, join kabupaten/kota saat permintaan | #15 | `iter-10a-latest-api` |
| 10b | `feat/frontend-latest` | `P2`/`W1` di antarmuka: lapisan titik terkini, pemilih 24/48/72 jam, panel ringkasan nasional | #16 | `iter-10b-frontend-latest` |
| 08a | `feat/api-transparency-downloads` | titik di luar poligon, cetak unduhan tabel siap pakai, penyaring `confidence` | #11 | `iter-08a-t1-api` |
| 08 | `feat/frontend-t1-trend` | halaman tren nasional (A1) + Sumber & Batas Data (T1) di balik router | #12 | `iter-08-frontend-t1` |
| 11a | `docs/aiven-database` | basis data **pengembangan pindah ke Aiven** (`geosafe`), `pg_dump -Fc` + `pg_restore`, DSN dari `~/.config/geosafe/geosafe.env` | #17 | `iter-11a-aiven-db` |
| 11b | `feat/api-risk-map` | `P4` di API: tile kerawanan tiga skema bobot + uji sensitivitas dari data, penjaga koordinat tile bersama | #19 | `iter-11b-risk-api` |
| 11c | `feat/frontend-risk-ui` | `P4` di antarmuka: lapisan kerawanan + pemilih skema, bacaan skor, perapian tampilan dan tata letak responsif | #20 | `iter-11c-risk-ui` |
| 11d | `feat/api-village-risk-tiles` | `P4` di API: tile kelas kerawanan desa per provinsi (`SRS-F-38`) + daftar provinsi untuk pemilihnya, pagar zoom di `app/tiles.py` | #21 | `iter-11d-village-risk-api` |
| 11e | `feat/frontend-village-risk` | `P4` di antarmuka: lapisan kerawanan desa + pemilih provinsi (`SRS-F-38`/`F-39`), zoom peta dijaga 8 ke atas; sekaligus `fix(api)` kolam koneksi basis data | #22 | `iter-11e-village-risk-ui` |
| 12a | `feat/api-panel-risk-density` | data hasil bangun ulang 2026-11-19 masuk aplikasi: 12 angka uji disinkronkan, panel `W2` memuat skor kerawanan tiga skema, label kepadatan diperbaiki | #23 | `iter-12a-data-sync-panel` |
| 12b | `fix/frontend-nrt-leftovers` | sisa seri NRT dibersihkan: kolom `nrt` dan kode mati di halaman tren hilang, T1 mengirim rincian seri arsip + menyatakan NRT tidak dimuat, `README` 29 → 31 tabel | belum | `iter-12b-t1-archive-nrt` |

Semua dikerjakan 2026-11-16, kecuali penyisipan 09b serta iterasi 11a, 11b, 11c, 11d, dan 11e (2026-11-17). Cabang **tidak dihapus** setelah digabung (lihat
[`CONVENTIONS.md`](CONVENTIONS.md) bagian 4) — satu pengecualian: cabang
`refactor/api-english-identifiers` dihapus atas permintaan pemilik repo, tag
`iter-06b-english-names` tetap dibuat.

---

## Iterasi 12b — `fix/frontend-nrt-leftovers` (PR belum dibuka)

Melanjutkan 12a: setelah seri `nrt` dikeluarkan dari tabel tahunan, tiga tempat di
antarmuka dan satu di API masih membicarakannya seolah masih ada. Iterasi ini
menutup butir 4 rencana "T1 memisahkan arsip vs NRT".

Berkas: `frontend/src/pages/{TrendPage,SourcesPage}.tsx` ·
`frontend/src/components/analysis/TrendChart.tsx` · `frontend/src/types/geosafe.ts` ·
`frontend/src/pages/{TrendPage,SourcesPage}.test.tsx` · `frontend/src/App.test.tsx` ·
`backend/app/routers/transparency.py` · `backend/tests/test_transparency.py` ·
`README.md` · `AGENTS.md` · `docs/{ITERATIONS,MVP}.md`.

Yang berubah:

| Hal | Sebelum | Sesudah |
|---|---|---|
| tabel angka per tahun di halaman tren | 6 kolom termasuk `nrt` yang selalu "—" | 5 kolom: `main`, `fill`, arsip, kejadian |
| keterangan grafik | "Seri nrt 2026: 600.323 titik …" (kode mati, `nrt` selalu `null`) | "nrt hanya hidup di lapisan titik panas terkini (24/48/72 jam)" |
| `point_coverage.totals` | `point_count`, `placed_count`, `outside_count`, `outside_share_percent` | + `series` (`{main: 889240, fill: 29079}`) |
| catatan `point_coverage` | tidak menyebut NRT sama sekali | menyatakan tabel hanya memuat seri arsip dan angka terkini tidak boleh dijumlahkan |
| halaman T1 | tidak ada rincian seri | "889.240 titik seri main + 29.079 titik seri fill; nrt tidak dimuat" |
| `README.md` | "29 tabel siap pakai" | **31** (sesuai `/api/v1/downloads`) |

Bukti:

| Uji | Hasil |
|---|---|
| `uv run pytest -q` | **93 passed**, 1 warning, 35,73 dtk (92 sebelum, +1 uji baru) |
| `npm run typecheck` · `npm test` | bersih · **113 passed** (16 berkas), 51,87 dtk (112 sebelum) |
| `npm run build` | 14,06 dtk |
| `curl :8080/api/v1/point_coverage` | 918.319 titik · `series` `{main: 889.240, fill: 29.079}` · 172.047 di luar (18,73 %) · catatan NRT ikut terkirim |
| `/api/v1/downloads` | **31** berkas (sebelumnya README menulis 29) |

Temuan:

1. **Kode mati lebih berbahaya daripada teks salah.** `TrendChart` masih memuat
   `nrtRows.map(...)` dan komentar berangka 600.323; karena `nrt` selalu `null`
   blok itu tidak pernah tampil, jadi tidak ada uji yang gagal — tapi pembaca kode
   dan dokumen mengira seri itu masih ada. Yang menemukannya pemeriksaan teks,
   bukan uji.
2. **`totals.series` membuat selisih bisa dipertanggungjawabkan tanpa tabel baru.**
   `main + fill = point_count` diuji di backend, jadi dua seri itu tidak bisa
   diam-diam digabung atau saling menggantikan.
3. Verifikasi peramban tetap tidak dilakukan (Chrome otomasi mati); angka diukur
   lewat `:8080` (nginx) dan uji jsdom.

## Iterasi 12a — `feat/api-panel-risk-density` (PR #23)

Tag `iter-12a-data-sync-panel` menandai commit hasil *squash merge* di `main`
(`9c5193e`), 2026-11-19.

Data di `../planning-GeoSafe/` dibangun ulang 2026-11-19 (arsip titik panas jadi
918.319 baris, NRT 621.100 dipisah, nol ditulis eksplisit, kepadatan dihitung
ulang) lalu dimuat ke Aiven. Repo aplikasi belum ikut berubah, jadi **12 dari 91
uji backend merah**: angkanya masih angka lama. Iterasi ini menyelaraskan kode
dan uji dengan data baru, sekaligus menutup dua butir "tahap 2 kualitas tampilan"
yang tidak perlu mengubah basis data: label kepadatan dan skor kerawanan di panel
`W2`.

Berkas: `app/routers/panels.py` · `app/routers/analysis.py` · `app/routers/maps.py`
· `tests/{test_analysis,test_panels,test_risk,test_risk_villages,test_tiles,test_transparency}.py`
· `frontend/src/{types/geosafe.ts,components/panel/RegionPanel.tsx,lib/{format,choropleth}.ts}`
· `components/panel/RegionPanel.test.tsx` · `AGENTS.md` · `README.md` · `docs/{ITERATIONS,MVP}.md`.

Yang berubah pada balasan API:

| Hal | Sebelum | Sesudah |
|---|---|---|
| `panel.risk` | tidak ada | `{default_scheme, risk_score_a…c, risk_class_a…c}` — nama medan = `metric_code` |
| catatan kepadatan | "mencakup seluruh seri tanpa tahun tertentu" | "kepadatan deteksi, rata-rata tahun lengkap 2020–2025, tanpa seri nrt; 2026 (198 hari) tidak ikut" |
| catatan tahun tanpa baris | "ETL tidak menulis baris bernilai nol" | "angka 0 berarti nol deteksi terukur; tahun tanpa baris berarti angkanya belum dimuat" |
| `analysis.national_trend` | memuat seri `nrt` 600.323 (2026) | seri `nrt` kosong untuk semua tahun + catatan bahwa NRT hanya hidup di `P2` |
| panel frontend | kolom `main`/`fill`/`nrt` | kolom `main`/`fill`; kartu "Skor kerawanan (skema a, susunan penelitian)" |

Bukti:

| Uji | Hasil |
|---|---|
| `uv run pytest -q` sebelum perubahan | **12 failed, 79 passed** (data baru, kode lama) |
| `uv run pytest -q` sesudah | **92 passed**, 1 warning, 32,19 dtk |
| `npm run typecheck` · `npm test` | bersih · **112 passed** (16 berkas), 53,15 dtk |
| `npm run build` | 14,62 dtk (`dist/assets/index-*.js` 1.444,66 kB, peringatan ukuran chunk tetap ada) |
| `curl :8080/api/v1/panel/kabupaten_kota/9301` | `risk_score_a` **73,88** · `risk_class_a` **tinggi** · `hotspot_per_1000_km2` 128,03 |
| `curl :8000/api/v1/analysis/national_trend` | 2023 `main` **253.345**, `archive_total` 256.222; 2026 `main` 54.084 + `fill` 7.093; `nrt` `null` di ketujuh tahun |
| `curl :8000/api/v1/point_coverage` | 918.319 titik · 746.272 masuk poligon (81,27%) · di luar 172.047 |
| `curl :8000/api/v1/risk/schemes` | berpindah kelas **112 / 87 / 53**; rho A–B 0,9294 · A–C 0,959 · B–C 0,9841 |
| `curl :8000/api/v1/provinces` | kelas desa **5.570 tinggi · 21.329 sedang · 8.853 rendah · 47.563 tanpa deteksi** |

Temuan:

1. **Uji berbasis angka memang jadi merah saat data berubah, dan itu bukan regresi.**
   Dua belas kegagalan semuanya berasal dari satu sebab: Aiven dimuat ulang
   (`point_count` 1.452.263 → 918.319, 2023 `main` 253.127 → 253.345, `nrt`
   hilang, kelas kerawanan 138/239/137 → 140/225/149). Yang benar adalah
   memperbarui angka + teks `notes`, bukan menambah tiruan supaya hijau — aturan
   ini ditulis sebagai jebakan 17 di `AGENTS.md`.
2. **`region_facts` memuat tiga tingkat wilayah dalam satu tabel.** Satu tahun
   berisi **553 baris** (514 kabupaten/kota + 38 provinsi + 1 nasional), bukan
   514. Uji yang menghitung baris tanpa `where region_code is not null` menguji
   hal yang salah; jebakan 18.
3. **Nol eksplisit mengubah arti `has_fact`.** Sejak bangun ulang, 2020 punya 514
   baris dengan **39 di antaranya bernilai 0** — dulu 39 wilayah itu tidak punya
   baris sama sekali. `has_fact = 1` + `hotspot_count = 0` sekarang berarti nol
   deteksi terukur, dan di peta wilayah itu jatuh ke kelas `0` (bukan abu-abu).
4. **Panel akhirnya memakai skema yang sama dengan peta.** `default_scheme`
   dikirim di balasan panel dan antarmuka membacanya, jadi panel tidak bisa
   menampilkan skema `b` sementara peta mewarnai skema `a`.
5. **Verifikasi peramban tidak dilakukan di iterasi ini** — Chrome otomasi
   (`127.0.0.1:9223`) mati saat pengerjaan. Angka dibuktikan lewat jalur HTTP
   nginx (`:8080`) dan uji jsdom, sesuai definisi selesai `MVP.md` bagian 4
   butir 2.

## Iterasi 11e — `feat/frontend-village-risk` (PR #22)

Tag `iter-11e-village-risk-ui` menandai commit hasil *squash merge* di `main`.

Bagian antarmuka dari `SRS-F-38`/`F-39`: lapisan kelas kerawanan desa/kelurahan
sampai ke peta, memakai dua endpoint yang sudah ada sejak 11d. Iterasi ini juga
membawa satu perbaikan API (`fix(api)`) yang **hanya ketahuan lewat jalur
peramban**, bukan lewat uji: kolam koneksi basis data.

Berkas: `frontend/src/lib/risk.ts` · `components/map/{thematic-layer,MapView,Legend,MapToolbar}.tsx` ·
`components/panel/VillagePanel.tsx` (baru) · `pages/MapPage.tsx` · `api/geosafe.ts` · `types/geosafe.ts` ·
`components/map/{MapView,thematic-layer}.test.ts(x)` (baru/diperluas) · uji lain yang ikut disesuaikan.
Backend: `app/db.py` · `app/main.py` · `pyproject.toml` · `uv.lock`.

Bentuknya: saklar **Lapisan** bertambah pilihan ketiga ("Kerawanan desa"), dan
saat aktif muncul pemilih **Provinsi** (diisi `/api/v1/provinces`) yang langsung
memperbesar peta ke kotak wilayah provinsi itu. Kelasnya empat —
`rendah`/`sedang`/`tinggi`/`tidak_ada_deteksi` — dengan warna sendiri, legenda
berisi jumlah desa tiap kelas, dan dua celah data yang disebut apa adanya (215
desa tanpa baris kelas, 812 desa tanpa kode kecamatan induk). Bacaan kursor
menulis nama desa + kecamatan + kelasnya; klik desa tidak membuka panel karena
`W4` belum ada.

Bukti — lewat HTTP dan peramban sungguhan (`http://127.0.0.1:8080`):

| Uji | Hasil |
|---|---|
| `npm run typecheck` · `npm test` · `npm run build` | bersih · **112 passed** (16 berkas, dari 93 di `main`) · 14,29 dtk |
| `uv run pytest -q` | **91 passed**, 1 warning, 79,04 dtk (`check` kolam mati, jadi tidak ada tambahan bolak-balik) |
| sapuan kursor 192 titik pada kanvas | **113 bacaan unik** (dari 0 sebelum perbaikan zoom) — tanpa pita galat |
| bacaan kursor vs basis data (6 desa) | Papasan/Bangsri `tidak_ada_deteksi` · Dermolo/Kembang `sedang` · Puncel/Dukuhseti `rendah` · Mulyoharjo/Jepara `sedang` · Bakaran Wetan/Juwana `tidak_ada_deteksi` · Guwo/Tlogowungu `tidak_ada_deteksi` — **sama persis** dengan `village_facts` |
| piksel kelas di daerah peta (969 × 534) | `tidak_ada_deteksi` **80.046** · `sedang` 43.055 · `rendah` 13.126 · `tinggi` 3.933 · abu tanpa kelas 21.545 (opasitas 0,78 di atas basemap) |
| swatch legenda | kelima warna ada: tinggi `#993404` · sedang `#fe9929` · rendah `#fee391` · tidak ada deteksi `#bdd7ee` · kelas belum ada `#d8dee9` |
| permintaan tile desa dari peramban | 39 permintaan, semuanya `?province=33` pada z=8 (tidak ada permintaan di bawah batas), jawaban 200/204; **tidak ada 500** setelah kolam koneksi |
| lebar 500 · 768 · 1439 px | `scrollWidth <= innerWidth` di ketiganya; tinggi peta 401 / 436 / 605 px; pemilih provinsi tetap ada dan aktif |
| `select count(*) from pg_stat_activity` | total 17 baris, 3 di antaranya koneksi aplikasi (kolam maksimal 3), sisanya proses internal Aiven |

Temuan:

1. **Sumber MapLibre ber-`minzoom` lebih tinggi daripada zoom peta tidak meminta satu
   tile pun.** Lapisan desa sempat diam total: sumbernya terpasang, `isSourceLoaded`
   `true`, tanpa galat di konsol, tanpa pita galat, dan **tanpa satu pun permintaan di
   log nginx** — sebabnya `transform.coveringTiles` berhenti lebih dulu saat
   `zoom < minzoom` (peta duduk di zoom 6,94, sumbernya `minzoom: 8`). Perbaikannya:
   zoom peta ikut dijaga (`map.setMinZoom(8)` selama lapisan desa aktif, `fitBounds`
   diberi `minZoom: 8`). Dua uji regresi ditambahkan di `MapView.test.tsx`
   (MapLibre ditiru, `addSource`/`setMinZoom`/`fitBounds` diperiksa).
2. **Cacat kelas yang sama tidak terlihat oleh uji komponen.** Uji `thematicSpec`
   dan `MapView` versi pertama lulus sementara petanya kosong; yang menemukannya
   adalah penyapuan kursor di peramban (0 bacaan dari 192 titik). Karena itu bukti
   iterasi ini berisi angka peramban, bukan hanya uji.
3. **Satu koneksi per permintaan tidak lagi cukup.** Saat lapisan desa meminta
   belasan tile sekaligus, Aiven menolak koneksi
   (`FATAL: remaining connection slots are reserved for roles with the SUPERUSER
   attribute`) dan 5 tile dijawab `500` dengan pita galat di peta. `max_connections`
   server hanya **15**, dan 11 di antaranya dipakai proses internal Aiven
   (TimescaleDB, pg_cron, pghoard, management-agent, 7 worker tanpa nama). Perbaikan:
   `app/db.py` memakai `psycopg_pool.ConnectionPool` (min 1, maks 3) yang ditutup lewat
   `lifespan` FastAPI; kolam juga menghapus jabat tangan TLS per permintaan. Ini
   pembatalan sadar keputusan iterasi 01 ("koneksi per permintaan cukup, 0,028 dtk")
   atas dasar pengukuran, seperti yang diminta komentar lama di berkas itu.
4. **Zoom minimum 375 px tidak bisa diverifikasi di peramban mesin ini.** Chrome
   menahan lebar jendela pada 500 px (`Browser.setWindowBounds` 375 → `innerWidth` 500),
   dan `Emulation.setDeviceMetricsOverride` diabaikan target yang sudah ada maupun
   target baru. Yang diukur: 500 px (di bawah ambang 640 px, jadi tata letak ponsel),
   768, dan 1439 px — ketiganya tanpa gulir horizontal. Klaim 375 px dari iterasi 11c
   tidak dibatalkan, hanya tidak diukur ulang di sini.

## Iterasi 11d — `feat/api-village-risk-tiles` (PR #21)

Tag `iter-11d-village-risk-api` menandai commit hasil *squash merge* di `main`.

Bagian API dari `SRS-F-38`: kelas kerawanan **desa/kelurahan** sebagai lapisan yang
dimuat per provinsi, dengan `SRS-F-39` (desa tanpa deteksi tidak boleh disebut
"rendah"). Datanya sudah ada sejak iterasi data (`village_facts` metrik
`risk_class_desa`, 83.315 baris), tetapi belum terjangkau peta sama sekali.

Berkas: `backend/app/routers/risk.py` · `backend/app/tiles.py` (pagar zoom baru) ·
`backend/tests/test_risk_villages.py` (baru, 11 uji).

Dua endpoint baru: `GET /tiles/risk/villages/{z}/{x}/{y}.mvt?province=NN` (properti
`village_code`, `village_name`, `district_code`, `district_name`, `region_code`,
`region_name`, `province_code`, `risk_class`, `has_score`) dan
`GET /api/v1/provinces` (38 provinsi: kode, nama, `bbox`, plus sebaran kelas dan
dua celah data) sebagai bahan pemilih lapisan.

Bukti — lewat HTTP di jalur aplikasi (`http://127.0.0.1:8080`, nginx mem-proxy
`/api` dan `/tiles`):

| Uji | Hasil |
|---|---|
| `/api/v1/provinces` | **200** · 0,83–1,20 dtk · 5.061 B · 38 provinsi · `min_zoom` 8 |
| sebaran kelas desa | `tidak_ada_deteksi` **43.753** · `sedang` 24.293 · `rendah` 8.881 · `tinggi` 6.388 (jumlah 83.315) |
| celah data | **215** desa tanpa baris kelas · **812** desa tanpa kode kecamatan induk |
| tile provinsi 33 (Jawa Tengah, 8.480 desa), z=8 | 6 tile, seluruhnya berisi, total **753 KB**, tile terbesar **334 KB** |
| z=9 | 20 tile (17 berisi), total 787 KB, terbesar 146 KB |
| z=10 | 80 tile (44 berisi), total 891 KB, terbesar 47 KB |
| z=7 dengan koordinat yang sah | **422** `z=7 di bawah batas lapisan ini` |
| z=9 x=9999 y=9999 | **422** `di luar rentang` |
| tanpa `province` | **422** `Field required` |
| `province=99` (kode sah, tanpa desa) | **204** |
| tile 9/410/266 `province=33` vs `province=35` | 26.197 B (memuat `3301010005`, `tidak_ada_deteksi`, `has_score`, `risk_villages`) vs **204 tanpa isi** — saringan provinsi bekerja, isi tidak bocor |
| `uv run pytest -q` | **91 passed**, 1 warning, 59,31 dtk (80 sebelum cabang) |

Temuan:

1. **Uji batas zoom harus memakai koordinat yang sah pada zoom itu.** Versi pertama
   menguji `z=7` dengan `x=410,y=266` — koordinat yang sah pada z=9, tetapi pada z=7
   rentangnya hanya `0..127`, sehingga yang menjawab lebih dulu adalah penjaga
   rentang, bukan penjaga zoom. Ujinya kini memakai `x=100,y=42` supaya yang
   diperiksa memang batas zoom.
2. **Probe SQL bukan pengganti pengukuran HTTP.** Ukuran tile terbesar z=8 tadinya
   dihitung dengan query yang tidak memuat semua properti (**267 KB**); angka
   sebenarnya lewat jalur aplikasi **334 KB** karena `district_code`,
   `region_code`, dan `has_score` ikut dikirim. Angka yang dipakai di komentar
   `VILLAGE_MIN_ZOOM` adalah angka HTTP.
3. **Agregat per provinsi terlalu mahal untuk keterangan tambahan.**
   `/api/v1/provinces` versi pertama mengirim jumlah desa per provinsi dan memakan
   **0,689 dtk** hanya untuk agregat itu (endpoint 2,83 dtk, karena seluruh panggilan
   ±1 dtk); dibuang → endpoint **0,83 dtk**. Celah 812 desa tanpa kecamatan induk
   tetap dihitung, lewat `not exists` (0,07–0,10 dtk), supaya penjumlahannya tidak
   tampak bulat tanpa alasan.
4. **`provinces` punya 39 baris, bukan 38.** Selain 38 provinsi ada satu baris
   `level = 'national'` (kode `00`, `INDONESIA`) tanpa geometri; tanpa
   `where level = 'province'` daftar pemilih memuat satu entri berkotak kosong.
5. **Kode provinsi tak dikenal dijawab `204`, bukan `404`.** Kode datang dari
   pemilih yang diisi endpoint ini, dan seluruh API ini memakai aturan "tile tanpa
   poligon = 204"; format kode tetap dijaga (`^\d{2}$` → selain itu `422`).

## Iterasi 11a — basis data pengembangan di Aiven (PR #17)

Tidak ada perubahan kode: `app/config.py` sudah membaca `GEOSAFE_DATABASE_URL`, jadi
pindah basis data cukup mengganti nilai di `~/.config/geosafe/geosafe.env` (dibaca unit
systemd lewat `EnvironmentFile`) dan me-restart `geosafe-api`.

Yang dikerjakan:

1. `CREATE DATABASE geosafe` + `CREATE EXTENSION postgis` di service Aiven (project
   `aziz`, service `pg`, PostgreSQL 18.7, PostGIS **3.6.4**, 8 GB storage, TLS wajib).
2. `pg_dump -Fc --no-owner --no-privileges` dari kontainer lokal (PostGIS 3.7.0) →
   `~/geosafe-migrasi/geosafe.dump`, **88.169.569 B, 27,951 dtk**.
3. `pg_restore --no-owner --no-privileges --no-acl` → Aiven, **4 mnt 04,581 dtk, 0 baris
   galat** (`restore.err` kosong). Serial, tanpa `-j`: service hanya 1 CPU / 1 GB RAM.
4. DSN lokal disimpan di baris komentar `# GEOSAFE_DATABASE_URL_LOKAL`, lalu
   `systemctl --user restart geosafe-api`.

Bukti (dua jalur independen):

| Pemeriksaan | Hasil |
|---|---|
| 16 tabel, jumlah baris | identik dengan lokal: `point_observations` 1.452.263 · `village_facts` 538.713 · `district_facts` 155.320 · `region_facts` 58.665 · `disaster_events` 6.383 · `villages` 83.530 · `districts` 7.357 · `regions`/`risk_index` 514 · `provinces` 39 · `metrics` 18 · `data_sources` 7 · `emergency_status` 495 |
| `sum(value)` per tabel fakta | identik (`region_facts` 8.991.817,94 · `district_facts` 7.322.733,34 · `village_facts` 48.361.519,78) |
| Indeks GiST + geometri | `ix_region_geom`, `ix_district_geom`, `ix_village_geom`, `ix_point_geom` ada; SRID 4326; 0 poligon kabupaten tidak valid |
| MCP Aiven (`aiven_pg_read`) | `point_observations` 1.452.263 · `village_facts` 538.713 · `region_facts` 58.665 · PostGIS 3.6.4 · 16 tabel publik → sama |
| API menulis ke Aiven? | `xact_commit` Aiven **512 → 534** untuk 10 permintaan panel; lokal 11.392 → 11.394 (hanya perintah ukur sendiri) |

Kinerja lewat nginx → API → Aiven (latensi WAN ±0,05–0,1 dtk):

| Permintaan | Waktu | Ukuran | Ambang |
|---|---|---|---|
| `panel/kabupaten_kota/9301?year=2026` | 0,233 dtk | 2.095 B | `NF-10` ≤300 ms — lolos |
| `analysis/national_trend` | 0,262 dtk | 2.200 B | lolos |
| `sources` | 0,332 dtk | 1.842 B | lolos |
| `tiles/regions/0/0/0.mvt?year=2026` | 0,569 dtk | 49.589 B | `NF-04` ≤500 ms — **meleset** |
| `tiles/regions/6/50/32.mvt?year=2026` | 0,705 dtk | 21.681 B | meleset |
| `search/regions?q=bogor` | 0,637 dtk | 1.455 B | di bawah 1 dtk |
| `point_coverage` | 4,146 dtk | 1.242 B | query menyapu 1,45 jt titik; kandidat cache |
| `latest/summary` | 6,940 dtk lalu 0,899 dtk | 1.328 B | biaya tarikan FIRMS, bukan basis data |

Temuan yang harus diingat:

1. **`pg_stat_user_tables.n_live_tup` bukan jumlah baris.** Angka 1.448.358 untuk
   `point_observations` adalah perkiraan statistik; hitungan tepat 1.452.263. Jangan
   memakai `n_live_tup` untuk memverifikasi migrasi.
2. **PostGIS turun versi minor** (3.7.0 → 3.6.4) aman karena dump mengirim EWKB, tetapi
   `spatial_ref_sys` **tidak** ikut dump (anggota ekstensi) dan dibuat oleh PostGIS Aiven.
3. **`avnadmin` bukan superuser** → `--no-owner --no-privileges --no-acl` wajib; ETL
   `muat_postgres.py` (tahap `buat-db`/`skema`) tidak bisa dijalankan langsung ke Aiven.
4. **Angka kinerja SRS (`NF-04`..`NF-08`) diukur pada basis data lokal** dan tidak
   berlaku untuk Aiven. Bila demo memakai Aiven, ukur ulang atau kembalikan DB ke lokal.
5. `psql` 18.6 kini ada di host — perintah `podman exec -i pg psql` tidak lagi wajib
   (dokumen lama yang masih menuliskannya perlu dikoreksi saat disentuh).
6. **Sinkronisasi ulang setelah data berubah** punya skrip sendiri di repo perencanaan:
   `data/pembangun/sinkron_aiven.py` (dump `--data-only` → lepas kunci asing → kosongkan
   tabel → restore → pasang kunci → verifikasi jumlah baris). Uji 2026-11-17 dua kali:
   16 tabel diperiksa, **0 berbeda**, 27 kunci asing dilepas dan 27 dipasang kembali
   (semuanya tervalidasi); satu putaran ±10 menit, 88 MB dump. Alasan melepas kunci: FK tidak
   `DEFERRABLE`, sedangkan `pg_restore` tidak menjamin urutan tabel yang aman dan
   `avnadmin` bukan superuser (tidak boleh `session_replication_role`).
7. `muat_postgres.py` menerima `GEOSAFE_DSN=<dsn>` untuk menembak basis data terkelola
   langsung; tahap `buat-db` dilewati otomatis (Aiven menolak `CREATE DATABASE`).
8. **Jangan menjalankan sinkronisasi dari `execute_code`**: batas sel 300 detik memotong
   proses di tengah jalan (pernah terjadi — kunci asing sempat terlepas). Pakai
   `terminal(background=true)`.

## Iterasi 11b — `feat/api-risk-map` (PR #19)

Tag `iter-11b-risk-api` menandai commit hasil *squash merge* di `main` (`5032c18`).

`P4` kerawanan versi B sampai ke API. Tidak ada perubahan ETL maupun basis data:
skor dan kelas kerawanan **sudah** dimuat ke `region_facts` sebagai metrik
`risk_score_a/b/c` (kolom `value`) dan `risk_class_a/b/c` (kolom `value_text`),
514 baris masing-masing, seluruhnya tanpa tahun, bulan, seri, dan kelas
kepercayaan. Yang dikerjakan adalah jalur bacanya.

Berkas: `backend/app/routers/risk.py` (baru) · `backend/app/tiles.py` (baru) ·
`backend/app/routers/maps.py` · `backend/app/main.py` ·
`backend/tests/test_risk.py` (baru) · `backend/tests/test_tiles.py` ·
`docs/CONVENTIONS.md` · `AGENTS.md`.

Bentuknya:

- `GET /tiles/risk/{z}/{x}/{y}.mvt?scheme=a|b|c` — 514 poligon kabupaten/kota
  dengan properti `risk_score`, `risk_class`, `scheme_code`, dan `has_score`.
  Hanya tingkat kabupaten/kota (`SRS-F-37`), jadi tidak ada varian provinsi.
- `GET /api/v1/risk/schemes` — tiga definisi skema bobot (A tampilan awal, B dan C
  sebagai uji), uji sensitivitas, dan `notes` yang menyatakan bahwa skor ini
  susunan penelitian (bukan angka BNPB), hanya berlaku di kabupaten/kota, dan
  IRBI 2025 tampil sejajar sebagai konteks (`SRS-F-33`..`F-37`).
- Bobot skema tinggal di kode sebagai definisi metode; **angka yang diukur**
  (skor, kelas, korelasi, jumlah berpindah kelas) dibaca dari PostgreSQL.
  Uji sensitivitas dihitung ulang setiap permintaan dari baris yang sama dengan
  yang digambar peta, jadi tidak ada salinan angka yang bisa menyimpang.

Bukti (`pytest`, DSN Aiven; HTTP lewat `http://127.0.0.1:8080` setelah
`systemctl --user restart geosafe-api`):

| Uji | Hasil |
|---|---|
| `pytest -q` | **80 passed**, 1 warning, 70,11 dtk (69 sebelum cabang) |
| `/tiles/risk/0/0/0.mvt` | 200 · **54.298 B** · 1,27 dtk (514 poligon) |
| `/tiles/risk/0/0/0.mvt?scheme=c` | 200 · 54.358 B · 0,75 dtk |
| `/tiles/risk/6/51/33.mvt` (Jawa) | 200 · 17.233 B · 0,39 dtk |
| `/tiles/risk/1/0/1.mvt` (laut) | **204** · 0 B |
| `/tiles/risk/0/5/5.mvt` (koordinat salah) | **422** · 77 B |
| `/api/v1/risk/schemes` | 200 · 1.545 B · 0,29 dtk |
| uji sensitivitas dari layanan | rho A–B **0,9252** · A–C **0,959** · B–C **0,9823**; berpindah kelas **106 / 75 / 53** |
| regresi jalur lama | `regions` 2020 → 200 · 49.965 B · `provinces` 2020 → 200 · 12.857 B · `/health` → 200 |

Temuan:

1. **Skor kerawanan sudah ada di basis data, jadi tidak perlu ETL baru.** Yang
   diperiksa lebih dulu: 6 metrik `risk_*` × 514 wilayah, `year`/`month`/`series`/
   `confidence` kosong seluruhnya (3.084 baris), sebaran kelas skema A = 138 tinggi ·
   239 sedang · 137 rendah, dan nilai `risk_score_a`/`risk_class_a` identik dengan
   `data/siap-pakai/tabel/risk_kabupaten_kota.csv`. Karena itu tidak ada
   `sinkron_aiven.py` di iterasi ini.
2. **Uji sensitivitas tidak disimpan sebagai tabel.** `risk_sensitivity.csv` hanya
   berisi tiga pasangan skema; menambah tabel baru berarti mengubah ERD (15 tabel),
   dokumentasi data, dan ETL. Sebagai gantinya korelasi peringkat Spearman dihitung
   dengan `corr()` atas `rank()` dan jumlah wilayah berpindah kelas dengan
   membandingkan `value_text`. Hasilnya sama dengan CSV kecuali digit keempat pada
   A–B: **0,9252 lawan 0,9251**, karena `rank()` memberi peringkat terendah untuk
   nilai kembar sedangkan `bangun_kerawanan.py` memakai peringkat rata-rata
   (dihitung ulang: 0,925172 lawan 0,925120; `regions_class_changed` tidak
   terpengaruh). Perbedaan itu ditulis di `notes` supaya tidak dikira salah hitung.
3. **`has_fact` tidak boleh dipinjam apa adanya.** Di lapisan titik panas `0`
   berarti *nol deteksi yang terukur* (ETL tidak menulis baris nol); di lapisan
   kerawanan `0` berarti *skor tidak diketahui*. Properti lapisan ini bernama
   `has_score` dan artinya ditulis di komentar, supaya antarmuka tidak
   memperlakukannya sebagai kelas terendah.
4. **Kinerja: tile kerawanan lebih mahal daripada tile titik panas.** `EXPLAIN
   (ANALYZE)` pada z0/0/0: 286,8 ms eksekusi + 118,7 ms perencanaan (pembanding
   tile titik panas 204,1 ms + 1,0 ms) karena dua join ke `region_facts`. Lewat
   HTTP di Aiven hasilnya 1,27 dtk — di atas ambang `NF-04` 500 ms, seperti tile
   titik panas di Aiven (0,57–0,67 dtk). Belum dioptimalkan; kandidatnya satu
   agregat pengganti dua join atau indeks parsial pada `metric_code`.
5. **Putaran perbaikan setelah tinjauan** (versi pertama ditolak `passed: false`):
   koordinat tile di luar rentang `0..2^z-1` menjalar ke `ST_TileEnvelope` dan
   membalas **500** — kini ada `check_tile_bounds()` bersama di `app/tiles.py`,
   dipakai ketiga endpoint (cacat yang sama ada di tile kabupaten/kota dan
   provinsi, jadi diperbaiki di akarnya); join kerawanan tidak mengunci syarat
   `year/month/series/confidence` sehingga baris bertahun di masa depan akan
   menggandakan poligon di dalam satu tile; properti `has_fact` bermakna lain
   (diganti `has_score`); muatan tile tidak bisa dilacak ke skemanya (ditambah
   `scheme_code`); toleransi uji rho 0,001 meloloskan dua cara hitung sekaligus
   (kini nilainya ditulis utuh); dan `risk.py` bertabrakan dengan peta
   berkas-router di `CONVENTIONS.md` yang menaruh P4 di `maps.py` — padahal P2
   sudah lebih dulu punya `latest.py`. Peta berkas kini memuat isi pohon yang
   sebenarnya beserta aturannya: berkas dipisah saat fiturnya membawa perilaku
   sendiri, bukan menurut nomor kelompok fitur.
6. **Nomor iterasi:** `11a` sudah dipakai untuk pemindahan basis data ke Aiven
   (PR #17), jadi pekerjaan P4 memakai `11b` (API), `11c` (antarmuka), dan `11d`
   (lapisan desa) — bukan `11`.

## Iterasi 11c — `feat/frontend-risk-ui` (PR #20)

`P4` sampai ke antarmuka, sekalian perapian tampilan dan tata letak responsif. Tidak ada
perubahan API maupun basis data: seluruh angka dibaca dari dua endpoint yang sudah ada
(`/tiles/risk`, `/api/v1/risk/schemes`).

Berkas: `frontend/src/lib/risk.ts` (baru) · `components/map/thematic-layer.ts` (baru) ·
`components/common/Segmented.tsx` (baru) · `components/panel/RiskPanel.tsx` (baru) ·
`components/map/{MapToolbar,Legend,MapView,LatestControl}.tsx` ·
`components/panel/RegionPanel.tsx` · `components/search/SearchBox.tsx` ·
`components/analysis/{TrendChart,BurnedAreaChart}.tsx` · `pages/{MapPage,TrendPage,SourcesPage}.tsx` ·
`App.tsx` · `index.css` · `api/geosafe.ts` · `types/geosafe.ts` · `lib/format.ts` · uji.

Bentuknya: saklar **Lapisan** (Titik panas / Kerawanan), pemilih **Skema** A/B/C, legenda yang
berganti per lapisan, dan panel skema berisi bobot + uji sensitivitas + catatan wajib. Saat
lapisan kerawanan aktif, penyaring tahun dan saklar provinsi dimatikan **beserta sebabnya di
teks layar**, dan membaca angka skor dilakukan lewat bacaan kursor di peta (`readoutText`),
karena peta hanya mewarnai kelasnya.

Bukti:

| Uji | Hasil |
|---|---|
| `npm run typecheck` | bersih |
| `npm test` | **93 passed**, 15 berkas (±50 dtk; 78 sebelum cabang) |
| `npm run build` | 14,42 dtk |
| lebar 375 · 768 · 1440 px | `scrollWidth <= innerWidth` di ketiganya; tinggi peta 471 / 573 / 727 px |
| warna kelas di peta | 7 titik uji dari pusat poligon: Kapuas Hulu `#a25b31`, Malinau `#eea84d`, Mimika `#f1e49f` (kelas tertimpa basemap pada opasitas 0,78) |
| bacaan kursor vs basis data | Kutai Timur **95,67 Tinggi** · Merauke **73,88 Tinggi** · Malinau **49,61 Sedang** — sama dengan `risk_score_a`/`risk_class_a` di basis data |
| uji sensitivitas di panel | 0,9252 · 106 (20,6 %) · 0,9590 · 75 (14,6 %) · 0,9823 · 53 (10,3 %) |
| pergantian lapisan | log nginx hanya memuat satu keluarga tile pada satu waktu (`/tiles/risk/...` **atau** `/tiles/regions/...`) |

Temuan:

1. **Pesan status harus berpasangan.** Versi pertama menerima daftar skema sebagai
   `RiskScheme[] | null`, sehingga saat `/risk/schemes` gagal blok kendali menulis "sedang
   dimuat" sementara panel di layar yang sama menulis "gagal dimuat". Prop diganti menjadi
   status permintaan (`RemoteState`), dan ujinya menegaskan tidak ada dua pesan bertentangan.
2. **Angka skor tidak boleh hanya ada di basis data.** Peta mewarnai kelas, jadi skor 0–100
   tidak terbaca di mana pun sampai ditambahkan bacaan kursor; angka yang muncul di layar
   dibandingkan dengan `risk_score_a` di basis data (95,67 / 73,88 / 49,61 — sama).
3. **Skema awal ditentukan API.** Nilai awal di klien hanya berlaku sebelum balasan API tiba;
   setelah itu `default_scheme` dari API yang dipakai, supaya keputusan "skema A sebagai
   tampilan awal" (`SRS-F-33`) tidak terpaku di dua tempat.
4. **Alasan kendali dinonaktifkan harus terbaca, bukan hanya di `title`.** Elemen nonaktif
   tidak dapat difokus, jadi pengguna keyboard tidak pernah melihat alasan itu.
5. **Uji warna harus matriks, bukan keanggotaan daftar.** Uji lama lolos walau warna `rendah`
   dan `tinggi` ditukar; sekarang pasangan kelas→warna ditulis eksplisit.
6. **Putaran perbaikan setelah tinjauan** (versi pertama ditolak `passed: false`): selain
   kelima hal di atas, daftar kelas di panel kini sama dengan legenda peta (termasuk penanda
   abu-abu "skor belum ada"), skema yang tidak ada di balasan API tidak lagi disimpulkan
   seolah skema A, `aria-live` dipasang pada status panel, legenda menyebut bahwa titik
   oranye di peta adalah titik panas terkini (seri berbeda, bukan kerawanan), `aria-label`
   bagian peta mengikuti lapisan aktif, wadah kendali di ponsel bisa digulir dengan roda
   tetikus (`pointer-events-auto` di layar kecil saja), dan `MapView` memakai
   `thematic-layer.ts` yang diuji tanpa WebGL (spesifikasi sumber/layer tidak boleh bertumpuk).
7. **Lapisan kelas kerawanan desa (`SRS-F-38`/`F-39`) belum dikerjakan** — datanya sudah ada
   di `village_facts`, lapisannya menjadi iterasi `11d`.

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

## Iterasi 05 — `feat/api-search` (PR #5)

`app/routers/search.py`: `GET /api/v1/search/regions?q=<kata kunci>&limit=20` —
satu query untuk empat tingkat sekaligus: provinsi (baris `level = 'national'`
dikecualikan; 39 baris `provinces`), kabupaten/kota (514), kecamatan (7.357),
desa/kelurahan (83.530). Router didaftarkan di `app/main.py`;
`tests/test_search.py`: 7 uji.

Bukti (`uv run pytest` → **18 passed**, 1 warning):

| Permintaan | Kode | Waktu (3 kali) | Ukuran |
|---|---|---|---|
| `?q=bogor` | 200 | 0,416 · 0,420 · 0,431 dtk | 5.703 B (20 baris) |
| `?q=sido` | 200 | 0,419 · 0,424 · 0,430 dtk | 5.754 B (20 baris = batas saran) |
| `?q=merauke` | 200 | 0,408 · 0,423 · 0,426 dtk | 631 B |
| `?q=9301` | 200 | 0,398 · 0,403 · 0,403 dtk | 355 B |
| `?q=zzqqxx` | 200 | 0,399 · 0,410 · 0,439 dtk | 398 B (`results: []` + `notes`) |
| `?q=b` | 422 | — | validasi panjang minimum 2 |

Temuan:

1. **Urutan peringkat menentukan, bukan sekadar kerapian.** Versi pertama
   mengurutkan `match_rank` lalu tingkat wilayah; kata kunci `bogor` lalu
   menghasilkan 15 desa berawalan "Bogor" + 6 kecamatan dan **menghabiskan 20
   baris sebelum `Kota Bogor`** — uji pertama gagal. Urutan diganti: nama sama
   persis lebih dulu (semua tingkat), lalu tingkat lebih tinggi. Sekarang
   `?q=bogor` memuat `Bogor` (3201, REGENCY) dan `Kota Bogor` (3271, CITY).
2. **Alias kolom tidak bisa dipakai di dalam ekspresi `order by`** di PostgreSQL
   (`column "match_rank" does not exist`). Peringkat dihitung di CTE `ranked`,
   lalu diurutkan di `select` terluar.
3. **Kata kunci di-escape sebelum dicocokkan**: tanpa itu, `q=__` mencocokkan
   hampir semua nama. Uji `test_kata_kunci_dengan_wildcard_diperlakukan_sebagai_teks`
   menjaga perilaku itu.
4. **Cacat data yang ikut terbaca dari `psql`** (bukan temuan aplikasi):
   188 dari 7.357 kecamatan tidak punya `district_code`, 215 dari 83.530
   desa/kelurahan tidak punya `village_code`, 110 desa tidak punya geometri, dan
   **812 desa tidak punya `district_code` induk** sehingga provinsinya tidak bisa
   ditentukan. Yang terakhir dulu akan hilang dari hasil pencarian karena join ke
   kecamatan; sekarang memakai `LEFT JOIN` dan barisnya terkirim dengan
   `province_code` kosong + catatan, supaya tidak ada wilayah yang menghilang
   diam-diam.
5. **Nol di sini berarti tidak ada baris, bukan angka nol**: balasan tanpa hasil
   tetap `200` dengan medan `notes` yang menyebut sebabnya (kata kunci tidak
   cocok, pencarian memakai nama resmi/kode BPS, minimum 2 huruf) — pola yang
   sama dengan `notes` panel dan `has_fact` tile.
6. Belum ada ambang latensi untuk pencarian di SRS. Terukur **0,40–0,43 dtk**,
   hampir seluruhnya pemindaian penuh 83.530 desa untuk pola memuat
   (`ILIKE '%kata%'`). Kalau ambang ditetapkan nanti, langkah pertama indeks
   `pg_trgm` pada kolom nama.

---

## Iterasi 06 — `feat/api-trend` (PR #6)

`app/routers/analysis.py`: `GET /api/v1/analysis/national_trend` — satu query
membaca baris nasional (`region_code` dan `province_code` sama-sama kosong) untuk
tiga metrik: `hotspot_count`, `event_count`, `burned_area_ha`. Nama dan satuan
metrik dibaca dari tabel `metrics`, bukan ditulis ulang di kode. Router
didaftarkan di `app/main.py`; `tests/test_analysis.py`: 6 uji.

Bukti (`uv run pytest` → **24 passed**, 1 warning):

| Permintaan | Kode | Waktu (3 kali) | Ukuran |
|---|---|---|---|
| `/api/v1/analysis/national_trend` | 200 | 0,091 (panggilan pertama) · 0,036 · 0,038 dtk | 2.200 B |

Angka yang benar-benar keluar:

| Tahun | titik panas `archive_total` | nrt | kejadian | luas terbakar (ha) |
|---|---|---|---|---|
| 2020 | 91.348 | — | 618 | 170.481,94 |
| 2021 | 68.068 | — | 585 | 71.889,19 |
| 2022 | 62.960 | — | 272 | 52.183,53 |
| 2023 | 256.003 | — | 2.153 | 1.110.064,36 |
| 2024 | 112.350 | — | 1.016 | 134.891,52 |
| 2025 | 95.821 | — | 636 | 98.721,54 |
| 2026 | 61.157 | 600.323 | 1.103 | tidak tersedia |

Temuan:

1. **Seri `fill` baru ada sejak 2022.** `archive_total` (= main + fill) 2020 dan
   2021 sama dengan seri main saja, dan itu dinyatakan di `notes` — bukan
   ditambal dengan nol.
2. **nrt tetap terpisah.** nrt 2026 (600.323) tidak masuk `archive_total`, dengan
   alasan yang sama seperti catatan panel W2: pemrosesan berbeda, tidak sebanding.
3. **Bug yang tertangkap uji sebelum digabung:** versi pertama `_catatan`
   memeriksa `row["series"] == "nrt"` pada baris yang sudah diubah menjadi dict
   per tahun, sehingga catatan nrt dan catatan seri `fill` **tidak pernah muncul**
   sementara balasan tetap `200`. `test_menyatakan_seri_fill_hanya_punya_sebagian_tahun`
   yang menemukannya.
4. **Luas terbakar berhenti di 2025** dan hanya tersedia tingkat nasional; tahun
   2026 tidak dikirim sebagai 0, melainkan dikosongkan + disebut di `notes`.
5. Latensi 0,036–0,038 dtk setelah panggilan pertama, karena yang dibaca hanya 40
   baris nasional (bukan 58.665 baris `region_facts`).

---

## Penyisipan 06b — `refactor/api-english-identifiers` (PR #7)

Sekadar penggantian nama, tanpa perubahan perilaku. Seluruh identifier Python di
`backend/` — fungsi, parameter, variabel, konstanta, alias SQL — diganti ke
Bahasa Inggris; komentar, docstring, dan teks yang dibaca manusia tetap Bahasa
Indonesia.

| Berkas | Sebelum | Sesudah |
|---|---|---|
| `panels.py` | `_nilai_tunggal`, `_catatan`, `tahun_titik_panas`, `tahun_kejadian`, `seri_kurang` | `_single_value`, `_panel_notes`, `hotspot_years`, `event_years`, `missing_series` |
| `search.py` | `_baris`, `_catatan`, `nilai` | `_result_row`, `_search_notes`, `value` |
| `analysis.py` | `_tahun_hilang`, `_catatan`, `per_tahun`, `arsip`, `nama`, `hilang`, `tahun_fill`, `tahun_burned` | `_missing_years`, `_trend_notes`, `by_year`, `archive_values`, `name`, `missing`, `fill_years`, `burned_years` |
| `tests/` | 24 nama uji + `_cari`, `TILE_DUNIA`, `TILE_LAUT`, alias SQL `baris`/`wilayah` | nama uji Inggris + `_search`, `WORLD_TILE`, `OCEAN_TILE`, alias `fact_rows`/`region_count` |

Alasan: `CONVENTIONS.md` menetapkan identifier Inggris, tetapi `AGENTS.md`
menetapkan nama fungsi uji Indonesia — dua berkas konvensi itu saling
bertentangan, sehingga setiap kode baru mengikuti tetangga yang dibaca lebih
dulu. Keduanya kini sepakat: identifier Inggris (uji termasuk), komentar dan
docstring Indonesia.

Bukti: `uv run pytest -q` → **24 passed, 1 warning**, jumlah sama seperti sebelum
penggantian nama. `grep` sisa kata Indonesia pada baris `def`/penugasan/`for` di
`backend/app/**` dan `backend/tests/**` hanya menemukan string dan komentar
(mis. tag router `"C1 pencarian wilayah"`, `description="Tahun seri titik panas"`).

Cabang dihapus setelah squash merge atas permintaan pemilik repo (pengecualian
aturan "cabang tidak dihapus"); tag `iter-06b-english-names` tetap ada.

---

## Iterasi 07a — `feat/api-province-tiles` (PR #8)

`app/routers/maps.py`: `GET /tiles/provinces/{z}/{x}/{y}.mvt?year=YYYY`. Saklar
tingkat tampilan (`SRS-F-13`) ada di kriteria P1 versi MVP, jadi tanpa endpoint ini
frontend hanya punya saklar yang tidak menghasilkan apa pun. Angkanya dibaca dari
**baris fakta tingkat provinsi** yang sudah dimuat ETL (38 provinsi, tiap tahun
2020–2026), bukan penjumlahan baris kabupaten/kota. Kedua endpoint tile kini
memakai satu penolong balasan (`_render_tile`), jadi aturan "tile kosong → 204"
hanya ada di satu tempat. Uji: 27 passed (24 lama + 3 baru).

| Permintaan | Kode | Waktu (3 kali) | Ukuran |
|---|---|---|---|
| `/tiles/provinces/0/0/0.mvt?year=2020` | 200 | 0,279 · 0,240 · 0,229 dtk | 12.857 B (38 poligon) |
| `/tiles/provinces/1/0/1.mvt?year=2020` (laut) | 204 | 0,117 · 0,131 · 0,121 dtk | 0 B |
| `/tiles/regions/0/0/0.mvt?year=2020` (pembanding) | 200 | 0,253 · 0,248 · 0,245 dtk | 50.145 B |

Temuan: **tidak ada provinsi tanpa baris fakta pada 2020** (`not exists` → 0),
tetapi `provinces.geom` tidak punya indeks GiST. Untuk 38 baris itu pemindaian
penuh tidak terasa (0,23–0,28 dtk sudah termasuk biaya itu), jadi indeksnya belum
ditambahkan — menunggu pengukuran yang menuntutnya.

## Iterasi 07 — `feat/frontend-app` (PR #9)

`frontend/` berdiri: React 19 + TypeScript + **Vite 7.3.8** + Tailwind CSS 4 +
MapLibre GL JS, 32 berkas. Satu halaman memuat alur MVP lengkap: pilih tahun →
peta choropleth → klik wilayah → panel kabupaten/kota. Berkas router dan uji:
`App.tsx`, `api/`, `components/{map,search,panel,common}`, `hooks/`, `lib/`,
`types/`; 6 berkas uji bersebelahan dengan komponennya.

Bukti:

| Perintah | Hasil |
|---|---|
| `npm ci` | 162 paket |
| `npx tsc --noEmit` | bersih |
| `npm test` | **6 berkas, 27 uji lulus**, ~20 dtk |
| `npm run build` | `dist/index.html` 0,58 kB · CSS 85,25 kB (13,50 gzip) · JS 1.300,94 kB (367,33 gzip) · **12,56 dtk** |

Lewat HTTP (API hidup, jalur peramban lewat proxy Vite): `GET /` → 200 (741 B);
`/tiles/regions/0/0/0.mvt?year=2020` → 200 · 50.145 B · 0,258 dtk;
`/tiles/provinces/0/0/0.mvt?year=2020` → 200 · 12.857 B · 0,256 dtk;
`/api/v1/search/regions?q=bogor` → 200; `/api/v1/sources` → 200.

Di peramban sungguhan (Chrome via CDP, WebGL aktif): kanvas 1016 × 632 px dengan
choropleth tergambar; saklar `Provinsi` menggambar poligon provinsi; pencarian
`9301` → `KABUPATEN Merauke 9301 · Papua Selatan`; panel Merauke memuat angka nyata
(2023 main 22.245; 2020 main 6.246; 2026 main 4.581 + fill 627 + **nrt 62.245
terpisah**; kepadatan 2.218,60 per 1.000 km²; IRBI 2025 120,98 · Sedang) beserta
empat catatan batasan data; footer memuat NASA FIRMS, `data sampai 2026-11-12`,
`diakses 2026-11-12`.

Temuan:

1. **Peta kosong tanpa galat yang terlihat.** MapLibre v6 menurunkan URL worker
   dari `import.meta.url`; di bawah `optimizeDeps` Vite URL itu menunjuk
   `node_modules/.vite/deps/maplibre-gl-worker.mjs` yang tidak ada. Halaman tampak
   selesai dirender, kanvas hanya latar polos, dan tidak ada pesan galat di
   antarmuka — penyebabnya baru terbaca setelah konsol peramban ditangkap
   (`Worker failed to load`). Perbaikan: `setWorkerUrl(maplibreWorkerUrl)` dengan
   `?url`. Pelajaran: uji jsdom dan `tsc` tidak bisa menangkap kelas cacat ini;
   halaman wajib dibuka sekali di peramban sungguhan.
2. **`has_fact = 0` diberi warna sendiri (abu-abu)**, bukan kelas terendah, supaya
   wilayah tanpa baris fakta tidak terbaca sebagai "nol deteksi".
3. **Seri tetap dipisah**: peta memakai seri `main` (disebut di footer), panel
   menampilkan `main`/`fill`/`nrt` sebagai kolom terpisah.
4. **Nama provinsi sempat tertulis dua kali** pada baris hasil kabupaten/kota
   (`Papua Selatan · Papua Selatan`) karena wilayah induk dan provinsi menunjuk hal
   yang sama; `parentPath` sekarang tidak mengulang nama identik (ada ujinya).
5. Uji frontend **tidak butuh basis data maupun jaringan** (jsdom + mock), sehingga
   bisa dijalankan di laptop tanpa backend hidup; itu alasan berkas ujinya menguji
   perilaku komponen dan bukan penggambaran peta.

---

## Penyisipan 09a — `chore/deploy-api-service` (PR #10)

`deploy/systemd/geosafe-api.service`: unit systemd **pengguna** untuk backend,
di-`enable`, `Restart=always` `RestartSec=3`. `Linger=yes` sudah aktif untuk akun
ini, jadi layanan hidup lagi setelah reboot tanpa login.

- DSN ada di `~/.config/geosafe/geosafe.env` (`chmod 600`, **di luar repo**) dan
  dibaca lewat `EnvironmentFile`; unit boleh masuk git, kredensialnya tidak.
- `ExecStart` memakai jalur mutlak `.venv/bin/python`: unit systemd pengguna tidak
  mewarisi `PATH` shell, jadi `uv run` tidak akan ketemu.
- Berkas di `~/.config/systemd/user/geosafe-api.service` adalah **symlink** ke unit
  di repo, jadi repo tetap satu sumber kebenaran.

Bukti: `systemctl --user enable --now` → `enabled` + `active`; `ss -ltnp` →
`127.0.0.1:8000`; `GET /health` → 200; `GET /api/v1/sources` → 200. Uji restart:
`systemctl --user kill -s KILL` → PID 157605 mati, **7 detik kemudian PID 157851
aktif** dan `/health` → 200 (jurnal mencatat `Started geosafe-api.service`).

Cara pakai sehari-hari: `systemctl --user status|restart|stop geosafe-api`.
Frontend tetap manual (`npm run dev`) sesuai permintaan pemilik repo — sampai
penyisipan 09b, ketika halaman hasil build mulai disajikan nginx.

> Catatan 2026-11-17 (penyisipan 09b): berkas unit ini **dikeluarkan dari git** atas
> permintaan pemilik repo (aturan 8 di `CONVENTIONS.md`). Symlink
> `~/.config/systemd/user/geosafe-api.service`, isi unit, dan layanannya tidak
> berubah; yang berubah hanya apakah berkasnya masuk repo. Isi unit tetap tertulis
> di catatan ini supaya bisa ditulis ulang dari nol. Berkas nginx dapat ditulis
> ulang dari bagian penyisipan 09b di bawah.

---

## Penyisipan 09b — `chore/deploy-nginx` (PR #13)

Tag `iter-09b-nginx` menandai commit hasil *squash merge* di `main`.

Bagian penyajian dari iterasi 09. Sebelum ini aplikasi hanya bisa dipakai lewat dua
proses manual (`uvicorn` di 8000 + `npm run dev` di 5173); sekarang satu alamat:
**`http://127.0.0.1:8080`** menyajikan halaman hasil build dan meneruskan `/api`
serta `/tiles` ke API.

Berkas baru `deploy/nginx/geosafe.conf` — **di luar git** (keputusan pemilik repo
2026-11-17, aturan 8 di `CONVENTIONS.md`), tapi isinya ditulis lengkap di sini:

```nginx
# Situs GeoSafe: melayani hasil build frontend (SPA) dan meneruskan `/api` serta
# `/tiles` ke API FastAPI di 127.0.0.1:8000.
#
# Berkas ini hidup di mesin ini dan **tidak** masuk git (keputusan 2026-11-17,
# aturan 8 di docs/CONVENTIONS.md). Dipakai lewat symlink
# `/etc/nginx/sites-enabled/geosafe` ke jalur ini; isinya juga tertulis di
# docs/ITERATIONS.md penyisipan 09b supaya bisa ditulis ulang dari nol.
#
# Port 8080 dipilih supaya tidak berebut dengan API (8000) maupun situs lain di
# mesin ini. Memuat ulang setelah mengubah berkas: `sudo systemctl reload nginx`.

server {
    listen 8080;
    server_name _;

    # Hasil `npm run build` di frontend/ (diabaikan git, 1,9 MB).
    root "/media/bazyngan/DATA/Documents/mata kuliah sistem informasi geografis/project-GeoSafe/frontend/dist";
    index index.html;
    charset utf-8;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    # `mime.types` bawaan Ubuntu belum memetakan `.mjs`. Tanpa pemetaan ini berkas
    # worker MapLibre dikirim sebagai `application/octet-stream`, Chrome menolak
    # menjalankannya, dan peta tampak kosong TANPA galat di antarmuka (penyebabnya
    # hanya terbaca di konsol peramban). Blok `types` menggantikan peta tipe warisan,
    # jadi pemetaannya ditaruh di lokasi yang hanya melayani `.mjs`.
    location ~* \.mjs$ {
        types {
            text/javascript mjs;
        }
        # `add_header` di dalam `location` menggantikan header warisan dari `server`,
        # jadi keduanya diulang di sini — tanpa itu berkas `.mjs` (dan `.js`/`.css`
        # di bawah) kehilangan X-Content-Type-Options dan X-Frame-Options.
        add_header X-Frame-Options "SAMEORIGIN";
        add_header X-Content-Type-Options "nosniff";
        # Satu header saja: `expires` + `add_header Cache-Control` akan memancarkan
        # dua header Cache-Control sekaligus.
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Rute SPA: `/tren` dan `/sumber` tidak punya berkas sendiri, jadi permintaan
    # yang tidak menemukan berkas dikembalikan ke index.html supaya tidak 404
    # saat halaman dibuka langsung atau di-refresh.
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Berkas build Vite memakai nama ber-hash, jadi isinya tidak pernah berubah
    # untuk nama yang sama.
    location /assets/ {
        add_header X-Frame-Options "SAMEORIGIN";
        add_header X-Content-Type-Options "nosniff";
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Endpoint API di luar prefiks `/api` dan `/tiles`: pemeriksaan kesehatan dan
    # dokumentasi FastAPI. Tanpa blok ini ketiganya jatuh ke fallback SPA dan
    # dijawab `index.html` dengan kode 200 — bentuk balasan yang menyesatkan.
    location ~ ^/(health|docs|redoc|openapi\.json)$ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Basemap statis (216 MB) di luar repo: satu berkas PMTiles yang ditarik klien
    # per rentang byte, jadi balasan `206` + `Accept-Ranges` wajib ada (nginx
    # melakukannya sendiri untuk berkas statis). Lokasinya **berkas** ini, bukan
    # seluruh folder — berkas lain yang nanti ditaruh di folder itu tidak ikut
    # tersaji. `add_header` di dalam `location` menggantikan header warisan dari
    # `server`, jadi keduanya diulang. Umur cache pendek supaya basemap hasil
    # ekstrak ulang tidak tertahan sehari di peramban.
    location = /pmtiles/indonesia.pmtiles {
        alias "/media/bazyngan/DATA/Documents/mata kuliah sistem informasi geografis/planning-GeoSafe/data/basemap/indonesia.pmtiles";
        add_header X-Frame-Options "SAMEORIGIN";
        add_header X-Content-Type-Options "nosniff";
        add_header Cache-Control "public, max-age=300";
    }

    # Selain berkas di atas, tidak ada yang boleh tersaji di bawah `/pmtiles/`.
    # Tanpa blok ini permintaan seperti `/pmtiles/apa-saja` jatuh ke fallback SPA
    # dan dijawab `index.html` dengan kode 200 — balasan yang menyesatkan.
    location /pmtiles/ {
        return 404;
    }

    # API FastAPI: psycopg sinkron, satu koneksi per permintaan, hanya baca.
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Beberapa endpoint menunggu basis data (tile satu tahun 0,26–0,30 dtk,
        # tren tujuh tahun ±1,6 dtk); batas bawaan 60 dtk sudah longgar.
        proxy_read_timeout 60s;
    }

    # Vector tile MVT per tingkat wilayah dan tahun.
    location /tiles/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}
```

Unit systemd yang dipakai sejak 09a, juga **di luar git** sejak penyisipan ini:

```ini
[Unit]
Description=GeoSafe API (FastAPI, port 8000)
Documentation=https://github.com/mhd-aziz/geosafe
After=network-online.target pg.service
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=/media/bazyngan/DATA/Documents/mata kuliah sistem informasi geografis/project-GeoSafe/backend
# DSN basis data dibaca dari berkas DI LUAR repo (~/.config/geosafe/geosafe.env,
# chmod 600): repo aplikasi tidak menyimpan rahasia, dan berkasnya dipakai unit
# ini maupun sesi pengembangan.
EnvironmentFile=%h/.config/geosafe/geosafe.env
# Jalur mutlak (bukan `uv run`): unit tidak mewarisi PATH session pengguna.
ExecStart="/media/bazyngan/DATA/Documents/mata kuliah sistem informasi geografis/project-GeoSafe/backend/.venv/bin/python" -m uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=3

[Install]
WantedBy=default.target
```

Pemasangan (sekali per mesin):

```bash
sudo ln -sfn "<repo>/deploy/nginx/geosafe.conf" /etc/nginx/sites-enabled/geosafe
sudo nginx -t && sudo systemctl enable --now nginx
```

Situs `sia-iti` **dilepas** dari `sites-enabled` karena `listen 8000` miliknya sama
dengan port API dan nginx menolak start saat portnya bentrok. Berkas
`sites-available/sia-iti` tidak diubah; mengembalikannya:
`sudo ln -s /etc/nginx/sites-available/sia-iti /etc/nginx/sites-enabled/sia-iti`
(proyek itu sendiri sudah tidak aktif — `php8.5-fpm-sia` mati dan socket-nya tidak
ada). Karena `deploy/` keluar dari git, pull request ini hanya memuat `.gitignore`
dan dokumen; `deploy/systemd/geosafe-api.service` dihapus dari pelacakan
(`git rm --cached`) dan salinannya tetap ada di disk.

Bukti — lewat HTTP di jalur yang dipakai peramban, `http://127.0.0.1:8080`:

- `/` · `/tren` · `/sumber` → 200 · 584 B · 1–2,5 ms (fallback SPA bekerja);
  `/assets/tidak-ada.js` → **404**, jadi fallback tidak menelan permintaan berkas.
- `/assets/index-*.js` 200 · 1.356.214 B · `.css` 200 · 86.468 B · worker
  `maplibre-gl-worker-*.mjs` 200 · 519.547 B.
- `/api/v1/sources` 200 · 1.842 B · `national_trend` 200 · 2.200 B · 0,035 dtk ·
  `point_coverage?year=2023` hangat 0,37–0,39 dtk (langsung ke API 8000:
  0,37–0,38 dtk, jadi nginx menambah ±0,01 dtk). Panggilan **pertama** setelah
  nginx hidup 2,10 dtk — jangan melaporkan pembacaan pertama sebagai angka biasa.
- Tile kabupaten 2020 200 · 49.920 B · hangat 0,28–0,29 dtk; tile provinsi
  200 · 12.857 B · 0,22–0,23 dtk.
- Peramban sungguhan (Chrome 157 lewat CDP): worker termuat, peta meminta 6 petak
  tile (204 untuk petak tanpa poligon; 200 sebesar 13.009 / 44.286 / 98.452 B), dan
  tangkapan layar menunjukkan choropleth tergambar (krem → merah tua) dengan legenda
  yang cocok. `/tren` menggambar grafik SVG dan menyebut data sampai 2026-11-12;
  `/sumber` memuat 29 tautan unduhan.
- `pytest` **38 passed** (11,35 dtk) · `npm test` **44 passed** (8 berkas) ·
  `npm run build` 13,40 dtk.

Temuan:

1. **nginx mengirim `.mjs` sebagai `application/octet-stream`** karena `mime.types`
   bawaan Ubuntu belum memetakan ekstensi itu; Chrome menolak worker ber-tipe salah
   dan peta **kosong tanpa galat di antarmuka** — kelas yang sama dengan jebakan
   MapLibre di iterasi 07, kini di lapisan penyajian. Perbaikan ada di konfigurasi
   di atas. Blok `types` menggantikan peta tipe warisan, jadi ia harus berada di
   lokasi yang hanya melayani `.mjs`; menaruhnya di tingkat `server` membuat `.css`
   dan `.js` ikut kehilangan tipenya.
2. **`systemctl reload nginx` tidak seketika.** Permintaan tepat setelah reload
   masih dilayani worker lama, jadi pembacaan pertama sempat melihat tipe lama
   padahal konfigurasi baru sudah benar. Ukur ulang setelah jeda.
3. **`Page.reload(ignoreCache)` tidak memaksa worker diunduh ulang** karena
   `Cache-Control: immutable`; Chrome memakai salinan lama ber-tipe salah sehingga
   perbaikan tampak gagal. Yang berhasil: membuka lewat origin lain
   (`http://100.82.26.92:8080`) supaya cache-key-nya berbeda.
4. **Berkas `.env` di luar repo tidak mengutip DSN**, sehingga `source` di bash
   memotongnya menjadi `host=127.0.0.1` saja dan `pytest` gagal 33 uji (mencoba port
   5432). systemd membacanya utuh, jadi API tidak pernah terpengaruh. Sementara ini
   DSN diambil dengan
   `export GEOSAFE_DATABASE_URL="$(sed -n 's/^GEOSAFE_DATABASE_URL=//p' ~/.config/geosafe/geosafe.env)"`.
   **Ditutup 2026-11-17** atas izin pemilik repo: nilai di berkas itu kini dikutip
   (`GEOSAFE_DATABASE_URL="host=... port=5433 ..."`), diverifikasi dua sisi — `source`
   di bash menangkap 86 karakter dan 6 medan, dan setelah `systemctl --user restart
   geosafe-api` endpoint baca basis data tetap 200 (`/api/v1/sources` `count: 7`,
   panel Merauke 200); `pytest` dengan cara `source` biasa → **38 passed** (9,98 dtk).
   Cadangan berkas sebelum sunting: `~/geosafe-deploy/geosafe.env.bak`.
5. Halaman masih **tanpa basemap** (latar polos) — PMTiles tetap pekerjaan berikutnya,
   dan sejak penyisipan ini berkas nginx hanya ada di disk mesin ini.
6. **Tinjauan independen menolak versi pertama** dan menemukan dua cacat nyata di
   konfigurasi, keduanya diperbaiki sebelum commit:
   - `add_header` di dalam `location` menggantikan header warisan dari `server`,
     sehingga `X-Content-Type-Options`/`X-Frame-Options` **tidak terkirim** pada
     `.js`, `.css`, dan `.mjs`. Sekarang kedua header diulang di lokasi statis.
   - `/health`, `/docs`, dan `/openapi.json` berada di luar prefiks yang diteruskan,
     jadi ketiganya dijawab `index.html` **200** — balasan yang menyesatkan (README
     sendiri menyebut dokumentasi API hidup di `/docs`). Ditambah satu lokasi
     regex untuk keempat jalur itu (`health|docs|redoc|openapi.json`).
   Perbaikan diverifikasi lewat `curl -I` di `127.0.0.1:8080`: `.js`/`.css`/`.mjs`
   kini memuat `X-Frame-Options`, `X-Content-Type-Options`, dan **satu**
   `Cache-Control: public, max-age=31536000, immutable` (sebelumnya `expires 1y`
   dan `add_header` memancarkan dua header sekaligus); `/health` 200 · 57 B JSON,
   `/docs` 200 · 1.010 B HTML, `/openapi.json` 200 · 9.168 B JSON, sementara `/`,
   `/tren`, `/sumber` tetap 200 dan `/assets/tidak-ada.js` tetap 404.
7. **Tag dan nomor PR tidak boleh ditulis sebelum ada.** Versi pertama dokumen ini
   menandai `✅ PR #13` dan `iter-09b-nginx` padahal belum ada commit, merge, maupun
   tag — pelanggaran aturan "angka di dokumen adalah hasil pengukuran nyata" yang
   ditemukan peninjau. Baris ringkasan dikosongkan lagi sampai pekerjaan benar-benar
   digabung.
8. **`git rm --cached` + `.gitignore` + berpindah cabang MENGHAPUS berkas dari
   disk.** Setelah merge, `git switch main && git pull` menghilangkan
   `deploy/systemd/geosafe-api.service`: di cabang berkas itu *untracked*, tetapi
   setelah berpindah ke `main` ia *tracked* lagi dan commit merge yang menghapusnya
   ikut dijalankan — berkasnya lenyap, symlink `~/.config/systemd/user/` menggantung,
   dan layanan hanya bertahan karena sudah termuat di memori (restart atau reboot
   akan gagal). Dipulihkan dengan mengambil isinya dari riwayat dan membandingkannya:
   `mkdir -p deploy/systemd && git show <commit-sebelum-merge>:deploy/systemd/geosafe-api.service > deploy/systemd/geosafe-api.service`,
   lalu `diff` terhadap versi riwayat (identik), `systemctl --user daemon-reload`,
   dan bukti uji: `systemctl --user restart geosafe-api` → `active`,
   `/health` lewat nginx → 200. Pelajaran untuk langkah berikutnya: sebelum
   berpindah cabang setelah mengeluarkan berkas dari pelacakan, **salin dulu**
   berkasnya ke luar repo (mis. `~/geosafe-deploy/`), dan periksa keberadaannya
   setelah `git switch`.

---

## Iterasi 10a — `feat/api-latest-hotspots` (PR #15)

Tag `iter-10a-latest-api` menandai commit hasil *squash merge* di `main`.

Bagian pertama iterasi 10: `P2` (titik panas terkini) dan `W1` (ringkasannya) di
API, mengikuti kontrak yang sudah disetujui di
`../planning-GeoSafe/docs/API-P2.md`. Inilah satu-satunya endpoint **runtime** —
satu-satunya yang datanya diambil saat permintaan diproses, bukan dari tabel
historis.

Berkas: `backend/app/routers/latest.py` (baru) · `backend/app/config.py` (kunci
FIRMS + jalur snapshot) · `backend/app/main.py` (pendaftaran router) ·
`backend/tests/test_latest.py` (17 uji).

Bentuknya: tarik tiga satelit penyedia → buang duplikat → cache 15 menit di memori
+ `snapshot.json` → saring jendela 24/48/72 jam → join kabupaten/kota **saat
permintaan** lewat satu query SQL → kirim; `points` diganti `null` bila muatan
melewati 2 MB.

Kenyataan API FIRMS yang mengubah rancangan (diuji 2026-11-17, bukan dari ingatan):

1. **Satu permintaan melayani satu satelit saja.** Daftar sumber (koma) maupun
   kata kunci `all` dijawab **400 Bad Request**; hanya sumber tunggal yang dilayani.
2. **Suomi-NPP berhenti mengirim.** `data_availability` menunjukkan
   `VIIRS_SNPP_NRT` berakhir **2026-11-02** (pengumuman NASA: pengiriman berhenti
   2 Nov 2026), dan tarikannya memang nol baris. Karena keputusan penutup 9 #2
   melarang panggilan ketersediaan terpisah, satelit yang berhenti tidak bisa
   dilaporkan tanggalnya; yang masuk daftar `satellites` adalah **sumber yang
   benar-benar dicoba**: `VIIRS_NOAA20_NRT`, `VIIRS_NOAA21_NRT`, `MODIS_NRT`.
3. **Kolom CSV MODIS berbeda**: suhu ada di `brightness` (VIIRS di `bright_ti4`)
   dan `confidence` berupa angka 0–100, sehingga kelasnya dinormalkan
   (`<30` low · `30–79` nominal · `≥80` high).
4. `acq_time` bisa tiga digit (`416` = 04:16) dan harus dipad sebelum dirakit.

Bukti — lewat HTTP di jalur aplikasi (`http://127.0.0.1:8080`, nginx mem-proxy
`/api`), kunci FIRMS sungguhan:

| Uji | Hasil |
|---|---|
| `/api/v1/latest?window=24` pertama | **200** · 14,86 dtk · 209.099 B · `X-Cache: MISS` · **880 titik**, 150 di luar poligon (17,0 %) |
| permintaan kedua | **200** · **0,171 dtk** · `X-Cache: HIT` · tanpa tarikan baru |
| `/api/v1/latest/summary?window=24` | 200 · 0,253 dtk · 1.386 B · `fetched_at` dan `point_count` **identik** dengan `/latest` (invarian kontrak) · 103 kabupaten/kota terdampak |
| provinsi teratas (24 jam) | Papua Selatan 193 · Sulawesi Tenggara 89 · Sulawesi Tengah 88 · Maluku 63 · NTT 58 |
| `/api/v1/latest?window=72` | 200 · 0,60 dtk · 1.050.390 B · **4.425 titik**, 354 di luar poligon (di bawah batas 2 MB) |
| `satellites` | SNPP `available: false` (2026-11-02) · NOAA20/NOAA21/MODIS `available: true` (2026-11-16) |
| snapshot | `backend/snapshot.json` tertulis 1.222.157 B setelah tarikan berhasil |
| kuota FIRMS | `mapkey_status` 20 → **49 transaksi** (±29 per penyegaran) terhadap batas 5.000/10 menit |
| uji | `pytest` **18 passed** (berkas baru) · seluruh suite **56 passed** |

Temuan:

1. **`SRS-NF-09` perlu dikoreksi, dan cache tetap 15 menit.** Keputusan pemilik repo
   2026-11-17: TTL cache tetap **15 menit** (empat penyegaran per jam, sesuai maksud
   `NF-09`). Yang perlu diperjelas adalah satuan "permintaan": karena Area API
   melayani **satu satelit per permintaan**, satu penyegaran = **3 permintaan**
   (ketersediaan tidak lagi dipanggil — keputusan 9 #2), jadi **12 permintaan HTTP
   per jam**, bukan 4 dan bukan 16 seperti versi pertama. Biaya kuotanya terukur
   **24 transaksi per penyegaran** (3 permintaan satelit berjendela 4 hari; satu
   permintaan area MODIS 1 hari = 2 transaksi), jadi **±96 transaksi/jam** lawan
   batas 5.000 transaksi/10 menit (±30.000/jam) — pemakaian sekitar **0,3 %** kuota.
   Usulan bunyi baris `NF-09` yang jujur: *"Jumlah penyegaran data terkini per jam:
   4 (cache 15 menit) — 12 permintaan satelit per jam; tidak bergantung jumlah
   pengguna"*. Baris di `SRS-GeoSafe.md` belum diubah karena itu dokumen pemilik repo.
2. **Rencana `CATATAN-DISKUSI.md` bagian F memilih join `STRtree` di Python tanpa
   basis data**, sedangkan kontrak `API-P2.md` bagian 6 (disetujui sehari setelah
   catatan itu) dan aturan repo nomor 4 menuntut **satu implementasi join, di
   SQL**. Yang dipakai di sini SQL: array titik dikirim lewat `unnest` lalu
   `LEFT JOIN regions ... ST_Contains`, sehingga titik laut tetap terkirim dengan
   `region_code: null`. Terukur hari ini: 880 titik → respons 0,171 dtk dari cache
   (join ikut dijalankan setiap permintaan), 4.425 titik (72 jam) → 0,60 dtk.
   Angka rencana (join 900 titik 0,02 dtk) tetap benar untuk `STRtree`, tetapi
   jalurnya berbeda dan tidak dipakai.
3. **Uji pertama gagal karena berkas ujinya, bukan kode.** Permintaan
   `bbox=139,-10,142,-7` ditolak 422 oleh kode — dan itu benar, karena batas timur
   wilayah yang sah adalah 141,5 (kontrak). Berkas uji diperbaiki, bukan kodenya.
4. **`available` ditentukan dari baris yang benar-benar kembali** (keputusan 9 #2):
   satelit dianggap tersedia bila ia mengirim baris pada tarikan itu, dan
   `last_acq_date` diambil dari tanggal terbaru yang pernah terlihat. Tidak ada
   panggilan `data_availability` terpisah — akibatnya satu penyegaran hanya
   **3 permintaan HTTP**, bukan 4.
5. **Snapshot ditulis setiap tarikan berhasil**, dan kegagalan tarikan membalas
   `200` dengan `using_snapshot: true` + `snapshot_age_seconds` (`SRS-F-25`);
   kalau belum ada snapshot sama sekali, balasannya `503` dengan
   `{"error":"no_snapshot"}`. Keduanya diuji.
6. **Endpoint status kuota FIRMS** (`mapserver/mapkey_status/?MAP_KEY=...`)
   dipakai untuk mengukur biaya transaksi — berguna setiap kali jumlah tarikan
   berubah.
7. **Panggilan luar disuntikkan sebagai dependensi** (`get_firms_fetcher`) atas
   izin pemilik repo, sehingga uji tidak memakan kuota kunci; basis data dan join
   tetap dijalankan sungguhan. Aturannya dicatat sebagai aturan 9 di
   `docs/CONVENTIONS.md`.

### Putaran perbaikan setelah tinjauan (2026-11-17)

Tinjauan independen menolak versi pertama (`passed: false`). Yang diperbaiki,
beserta buktinya:

1. **Kunci API bisa bocor ke badan `503`.** `httpx.HTTPStatusError` membawa URL,
   dan URL FIRMS memuat kunci. Sekarang kegagalan hulu dibungkus
   `UpstreamHttpError`/`UpstreamAuthError` yang hanya membawa kode status, dan
   pesan `503` hanya menyebut jenis galatnya. Ada uji yang menyisipkan rahasia ke
   pesan galat lalu memastikan rahasia itu **tidak** muncul di balasan.
2. **Satu tarikan melayani semua penunggu.** Sebelumnya N permintaan bersamaan
   saat cache kedaluwarsa menjalankan N tarikan — melanggar kontrak bagian 5 dan
   `NF-11`. Ditambah kunci penyegaran dengan pemeriksaan ulang di dalamnya, plus
   **jeda 60 detik** setelah kegagalan supaya gangguan hulu tidak menjadi
   percobaan sebanyak jumlah permintaan pengguna. Keduanya diuji.
3. **`window_start` dan penyaring jendela dari `fetched_at`**, bukan jam permintaan
   (kontrak bagian 1). Terukur di layanan: selisih tepat 24 jam; sebelumnya
   selisihnya bergantung jarak waktu antara dua permintaan, sehingga `/latest` dan
   `/latest/summary` bisa berbeda di batas jendela.
4. **Keputusan 9 #2 dipenuhi:** ketersediaan dihitung dari baris yang kembali,
   tanpa panggilan `data_availability`. Efeknya penyegaran turun dari 4 ke
   **3 permintaan HTTP** dan biaya kuota dari 29 ke **24 transaksi** (diukur
   36 → 60 pada `mapkey_status`).
5. **Keputusan 9 #3 dipenuhi:** snapshot berisi **hasil join** dengan bentuk badan
   `/latest` — diperiksa di berkas nyata: `{fetched_at, points, satellites,
   window_hours}` dengan `region_code` terisi (snapshot bentuk lama dihapus agar
   ditulis ulang). Penulisannya kini atomik (berkas sementara + `os.replace`) dan
   kegagalannya masuk jurnal; sebelumnya `write_text` bisa meninggalkan JSON
   terpotong yang lalu dianggap "tidak ada snapshot".
6. **Bentuk `422` seragam.** `window=abc` dan `window=` (kosong) dulu dijawab
   bentuk bawaan FastAPI tanpa medan `error`; sekarang keduanya
   `{"error":"invalid_parameter","detail":...}` di kedua endpoint. Urutannya juga
   dibalik: **validasi dulu, baru batas laju**, sehingga masukan salah tidak
   menghabiskan kuota 60 permintaan/menit.
7. **Batas laju per IP benar-benar per IP.** nginx yang mem-proxy permintaan, jadi
   unit systemd kini memakai `--proxy-headers --forwarded-allow-ips=127.0.0.1`;
   dibuktikan dari jurnal: permintaan ber-`X-Forwarded-For: 9.9.9.9` tercatat
   sebagai klien `9.9.9.9`, bukan `127.0.0.1`.
8. Perapian lain: bbox permintaan ke FIRMS disamakan dengan batas sah pengguna
   supaya bbox yang lolos validasi selalu bisa dipenuhi; satu klien HTTP untuk
   seluruh penyegaran (satu jabat tangan TLS, bukan tiga); pagar memori 120.000
   titik per generasi; peta batas laju dibersihkan dari IP tidak aktif; kunci
   dedupe ikut memuat `confidence` dan `frp`; `snapshot_age_seconds` dihitung
   ulang tiap permintaan.

Bukti akhir setelah perbaikan (kunci FIRMS sungguhan, lewat nginx):

| Uji | Hasil |
|---|---|
| penyegaran dingin `window=24` | 200 · **11,34 dtk** · 237.563 B · **1.001 titik** · 262 di luar poligon · `X-Cache: MISS` |
| biaya kuota per penyegaran | **24 transaksi** (36 → 60) untuk 3 permintaan HTTP |
| `window_start` | tepat 24,0 jam sebelum `fetched_at` |
| `satellites` | tiga sumber yang dicoba, semuanya `available: true`, `last_acq_date` 2026-11-16 |
| snapshot | kunci kontrak lengkap, `region_code` terisi, tanpa berkas `.tmp` tertinggal |
| snapshot saat basis data mati | 200 dari snapshot (DSN diarahkan ke port kosong) — janji keputusan 9 #3 diuji, bukan diandaikan |
| uji | **31 uji** di berkas ini · seluruh suite **69 passed** |

---

## Penyisipan 09c — basemap PMTiles (PR #14)

Tag `iter-09c-basemap` menandai commit hasil *squash merge* di `main`.

Sisa terakhir iterasi 09: peta berhenti memakai latar polos. Berkas basemap
`indonesia.pmtiles` **216.138.172 byte** (207 MiB) berada di luar kedua repo —
`../planning-GeoSafe/data/basemap/` — sesuai aturan 2 `CONVENTIONS.md`, dan
dilayani nginx pada `/pmtiles/`.

Ekstraksi (sekali, 227 MB terkirim dari build protomaps `20261112`, bbox
`94.5,-11.5,141.5,6.5`, `--maxzoom=12`, selesai dalam **2 menit 15 detik** dengan
99 permintaan), lalu diperiksa dengan `pmtiles show`:
spec v3 · tile MVT · zoom 0–12 · 148.173 petak beralamat · 71.949 entri ·
sha256 berawalan `a3f17cc4`.

Berkas yang berubah di repo:

- `frontend/src/lib/map-style.ts` (baru) — gaya dasar dari `@protomaps/basemaps`
  5.7.2: `layers(BASEMAP_SOURCE_ID, LIGHT, { lang: 'id' })` menghasilkan 71 layer
  (layer pertama `background`), sumber vektor `pmtiles:///pmtiles/indonesia.pmtiles`,
  plus `glyphs` dan `sprite` dari aset publik Protomaps (tanpa kunci API).
- `frontend/src/components/map/MapView.tsx` — `BLANK_STYLE` dihapus, protokol
  `pmtiles` didaftarkan sekali (dibungkus `try/catch` karena pendaftaran kedua
  melempar galat dan Vite HMR bisa menjalankan modul ulang), dan layer choropleth
  diberi `fill-opacity` 0,72.
- `frontend/vite.config.ts` — proxy `/pmtiles` → `127.0.0.1:8080` supaya dev server
  ikut menyajikan basemap (nginx harus hidup saat `npm run dev`).
- `frontend/package.json` — dua dependensi baru: `pmtiles` 4.5.0 (380.312 B) dan
  `@protomaps/basemaps` 5.7.2 (442.916 B), keduanya versi terkunci.
- `deploy/nginx/geosafe.conf` (di luar git) — `location /pmtiles/` dengan `alias`
  ke folder basemap; isinya ikut ditulis di bagian penyisipan 09b di atas.

Bukti:

- `curl -r 0-99 http://127.0.0.1:8080/pmtiles/indonesia.pmtiles` → **206** ·
  `Content-Range: bytes 0-99/216138172`; 7 byte pertama isinya `PMTiles`.
  Unduhan utuh → 200 · 216.138.172 B · 0,19 dtk (lokal). `/pmtiles/tidak-ada.pmtiles`
  → 404.
- Dari peramban (Chrome lewat nginx): **211 permintaan `206`** ke berkas itu dengan
  total **5.064.503 byte** — 2,3 % dari arsip, jadi benar per rentang byte, bukan
  unduhan utuh. 18 permintaan tile wilayah ikut tercatat.
- `npm test` **50 passed** (9 berkas) · `tsc --noEmit` bersih · `npm run build`
  13,65 / 15,96 / 22,80 dtk pada tiga pengukuran berbeda (waktu build bergerak,
  jangan dibaca sebagai angka tunggal) · `pytest` **38 passed**. Uji gaya peta
  mula-mula 5 berkas uji; setelah peninjau meminta asersi yang lebih bermakna,
  menjadi 6 dan jumlah total 50.
- Di peramban: peta menampilkan air laut, garis pantai, sungai, batas administrasi,
  dan nama tempat berbahasa Indonesia (`MALAYSIA`, `PAPUA NUGINI`, `TIMOR LESTE`,
  `LAUT TIONGKOK SELATAN`); pencarian `3173` → peta memperbesar ke Jakarta Barat →
  panel memuat angka nyata; jalan dan label jalan (`Jalan Tol Jakarta`) terlihat
  setelah opasitas choropleth diturunkan.

Temuan:

1. **Jalan basemap ada di data, tapi tertutup layer choropleth.** Diperiksa langsung
   pada arsip: petak z6/z10/z12 memuat layer `roads`, `places`, `boundaries`, `water`
   (`pmtiles tile ... | gunzip -c | strings` — keluarannya ter-gzip, jadi harus
   di-`gunzip` dulu). Pada opasitas 0,82 jalan tidak terlihat; pada **0,72** jalan
   dan labelnya terbaca sementara kelas warna masih terpisah. Angka itu dipilih
   lewat pemeriksaan di peramban, bukan dari perhitungan.
2. **Pembacaan gambar otomatis tidak boleh dipercaya tanpa verifikasi.** Dua klaim
   salah muncul pada pemeriksaan yang sama: "basemap tidak dimuat" (padahal air laut
   berwarna basemap) dan "poligon DKI salah diberi abu-abu" — basis data menunjukkan
   `3171` dan `3174` memang belum punya baris tahunan 2026 (hanya seri `nrt`), jadi
   abu-abu itu **benar** sesuai aturan "celah berarti nol". Warna dan angka diverifikasi
   ke basis data sebelum disimpulkan.
3. **Ketidakcocokan kode kecamatan ada di data sumber.** Di
   `data/batas-administrasi/atribut/kecamatan.csv`, kecamatan berawalan `3173`
   (`Cempaka Putih` 3173050, `Gambir` 3173080, `Johar Baru` 3173040) berpasangan
   dengan induk `31.71` Kota Administrasi Jakarta Pusat. Aplikasi menampilkan induk
   apa adanya dari basis data; yang salah adalah awalan kode di sumber, bukan panel.
4. **Satu-satunya kunci ganda di `region_facts`** adalah 7 baris metrik
   `hotspot_coverage_pct` tingkat nasional (tahun 2020–2026, sumber `BNPB-EVENT`).
   Jalur peta tidak terpengaruh (baris itu tanpa `region_code`), tetapi endpoint
   `point_coverage` membaca metrik itu — dicatat supaya tidak dikira temuan baru.
5. **`podman ps` kosong di sesi ini walau unit quadlet `pg.service` aktif.** Jangan
   menyimpulkan basis data mati dari situ; pakai DSN dengan psycopg
   (`backend/.venv/bin/python`) atau HTTP API.
6. **Basemap bergantung pada aset publik Protomaps** untuk berkas font dan sprite
   (`protomaps.github.io/basemaps-assets`, diperiksa: 200). Tanpa internet, layer
   teks gagal dimuat dan peta hanya kehilangan nama tempat — geometri tetap ada.
7. **Tinjauan independen menemukan klaim yang salah di komentar kode.** Kode saya
   menyatakan pendaftaran protokol kedua "melempar galat". Diperiksa di
   `node_modules/maplibre-gl/dist/maplibre-gl-dev.mjs` baris 3226: `addProtocol`
   hanya menimpa `config.REGISTERED_PROTOCOLS[customProtocol] = loadFn`, tanpa
   galat apa pun — jadi `try/catch` di `MapView` adalah kode mati dan alasannya
   tidak terverifikasi. Pembungkusnya dihapus dan komentarnya diganti dengan
   pernyataan yang bisa ditunjuk sumbernya. Pelajaran: komentar yang menjelaskan
   *mengapa* harus diuji seperti kode.
8. **`/pmtiles/` diperketat setelah peninjau memeriksa permukaannya.** Semula
   `alias` ke seluruh folder, artinya berkas apa pun yang nanti ditaruh di folder
   basemap otomatis tersaji, dan `add_header` di dalam `location` menggantikan
   header warisan sehingga `X-Frame-Options` hilang pada balasan itu. Sekarang
   lokasinya **berkas** tunggal (`location = /pmtiles/indonesia.pmtiles`) dengan
   header lengkap, dan umur cache diturunkan dari 86400 ke **300** detik supaya
   basemap hasil ekstrak ulang tidak tertahan sehari di peramban. Perubahan itu
   membuka celah baru yang langsung ditutup: permintaan lain di bawah `/pmtiles/`
   jatuh ke fallback SPA dan dijawab `200 index.html`, jadi ditambah
   `location /pmtiles/ { return 404; }`. Diverifikasi ulang: berkas → **206**,
   `/pmtiles/` · `/pmtiles/berkas-lain.txt` · `/pmtiles/tidak-ada.pmtiles` → **404**,
   sementara `/`, `/tren`, `/sumber`, `/api/v1/sources`, `/health` tetap 200.
9. **`listen 8080` mengikat `0.0.0.0`**, jadi arsip basemap terjangkau dari
   LAN/tailnet, bukan hanya localhost. Dibiarkan karena aplikasi ini memang
   disiapkan diakses lewat Cloudflare Tunnel (`ARSITEKTUR.md`) dan basemap-nya data
   terbuka; kalau jaringan dianggap tidak tepercaya, ubah jadi
   `listen 127.0.0.1:8080`.
10. **Galat peta sekarang tampil, tidak sunyi lagi.** Kegagalan memuat sumber atau
    gaya **tidak** menggagalkan kejadian `load`, jadi peta tetap memasang
    choropleth dan pengguna hanya melihat latar kosong. Ditambahkan
    `map.on('error')` yang menampilkan pita peringatan. Diperiksa di peramban:
    pita itu **tidak** muncul pada pemuatan normal. Uji jsdom tidak menjangkau
    jalur ini karena `MapView` di-mock di seluruh suite frontend — pembuktiannya
    tetap harus di peramban.

---

## Iterasi 08a — `feat/api-transparency-downloads` (PR #11)

Tiga kebutuhan `T1`/`P1` yang belum bisa dilayani API:

1. `GET /api/v1/point_coverage?year=` — 106.800 dari 1.452.263 titik panas (7,35 %)
   tidak jatuh di poligon wilayah mana pun (`SRS-F-76`, dipakai juga `SRS-F-16`);
2. `GET /api/v1/downloads` + `…/{berkas}` — 29 tabel siap pakai (31 MB) di folder
   data di luar repo, disajikan sebagai daftar + unduhan; nama berkas divalidasi
   terhadap daftar folder, jadi `../` tidak bisa keluar dan berkas asing → 404;
3. `confidence=h|n|l` pada tile kabupaten/kota (`SRS-F-15`) — kelas `h`+`n`+`l`
   **terbukti menjumlah tepat** ke angka tanpa penyaring pada setiap tahun
   2020–2026 (2020: 2.186 + 82.238 + 6.924 = 91.348). Tingkat provinsi menolak
   parameter itu dengan **422**, bukan mengabaikannya diam-diam.

Bukti (`pytest` **38 passed**): `point_coverage?year=2023` → 0,45–0,66 dtk;
tanpa tahun (7 tahun) → 1,43–1,58 dtk; `/downloads` → 0,006 dtk, 29 berkas;
unduhan CSV → 200 · 63.880 B. Optimasi tercatat: filter tahun semula memakai
`extract(year …)` (1,16–1,27 dtk) lalu diganti rentang tanggal agar indeks
`ix_po_tanggal` terpakai.

## Iterasi 08 — `feat/frontend-t1-trend` (PR #12)

Tiga halaman di balik router: `/` peta, `/tren` grafik nasional (`A1`), `/sumber`
Sumber & Batas Data (`T1`). Berkas baru: `pages/{MapPage,TrendPage,SourcesPage}.tsx`,
`components/analysis/{TrendChart,BurnedAreaChart}.tsx`, `hooks/useRemoteData.ts`,
`lib/transparency-content.ts`.

Bukti: `tsc --noEmit` bersih · **`npm test` 44 uji lulus** (8 berkas) ·
`npm run build` 15,66 dtk · unduhan lewat proxy Vite → 200 · 63.880 B.

Di peramban sungguhan: `/tren` menampilkan dua garis pada dua sumbu (kiri
0–256.003, kanan 0–2.153) dengan label 2020–2026 dan keterangan nrt 600.323;
`/sumber` menampilkan 7 dataset, 7 baris penempatan titik, 7 celah data, 4 istilah,
dan 29 tautan unduhan.

Temuan:

1. **Grafik A1 digambar sebagai SVG, bukan ECharts** (rencana awal). Dua seri ×
   tujuh titik tidak menuntut pustaka grafik; ECharts ditunda ke A2/A3 yang butuh
   batang dan peringkat. Penyimpangan ini dicatat di `frontend/README.md`.
2. **Seri nrt tidak digambar pada skala itu** (600.323 akan meratakan garis arsip);
   angkanya tetap muncul sebagai keterangan berangka beserta alasannya.
3. **Dev server Vite harus dijalankan ulang** setelah `vite.config.ts` atau
   dependensi berubah. Tanpa itu `/api` dan `/tiles` dilayani `index.html` dan
   halaman melaporkan `Unexpected token '<'` — bukan galat backend.
4. **Tahun terakhir belum penuh.** Dari pemeriksaan peramban: titik panas 2026
   berhenti pada 2026-11-12; halaman tren kini menyebut tanggal itu supaya penurunan
   2026 tidak dibaca sebagai penurunan sepanjang tahun.

---

## Iterasi 10b — `feat/frontend-latest` (PR #16)

Tag `iter-10b-frontend-latest` menandai commit hasil *squash merge* di `main`
(`100618c`).

Bagian kedua iterasi 10: `P2` (lapisan titik panas terkini) dan `W1` (ringkasan
nasionalnya) sampai ke antarmuka, mengikuti kontrak yang sudah disetujui di
`../planning-GeoSafe/docs/API-P2.md`.

Berkas: `frontend/src/hooks/useLatestHotspots.ts` (baru) ·
`frontend/src/components/map/LatestControl.tsx` (baru) ·
`frontend/src/components/panel/LatestPanel.tsx` (baru) ·
`frontend/src/lib/latest-layer.ts` (baru) · `frontend/src/lib/format.ts` ·
`frontend/src/api/geosafe.ts` · `frontend/src/types/geosafe.ts` ·
`frontend/src/components/map/MapView.tsx` · `frontend/src/pages/MapPage.tsx` ·
`frontend/README.md`. Uji: empat berkas baru (`latest-layer`, `LatestControl`,
`LatestPanel`, `useLatestHotspots`) + `App.test.tsx` diperbarui.

Bentuknya: titik terkini digambar sebagai lapisan `circle` dari GeoJSON **di atas**
choropleth; titik dan ringkasan diambil bersama oleh satu hook supaya keduanya
dilayani generasi cache yang sama; penyegaran otomatis 15 menit tanpa memuat ulang
halaman plus tombol segarkan manual; angka terkini tidak pernah dijumlahkan dengan
arsip 2020–2026 dan panelnya menyatakan itu.

Bukti — lewat HTTP di jalur aplikasi (`http://127.0.0.1:8080`, nginx mem-proxy
`/api`), kunci FIRMS sungguhan:

| Uji | Hasil |
|---|---|
| `/api/v1/latest/summary?window=24` pertama (tarikan dingin) | **200** · 5,629 dtk · 1.308 B · `X-Cache: MISS` · **1.001 titik** · 103 kabupaten/kota · 262 di luar poligon (26,2 %) |
| `/api/v1/latest?window=24` | 200 · **0,042 dtk** · 237.563 B · `X-Cache: HIT` · 1.001 titik (sama dengan ringkasan) |
| `/api/v1/latest?window=48` | 200 · 0,050 dtk · 558.257 B · **2.353 titik** · 379 di luar poligon |
| `/api/v1/latest?window=72` | 200 · 0,082 dtk · 1.106.937 B · **4.666 titik** · 591 di luar poligon (12,7 %) · di bawah pagar 2 MB |
| invarian kontrak bagian 2 | `fetched_at` dan `point_count` identik antara `/latest` dan `/latest/summary` pada jendela yang sama |
| `npm run typecheck` · `npm test` · `npm run build` | bersih · **78 lulus** (13 berkas, dari 50 di `main`) · 13,95 dtk |
| `uv run pytest` (backend, tidak disentuh) | **69 lulus** |

Di peramban sungguhan (halaman hasil build di `:8080`): kanvas 1008 × 596;
**2.217 piksel** berwarna kelas choropleth dan **876 + 26 + 78 piksel** tiga kelas
keyakinan titik terkini tergambar (dihitung dari potret layar, bukan dari
keterangan); klik `24 jam` mengubah angka menjadi 1.001 titik / 103 kabupaten/kota /
262 di luar poligon — sama dengan angka HTTP jendela itu; tanpa pita galat peta.

Temuan:

1. **Salinan lama berkas worker `.mjs` di cache peramban tidak pernah
   kedaluwarsa.** Peta tampak kosong dengan pita "Worker failed to load" padahal
   `curl -sI` pada berkas `.mjs` hasil build menjawab `text/javascript`. Sebabnya
   bukan kode: nama berkas worker diturunkan dari isi berkasnya sehingga namanya
   tetap antar build, sementara peramban yang pernah membukanya **sebelum** nginx
   memetakan `.mjs` masih memegang salinan `application/octet-stream`, dan header
   `immutable` melarang validasi ulang. Dibuktikan dengan
   `fetch(url, {cache:'reload'})` di konsol halaman → `text/javascript`. Ditutup
   dengan kunci cache baru (`?v=mjs-mime` pada `setWorkerUrl`) dan dibuktikan:
   **muat ulang biasa** di tab yang cache-nya sudah rusak kini menggambar peta yang
   sama (876/26/78 piksel). Jebakannya masuk `frontend/README.md`.
2. **`sed` pada berkas DSN yang berkutip menghasilkan nilai berkutip.** Perintah di
   `AGENTS.md` jebakan 8 (`sed -n 's/^GEOSAFE_DATABASE_URL=//p'`) dipakai apa
   adanya untuk menjalankan `pytest` → **52 gagal, 17 lulus** karena psycopg
   menolak DSN berawalan tanda kutip. Setelah tanda kutipnya dibuang:
   **69 lulus** (angka yang benar, sama dengan klaim `README.md`). Perbaikan
   `AGENTS.md` **menunggu persetujuan pemilik repo** — berkas itu dibaca setiap
   sesi, jadi angka dan perintah yang salah di dalamnya menyesatkan sesi berikutnya.
3. **Putaran perbaikan setelah tinjauan.** Versi pertama ditolak
   (`passed: false`) dengan lima temuan yang semuanya diperbaiki: kegagalan
   penyegaran tadinya sunyi (kendali dan panel kini menyebutnya), angka jendela lama
   tetap tampil di sebelah tombol jendela baru, saran pada `truncated` mustahil
   diikuti (24 jam adalah jendela terpendek, dan penyempitan `bbox` memang belum
   ada di antarmuka), dua komentar mengklaim lebih dari yang dijamin kode (dua
   permintaan HTTP bisa jatuh di dua generasi cache), dan identifier Indonesia yang
   tersisa di uji/lib. Uji bertambah 75 → 78.
4. **`truncated` belum punya jalur keluar di antarmuka.** Kontrak meminta klien
   mengulang dengan `bbox` lebih sempit, tetapi antarmuka tidak punya kendali kotak
   wilayah. Yang dilakukan sekarang: menyatakan titiknya tidak digambar dan
   mengarahkan pembaca ke panel. Kendali `bbox` (atau pemotongan per tingkat zoom)
   masuk daftar yang belum dikerjakan di `frontend/README.md`.
5. **Penyegaran memakai `setInterval` biasa**, jadi peramban yang menahan timer di
   tab latar bisa meleset lebih dari 15 menit. `SRS-F-24` menyebut batas *paling
   sering* 15 menit, bukan jaminan tepat 15 menit — dicatat sebagai keputusan, bukan
   cacat.

## Versi yang terkunci

Dari `uv.lock` (2026-11-16): Python **3.13.14** (venv) · fastapi **0.163.1** ·
starlette **1.10.0** · uvicorn **0.54.0** · psycopg **3.3.9** · httpx **0.28.1** ·
pytest **9.2.0**.

## Riwayat perubahan dokumen perencanaan

Perubahan dokumen di `../planning-GeoSafe/` yang dipicu pekerjaan di repo ini:

| Tanggal | Dokumen | Perubahan |
|---|---|---|
| 2026-11-17 | `docs/SRS-GeoSafe.md` → **v1.8** | bagian 3.7.1: basis data pengembangan = **Aiven** (PostgreSQL 18.7 + PostGIS 3.6.4, TLS wajib), basis data lokal untuk ETL; baris riwayat menegaskan angka `NF-04`/`NF-05`/`NF-06`/`NF-08` **diukur di lokal** dan tidak boleh diklaim berlaku untuk Aiven. Jumlah kebutuhan tetap 126 |
| 2026-11-17 | `docs/ARSITEKTUR.md` | tabel komponen "Basis data", bagian versi yang dikunci (`psql` 18.6 kini ada di host), dan keputusan 5 baru: Aiven untuk pengembangan, lokal untuk ETL |
| 2026-11-17 | `PETA-DIREKTORI.md` · `AGENTS.md` | perintah periksa basis data langsung dari host + DSN Aiven dari `~/.config/geosafe/geosafe.env`; butir basis data (nomor 8) memuat keadaan baru |
| 2026-11-17 | `CATATAN-DISKUSI.md` | status proyek + entri **sesi ke-20** (migrasi ke Aiven: keputusan, bukti, konsekuensi kinerja) |
| 2026-11-17 | `docs/SRS-GeoSafe.md` → **v1.7** | baris `SRS-NF-09` dikoreksi: bukan lagi "≤ 4 permintaan ke API FIRMS per jam", melainkan **4 penyegaran per jam (cache 15 menit) = 12 permintaan satelit per jam** beserta biaya kuota terukur; `docx`/`pdf` dibangun ulang (33 halaman, daftar isi 47/47 judul). Jumlah kebutuhan tetap 126 |
| 2026-11-17 | `CATATAN-DISKUSI.md` | bagian F: keputusan join `STRtree` di Python ditandai **DIBATALKAN** dan diganti join SQL — kontrak `API-P2.md` bagian 6 dan aturan repo nomor 4 menuntut satu implementasi join di SQL |
| 2026-11-17 | `PETA-DIREKTORI.md` · `data/README.md` | baris `data/basemap/` (basemap PMTiles 216 MB: latar peta aplikasi, dilayani nginx, tidak masuk repo kode) ditambahkan ke tabel pencarian, pohon struktur, dan tabel isi folder — sebelumnya folder itu tidak terdaftar di penunjuk mana pun |
| 2026-11-16 | `docs/SRS-GeoSafe.md` → **v1.6** | `SRS-NF-04` dikoreksi jadi 0,25–0,30 dtk (jalur HTTP); `NF-05`/`NF-06`/`NF-08` ditandai "diukur di `psql`"; satu cacat lama di tabel riwayat diperbaiki. SRS 32 halaman, pengenal `SRS-*` tetap 132 |
| 2026-11-16 | `data/pembangun/LAPORAN-MUAT-POSTGRES.md` | bagian **6b**: koreksi angka 93 ms + pemisahan biaya SQL/HTTP |
| 2026-11-16 | `docs/ARSITEKTUR.md` | bagian 6 tidak lagi menulis `NF-04`/`NF-05`/`NF-06`/`NF-08` "belum diukur" |
| 2026-11-16 | `CATATAN-DISKUSI.md` | status proyek + entri sesi ke-19 |
| 2026-11-16 | `CATATAN-DISKUSI.md` | bagian C (baris iterasi 05), bagian G (bukti + 812 desa tanpa kode kecamatan induk), bagian F (antrean menjadi iterasi 06) |
| 2026-11-16 | `CATATAN-DISKUSI.md` | bagian C (baris iterasi 06), bagian G (bukti tren nasional), bagian H (antrean menjadi iterasi 07) |
| 2026-11-16 | `CATATAN-DISKUSI.md` | bagian C + H (penyisipan 06b: identifier Inggris, cabang dihapus, tag tetap) |
| 2026-11-16 | `CATATAN-DISKUSI.md` | bagian C (baris 07a + 07), bagian I/J (tile provinsi, frontend, temuan worker MapLibre), bagian K (antrean menjadi iterasi 08) |

## Cara menambah entri

1. Kerjakan satu cabang, buka PR, tulis bukti di deskripsi PR.
2. Setelah *squash merge*, tambahkan baris di tabel ringkasan dan satu bagian
   `## Iterasi NN — <slug> (PR #NN)` di berkas ini, isinya: berkas yang ditambah,
   perintah yang dijalankan, dan angka hasilnya.
3. Tambahkan tag `iter-NN-<slug>` di GitHub.
4. Perbarui tabel "Status" di `README.md` dan antrean di `MVP.md`.
