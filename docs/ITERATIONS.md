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
| 12b | `fix/frontend-nrt-leftovers` | sisa seri NRT dibersihkan: kolom `nrt` dan kode mati di halaman tren hilang, T1 mengirim rincian seri arsip + menyatakan NRT tidak dimuat, `README` 29 → 31 tabel | #24 | `iter-12b-t1-archive-nrt` |
| 12c | `ci/github-actions` | CI GitHub Actions: job **frontend** (typecheck · 113 uji · build) dan **backend** (93 uji ke basis data hidup lewat role baca-saja `geosafe_ci`); proteksi `main` mewajibkan kedua check, admin tetap boleh push dokumen | #25 | `iter-12c-ci-github-actions` |
| 12d | `ci/deploy-self-hosted` | CD: runner self-hosted di mesin ini (label `geosafe`, unit pengguna `geosafe-runner.service`), `deploy.yml` pada push ke `main` — sinkron working copy, build, restart API, reload nginx, uji asap `:8080` | #26 · #27 | `iter-12d-deploy-self-hosted` |
| 12e | `feat/cors-vercel-preview` | API publik lewat Cloudflare Tunnel `geosafe-api.zisaltech.site` + `CORSMiddleware` (origin `geosafe*.vercel.app`, hanya `GET`) agar frontend bisa dipratinjau di Vercel; `frontend/vercel.json` | #28 | `iter-12e-vercel-preview` |
| 12f | Vercel (di luar repo) | Proyek `geosafe` di Vercel: Root Directory `frontend`, Vite, `VITE_API_BASE=https://geosafe-api.zisaltech.site`, protection dimatikan; deploy produksi `READY` dan `CORS` terbukti untuk origin Vercel asli | — | `iter-12f-vercel-preview-live` |
| 12g | `fix/vercel-basemap` | Basemap bisa diarahkan lewat `VITE_BASEMAP_URL`; nginx mengirim CORS untuk berkas PMTiles; tanpa basemap seluruh peta kosong | #29 | `iter-12g-vercel-basemap` |
| 12h | Vercel (di luar repo) | Basemap 216 MB pindah ke Vercel Blob (`geosafe-basemap-files`, unggah 206,1 MB / 43,7 dtk lewat token sisi-klien); host `geosafe-tiles` dicabut dari tunnel + CNAME-nya dihapus | — | `iter-12h-basemap-blob` |
| 12i | Vercel (di luar repo) | Sisa Vercel dirapikan: proyek `omniroute-relay`/`geosafe-uploader` hilang (`404`/`410`), status `Vercel` menunjuk proyek `geosafe`, token unggah tidak dipakai lagi | — | `iter-12i-vercel-cleanup` |
| 12j | Cloudflare R2 (di luar repo) | Basemap 216 MB pindah ke R2 (`geosafe-basemap` + domain `geosafe-tiles.zisaltech.site`); unggah REST 39,6 dtk; peta terbukti `206` dari R2 dengan **0** permintaan ke Blob | — | `iter-12j-basemap-r2` |
| 12k | `feat/frontend-latest-bbox` | `truncated` di lapisan terkini punya jalan keluar: kendali kotak peta mengirim `bbox` hasil potongan batas Indonesia; `bash`/`pytest` tidak berubah | #30 | `iter-12k-latest-bbox` |
| 12l | `chore/drop-homelab-frontend` | Hosting frontend di mesin ini dihapus: nginx dimatikan & di-disable, situs `:8080` hilang, CD hanya memuat ulang API, basemap dev dari R2 | #31 | `iter-12l-vercel-only` |
| 12m | `feat/api-village-panel` | Panel desa/kelurahan `W4`: endpoint `GET /api/v1/panel/desa/{kode}` + panel di antarmuka (klik poligon desa maupun pencarian) | #32 | `iter-12m-village-panel` |
| 13a | `feat/api-composition-ranking` | `A2` komposisi (10 provinsi + 10 kabupaten/kota, metrik titik panas ↔ kejadian, pangsa %) + `A3` peringkat 514 kabupaten/kota (urut titik panas/kepadatan/kejadian, pencarian) + penanda tahun parsial dari tanggal deteksi terakhir | #33 | `iter-13a-composition-ranking` |
| 13b | `feat/api-tile-yearly-density` | Kepadatan titik panas **per tahun** jadi properti tile kabupaten/kota dan muncul di bacaan kursor; rumusnya dibuktikan sama dengan metrik `hotspot_per_1000_km2` tersimpan | #34 | `iter-13b-tile-density` |
| 14 | `feat/api-panel-kecamatan` | Panel kecamatan `W3`: `GET /api/v1/panel/kecamatan/{kode}` (baris bulanan disaring, sifat angka pendukung dinyatakan) + `DistrictDetailPanel` di antarmuka lewat hasil pencarian | #35 | `iter-14-district-panel` |

Semua dikerjakan 2026-11-16, kecuali penyisipan 09b serta iterasi 11a, 11b, 11c, 11d, dan 11e (2026-11-17),
iterasi 12a–12b (data bangun ulang 2026-11-19), dan iterasi 12k–12m serta 13a, 13b, 14 (2026-11-19). Cabang **tidak dihapus** setelah digabung (lihat
[`CONVENTIONS.md`](CONVENTIONS.md) bagian 4) — satu pengecualian: cabang
`refactor/api-english-identifiers` dihapus atas permintaan pemilik repo, tag
`iter-06b-english-names` tetap dibuat.

---

## Iterasi 14 — `feat/api-panel-kecamatan` (panel kecamatan `W3`)

Antrean tinggal menyisakan `W3` di antara panel wilayah; `W2` (03), `W4` (12m), dan sisi
analisisnya sudah jalan. SRS menetapkan isinya dengan tegas — `SRS-F-63`: identitas, luas,
kejadian per tahun, titik panas per tahun, kepadatan; `SRS-F-64`: angka kecamatan **pendukung**,
bukan unit analisis — dan tabel sumbernya `panel_kecamatan.csv` → `DISTRICT_FACTS`.

Data diperiksa dulu (read-only, 2026-11-19) sebelum satu baris kode ditulis:

| Hal | Angka |
|---|---|
| baris tabel `districts` | **7.357** |
| tanpa kode BPS di sumbernya | **188** — tidak bisa dibuka sebagai panel |
| berkode BPS | **7.169**, semuanya punya baris titik panas |
| punya baris kejadian | **1.525** dari 7.169 |
| baris `district_facts` metrik `hotspot_count` | **150.942**, **95.949 di antaranya bulanan** |

Dua hal terakhir itu yang menentukan bentuk endpoint: tanpa `month is null` satu tahun tampil
beberapa kali (Jekan Raya 2023 = 293 tahunan **plus** 57/81/154/1 bulanan), dan cakupan kejadian
yang hanya 1 dari 5 kecamatan harus dinyatakan di `notes`, bukan ditampilkan sebagai nol.
Kelas/skor kerawanan tidak ikut: `P4` menyusunnya hanya untuk kabupaten/kota dan desa.

| Berkas | Isi |
|---|---|
| `backend/app/routers/panels.py` | `district_router` + `QUERY_DISTRICT_PANEL` + `_district_notes` (tag `W3 panel kecamatan`) |
| `backend/app/main.py` | router didaftarkan di antara `W2` dan `W4` |
| `backend/tests/test_panels.py` | 6 uji baru terhadap basis data hidup |
| `frontend/src/api/geosafe.ts` · `types/geosafe.ts` | `fetchDistrictPanel` + `DistrictPanelData` |
| `frontend/src/components/panel/DistrictDetailPanel.tsx` (+ uji) | panel `W3`: identitas, penanda "pendukung", kepadatan, tabel titik panas, tabel kejadian |
| `frontend/src/pages/MapPage.tsx` | cabang `district`: hasil pencarian kecamatan membuka panel, bukan placeholder "belum dikerjakan" |

```
cd backend && uv run pytest -q
120 passed, 1 warning in 32,66 dtk          (sebelumnya 114)
uv run pytest -q tests/test_panels.py
17 passed, 1 warning in 2,38 dtk

cd frontend && npm run typecheck && npm test
tsc --noEmit                                 (bersih)
Test Files 20 passed (20)
Tests      154 passed (154)                  (sebelumnya 148)
```

Bukti jalur yang dipakai peramban — `systemctl --user restart geosafe-api`, lalu lewat HTTP
bukan `psql`:

```
GET /health                              → 200
GET /api/v1/panel/kecamatan/6271012      → 200 (28 ms) · 2023 = 293, baris bulanan tersaring
GET /api/v1/panel/kecamatan/9999999      → 404
GET /api/v1/panel/kecamatan/6271         → 422 (kode kecamatan selalu 7 digit)
GET /openapi.json                        → 20 path (sebelumnya 19)
```

CI pada PR: `frontend` (typecheck · 154 uji · build) lulus 32 dtk, `backend` (120 uji ke basis data
hidup lewat role baca-saja) lulus 1m54s. Setelah *squash merge* (`a204f41`), job **Deploy** lulus
20 dtk dan tag `iter-14-district-panel` menunjuk commit hasil merge.

Temuan yang harus diingat:

1. **`_single_value` membaca `value_text`, `district_facts` tidak punya kolom itu.** Versi pertama
   gagal `KeyError: 'value_text'` pada 5 uji. Perbaikannya di SQL (`null::text as value_text`),
   bukan menyalin helper — bentuk baris `W2`/`W3`/`W4` tetap satu sehingga helper-nya tetap satu.
2. **"Tidak punya baris fakta" bukan satu keadaan.** Angka pertama yang keluar (188 kecamatan tanpa
   baris) ternyata seluruhnya baris **tanpa kode BPS**; 7.169 kecamatan yang berkode justru semuanya
   punya baris titik panas. Menyebut keduanya "belum dimuat" akan salah — karena itu satu `notes`
   untuk 188 tanpa kode, dan satu `notes` lain untuk cakupan kejadian 1.525/7.169.
3. **Keterangan yang wajib tampil dua kali membuat uji `getByText` ambigu.** "Pendukung, bukan unit
   analisis" ditulis di panel **dan** di `notes` (keduanya dituntut SRS), sehingga uji memakai pola
   beranchor (`^Angka kecamatan…`) alih-alih `getByText` telanjang.

Ikut disinkronkan dalam iterasi ini (dokumen yang menyatakan keadaan sekarang):

- `README.md` — 19 → **20 endpoint**, 114 → **120 uji**, baris status frontend menyebut `W3`,
  148 → **154 uji**, baris iterasi jadi **14**, dan tabel endpoint memuat `panel/kecamatan`,
  `panel/desa`, `analysis/composition`, `analysis/ranking` yang tadinya belum terdaftar.
- `docs/MVP.md` — baris 13b dilengkapi nomor PR-nya (**#34**, tadinya masih `PR`), ditambah baris 14,
  dan tabel "Yang sengaja tidak masuk MVP" tidak lagi menyebut `W3`/`W4`/`A2`/`A3` sebagai tertunda.
- `frontend/README.md` — basemap tidak lagi "dilayani nginx" (R2), panel `W4`/`W3` dan grafik
  `A2`/`A3` tidak lagi berstatus "belum dikerjakan", pohon komponen menyebut panel yang ada.

## Iterasi 13b — `feat/api-tile-yearly-density` (kepadatan per tahun di tile)

Antrean menyebut "kepadatan per tahun sebagai atribut tile". Ternyata **tidak perlu ETL**: metrik
`hotspot_per_1000_km2` yang tersimpan memang tidak bertahun, tetapi ia adalah **rata-rata kepadatan
tahunan 2020–2025** — dibuktikan dengan membandingkan 514 baris terhadap
`avg(hotspot_tahunan) × 1000 / luas`: **0 baris** berselisih lebih dari 0,05. Jadi kepadatan satu
tahun cukup dihitung di query tile dengan rumus yang sama.

| Hal | Nilai |
|---|---|
| Berkas | `backend/app/routers/maps.py` (`QUERY_REGION_TILE`), `frontend/src/components/map/thematic-layer.ts` (`readoutText`) |
| Properti tile baru | `hotspot_per_1000_km2` = `round(hotspot_count × 1000 / area_km2, 2)`, ikut penyaring `confidence` bila dipakai |
| Tingkat provinsi | **tidak** mendapat properti ini: `provinces` tidak menyimpan `area_km2`, dan menghitung luas dari geometri per permintaan tile belum diukur biayanya — dinyatakan di docstring endpoint |
| Bacaan kursor | `Merauke · 22.463 titik panas 2023 · 485,62 per 1.000 km²` |
| Uji | backend **114 lulus** (112 sebelumnya), frontend **148 lulus** (19 berkas; 146 sebelumnya), `tsc --noEmit` bersih, `npm run build` ok |

Bukti lewat peramban (Vite dev → API `:8000`, Chrome tab di depan), tahun 2023, peta diarahkan ke
Merauke lewat pencarian lalu kursor disapu 20 titik di kanvas:

| Wilayah | Bacaan yang muncul |
|---|---|
| Merauke | `Merauke · 22.463 titik panas 2023 · 485,62 per 1.000 km²` |
| Mappi | `Mappi · 1.338 titik panas 2023 · 59,09 per 1.000 km²` |

Tile yang sama diambil langsung lewat peramban: `GET /tiles/regions/0/0/0.mvt?year=2023` → `200`,
**56.674 B**, nama properti `hotspot_per_1000_km2` ada di protobuf.

Temuan:

1. **Kepadatan tile mengikuti seri `main`, sedangkan panel dan peringkat memakai `main + fill`.**
   Merauke 2023: tile **22.463** (main), panel/peringkat **22.474** (arsip total) — selisih 11
   deteksi. Itu perilaku lama peta (selalu `main`, `SRS-F-13`), tetapi sekarang ikut terlihat di
   angka kepadatan, jadi perbedaannya dicatat di sini dan di docstring `maps.py`.
2. **Provinsi tidak punya luas wilayah di basis data.** Menghitung `ST_Area(geom)` per permintaan
   tile akan menambah biaya yang belum diukur hanya untuk satu properti tambahan; yang dipilih:
   properti itu hanya ada di tingkat kabupaten/kota, dan alasannya tertulis di kode + `/docs`.
3. **Verifikasi pertama di peramban gagal secara menipu**: `performance` tidak memuat permintaan
   tile karena MapLibre menariknya dari worker, sehingga "0 tile" terbaca padahal tile-nya ada.
   Yang menentukan: bacaan kursor yang benar-benar muncul.

## Iterasi 13a — `feat/api-composition-ranking` (`A2` + `A3` + penanda tahun parsial)

Di halaman analisis baru, `A2` menjawab "wilayah mana yang paling banyak" dan `A3` menjawab
"bagaimana urutan seluruh kabupaten/kota". Keduanya membaca `REGION_FACTS` yang sudah dipakai
`A1`, jadi iterasi ini tidak menambah satu baris data pun — hanya dua endpoint dan satu halaman.

| Hal | Nilai |
|---|---|
| Endpoint | `GET /api/v1/analysis/composition?year=&metric=` (tag `A2`, default `hotspot_count`) dan `GET /api/v1/analysis/ranking?year=` (tag `A3`); total endpoint aplikasi 17 → **19** |
| Isi komposisi | 10 provinsi + 10 kabupaten/kota teratas, `value` + `share_pct`, `total` per tingkat, `coverage` tahun, `notes` |
| Isi peringkat | seluruh **514** baris: titik panas tahun itu, kepadatan (tanpa tahun), kejadian tahun itu |
| Pengurutan/pencarian | di peramban (`RankingTable`), bukan parameter API — 514 baris = ± 60 kB sekali muat |
| Penanda tahun parsial | `coverage_by_year` di `A1`, `coverage` di `A2`/`A3`, plus pita peringatan dan tanda `*` di tabel angka |
| Uji | backend **112 lulus** (102 sebelumnya), frontend **146 lulus** (19 berkas; 133 sebelumnya), `tsc --noEmit` bersih |

Bukti lewat peramban (Vite dev `:5173` → API `:8000`, Chrome tab di depan):

| Yang diklik | Hasil nyata |
|---|---|
| halaman `/analisis` (tahun bawaan 2026) | pita "Tahun 2026 belum penuh: data titik panas terukur sampai **2026-07-31** (212 dari 365 hari, **58,10%** tahun)"; komposisi titik panas 2026 → Kalimantan Barat **9.187** (15,02%), Papua Selatan 6.699 (10,95%); peringkat **514 baris**, teratas Merauke 5.228 |
| metrik → `Kejadian` | satuan berubah jadi "kejadian"; provinsi teratas Jawa Tengah **189** (17,03%), kabupaten/kota teratas Klaten **40** (3,60%) |
| tahun → `2023` | kejadian 2023 → Kalimantan Selatan **449** (20,85%); peringkat 2023 → Merauke **22.474**, Ogan Komering Ilir 17.867 |
| urut → `Kepadatan / 1.000 km²` | Kota Cilegon **2.961,56** per 1.000 km² di puncak — wilayah kecil padat deteksi, bukan wilayah dengan titik panas terbanyak |
| cari `merauke` | **1 baris tampil**, Merauke (9301) · Papua Selatan |

Temuan:

1. **Metrik `hotspot_coverage_pct` tidak bisa dipakai sebagai penanda tahun parsial.** Metrik itu
   ditulis **dua baris per tahun tanpa pembeda** (2020: 68,9 dan 70,8; 2023: 54,9 dan 59,2) —
   tidak ada kolom yang membedakan keduanya. Penanda karena itu diturunkan dari
   `point_observations`: tanggal deteksi terakhir per tahun. Hasilnya tegas: 2020–2025 terukur
   sampai 31 Desember, **2026 hanya sampai 2026-07-31** (212 hari, 58,1%).
2. **Nilai satu wilayah per tahun = `main` + `fill`.** Satu wilayah bisa punya dua baris seri
   (`2023`: 514 baris `main` + 241 baris `fill`), jadi query menjumlahkan keduanya; total
   kabupaten/kota, total provinsi, dan angka nasional `A1` sama-sama **256.222** untuk 2023 —
   bukti ketiga jalur itu konsisten.
3. **Kepadatan tidak bertahun** (`region_facts.hotspot_per_1000_km2` seluruhnya tanpa `year`), jadi
   kolom itu tidak berubah saat tahun diganti dan itu dinyatakan di catatan — bukan dibiarkan
   terbaca sebagai angka tahun terpilih.
4. **Query coverage memindai 918 ribu baris (1,2 dtk di Aiven)**, sedangkan nilainya hanya berubah
   kalau ETL dijalankan ulang; hasilnya di-cache 15 menit di proses. Setelah cache hangat,
   `/analysis/national_trend` diukur **47 ms**.
5. **`ranking` mengirim seluruh 514 baris sekali** dan membiarkan peramban mengurutkan/mencari.
   Parameter `sort`/`q` sengaja tidak dibuat: memindahkannya ke server menambah permintaan tanpa
   menghemat muatan. Konsekuensinya dicatat di `notes` balasan.

## Iterasi 12m — `feat/api-village-panel` (`W4` panel desa/kelurahan)

Panel desa/kelurahan sudah lama jadi lubang terakhir di daftar panel: klik di lapisan desa
bahkan sengaja tidak membuka apa pun (`W4` belum ada), dan hasil pencarian desa hanya
mengarahkan peta. Datanya ternyata sudah tersedia sejak ETL pertama — `VILLAGE_FACTS` memuat
titik panas tahunan, kejadian tahunan, kepadatan, dan kelas kerawanan desa.

| Hal | Nilai |
|---|---|
| Endpoint | `GET /api/v1/panel/desa/{village_code}` (10 digit, tag `W4 panel desa/kelurahan`; router kedua di `panels.py`, didaftarkan di `main.py`) |
| Isi balasan | identitas + rantai wilayah induk, `hotspot_by_year` (per seri), `event_by_year`, `risk_class_desa`, `hotspot_per_1000_km2`, `notes` |
| Antarmuka | `VillageDetailPanel` di `MapPage`: terbuka saat poligon desa diklik **atau** desa dipilih dari pencarian `C1` |
| Uji | backend **102 lulus** (96 sebelumnya), frontend **133 lulus** (17 berkas; 125 sebelumnya), `tsc --noEmit` bersih |

Bukti lewat peramban (Vite dev di `127.0.0.1:5173`, API di `:8000`, Chrome dengan tab di depan):

1. Pencarian `Bukit Tunggal` → hasil desa `6271012003` → panel: **Jekan Raya · Kota
   Palangkaraya · Kalimantan Tengah · kode 6271012003**, luas **274,18 km²**, kelas kerawanan
   **Tinggi**, kepadatan **80,85 per 1.000 km²**.
2. Lapisan `Kerawanan desa` + provinsi Kalimantan Tengah → klik satu poligon desa di kanvas →
   panel: **Tumbang Jalemu (6211010011) · Manuhing · Gunung Mas · Kalimantan Tengah**, luas
   **76,19 km²**; permintaan `/api/v1/panel/desa/6211010011` tercatat di jaringan peramban.
3. Tabel titik panas desa Bukit Tunggal: 2020 **1**, 2021 **4**, 2023 **128**, 2026 **21**,
   2022/2024/2025 **0** (nol terukur); kejadian 2020–2024 dan 2026 ada, 2025 tidak.

Temuan:

1. **`VILLAGE_FACTS` memuat baris bulanan di samping baris tahunan.** Desa 6271012003 tahun
   2023 punya baris bulan 8, 9, 10, 11 (5, 37, 85, 1) **dan** baris tahunan 128 di tabel yang
   sama, semuanya dengan `month` terisi/kosong berbeda. Tanpa `month is null`, satu tahun tampil
   lima kali dan angkanya terbaca jauh lebih besar. Diuji langsung: baris 2023 harus tepat satu
   dan bernilai 128.
2. **Angka kejadian hanya tersedia untuk 2.181 dari 83.530 desa.** Desa tanpa baris tidak boleh
   tampil "0 kejadian"; panel menyebutnya di catatan, dan desa tanpa satu pun baris kejadian
   (mis. Sungai Ambawang Kuala, `6112080011`) mendapat kalimat khusus di bagian kejadian.
3. **Kelas kerawanan desa wajib disebut sebagai susunan penelitian** (`SRS-F-66`), bukan hanya
   di catatan kaki: labelnya menempel pada angka kelasnya di panel.

## Iterasi 12l — `chore/drop-homelab-frontend`

Frontend produksi sudah pindah ke Vercel (12e–12j), tetapi mesin ini masih menyajikan salinan
kedua di `:8080` lewat nginx: hasil `npm run build`, proxy `/api` + `/tiles`, dan berkas basemap
`/pmtiles/`. Dua salinan halaman berarti dua tempat yang bisa berbeda versi, dan CD membangun
frontend di sini setiap push padahal yang dipakai pengguna adalah Vercel. Iterasi ini menghapus
salinan itu.

| Hal | Sebelum | Sesudah |
|---|---|---|
| nginx | `active`, situs `geosafe` di `/etc/nginx/sites-enabled/` | `inactive` + `disabled`; symlink situs dihapus; port 8080 kosong |
| CD (`deploy.yml`) | `npm ci` + `npm run build`, `reload nginx`, uji asap `:8080` | hanya sinkron working copy, `uv sync --frozen`, `restart geosafe-api`, uji asap `/health` + panel Merauke di `:8000` |
| Basemap dev | `/pmtiles/` dari nginx (`vite.config.ts` mem-proxy ke `:8080`) | langsung dari Cloudflare R2 (`BASEMAP_URL` bawaan); proxy `/pmtiles` dibuang |
| Berkas lama | — | `deploy/nginx/geosafe.conf` tetap di disk + salinan `~/geosafe-nginx-geosafe.conf.bak-20261119` |

Bukti di mesin ini setelah perubahan: `systemctl is-active nginx` → `inactive`; `ss -ltnp | grep 8080`
kosong; API tetap `200` di `http://127.0.0.1:8000/health`.

Temuan:

1. **`npm run dev` ternyata tidak pernah butuh nginx untuk `/api` maupun `/tiles`** — Vite
   mem-proxy keduanya langsung ke `8000`; nginx hanya dipakai untuk `/pmtiles`. Karena basemap
   sudah pindah ke R2 (12j), satu-satunya alasan nginx hidup hilang.
2. **CD lama akan gagal begitu nginx dimatikan**, dan kegagalan itu tidak kentara: `sudo -n
   systemctl reload nginx` pada unit yang `disabled` tetap bisa sukses me-restart unit, lalu uji
   asap `:8080` yang gagal. Workflow diubah **dalam commit yang sama** dengan pematian nginx.
3. **Alamat basemap sekarang ada di kode sebagai bawaan** (`src/lib/map-style.ts`) karena tidak ada
   lagi server lokal yang menyajikannya. `VITE_BASEMAP_URL` tetap bisa menimpanya; ini berbeda dari
   `VITE_API_BASE` yang tetap tidak boleh ditulis di kode (API-nya bergantung lingkungan).

## Iterasi 12k — `feat/frontend-latest-bbox` (PR #30)

Lapisan titik terkini sudah lama punya satu keadaan tanpa jalan keluar: begitu muatan
`/latest` melewati 2 MB, API mengganti `points` dengan `null` dan menyetel
`truncated: true`, sementara kontrak `API-P2.md` bagian 1 meminta **klien** mengulang
permintaan dengan `bbox` lebih sempit — dan antarmuka tidak punya kendali kotak wilayah.
Iterasi ini menutup celah itu tanpa menyentuh backend: parameter `bbox` sudah ada dan
sudah diuji di sana sejak iterasi 10a.

| Hal | Nilai |
|---|---|
| Berkas disentuh | `src/lib/format.ts` (`bboxParam`), `src/api/geosafe.ts`, `src/hooks/useLatestHotspots.ts`, `src/components/map/MapView.tsx`, `src/components/map/LatestControl.tsx`, `src/pages/MapPage.tsx` + 5 berkas uji |
| Kendali | tombol **Batasi ke area tampak** (muncul saat `truncated`) dan **Seluruh Indonesia** (untuk melepas batas) |
| Kotak peta | dilaporkan `MapView` saat gaya siap **dan** setiap `moveend`; dikirim hanya ketika tombol ditekan, tidak setiap kali peta digeser |
| Pembulatan | 4 desimal (± 11 m) supaya URL pendek dan cache 60 detik tidak pecah per piksel |
| Uji | `npm test` **125 lulus** (16 berkas; sebelumnya 113), `npm run typecheck` bersih, `npm run build` ok |
| Backend | tidak berubah |

Bukti lewat peramban (Chrome, CDP, tab di depan), dengan pagar 2 MB di server uji
sementara dikecilkan ke 20 kB supaya `truncated` benar-benar terjadi pada data nyata:

1. Awal: pita "Titik tidak digambar: muatan melewati 2 MB" + tombol, seperti yang
   diharapkan.
2. Cari `Jawa Tengah` → peta `fitBounds` ke provinsi → tekan tombol.
3. Permintaan tercatat:
   `/api/v1/latest?window=72&bbox=107.5137,-8.4559,112.7337,-5.4801` dan
   `/api/v1/latest/summary?window=72&bbox=…` (kotak sama), keduanya `200`.
4. Pita hilang, kendali membaca **36 titik di dalam kotak peta · tarikan 19 Nov 2026,
   16.16 WIB**, tanpa galat.

`bbox` di API sendiri diukur ulang tanpa perubahan backend: `window=72` → **4.390** titik;
`window=72&bbox=95,-11,120,-2` → **413** titik.

Temuan:

1. **Kotak peta pada zoom nasional lebih lebar daripada Indonesia.** `getBounds()` di
   zoom 3,2 mengembalikan 79,1695…156,8305 E / -24,064…19,4199 N, sedangkan API menolak
   `bbox` di luar `94,5…141,5` / `-11,5…6,5` dengan `422`. Versi pertama iterasi ini
   mengirim kotak apa adanya: setiap klik dijawab `422` — tepat pada keadaan yang memicu
   `truncated`. Perbaikan: kotak dipotong ke batas API sebelum dikirim, dan bila hasil
   potongannya kosong (peta sedang menunjuk area di luar Indonesia) tombol dimatikan
   (`bboxParam` → `null`). Ditemukan di peramban, bukan di uji unit.
2. **Balasan tidak memuat `bbox` yang dipakai**, jadi kesegaran data terhadap kotak tidak
   bisa diperiksa seperti jendela jam (`window_hours`). Yang dijaga: kotak hanya berubah
   atas permintaan pengguna, dan pita "Hanya titik di dalam kotak peta" menyatakan
   bahwa angkanya bukan angka nasional.
3. **Angka nasional di panel `W1` tidak ikut menyempit** — `bbox` hanya menyaring
   `top_provinces` (`API-P2.md` bagian 2). Panel sengaja tidak diubah supaya tidak ada
   dua bacaan nasional yang berbeda di satu layar.

## Iterasi 12h — basemap pindah ke Vercel Blob (di luar repo)

Basemap 216 MB tidak lagi dilayani mesin ini ke internet; berkasnya sekarang di Vercel Blob.

| Hal | Nilai |
|---|---|
| Store | `geosafe-basemap-files` (`store_NWn0yxwn6uGGKlp6`), publik, region `sin1` |
| URL | `https://nwn0yxwn6uggklp6.public.blob.vercel-storage.com/indonesia.pmtiles` |
| Unggahan | 206,1 MB dalam **43,7 dtk** dari mesin ini lewat token sisi-klien `@vercel/blob/client` |
| Sajian | `206 Partial Content` · `content-range: bytes 0-99/216138172` · `access-control-allow-origin: *` |
| Env proyek | `VITE_BASEMAP_URL=pmtiles://https://nwn0yxwn6uggklp6.public.blob.vercel-storage.com/indonesia.pmtiles` |
| Tunnel | `geosafe-tiles.zisaltech.site` dicabut dari ingress **dan** CNAME-nya dihapus; sisa tunnel hanya `geosafe-api` |
| Lokal | nginx tetap menyajikan `/pmtiles/indonesia.pmtiles` untuk `npm run dev` |

Bukti: deploy produksi `dpl_7aitLqA9WdtdnQ917ybDF1NR8Afn` (`READY`), bundel memuat host Blob **1×**,
peramban melakukan **6 permintaan rentang `206`** ke Blob, dan tangkapan layar area peta punya **5.718
warna unik** (laut `#80deea`, darat `#c4e7d2`) — sama dengan versi lokal yang sehat.

Temuan:

1. **Fungsi Vercel tidak bisa dipakai memindahkan berkas 216 MB.** Percobaan 1: fungsi menarik dari
   tunnel lalu menulis ke Blob → Cloudflare membalas `403` untuk egress datacenter (UA browser tidak
   menolong). Percobaan 2: `terminated` setelah 7 dtk. Jalur yang berhasil: **token unggah sisi-klien**,
   berkas dikirim langsung dari mesin ini ke Blob tanpa melewati badan fungsi.
2. **Token rahasia tidak perlu berpindah mesin.** Token store dibuat di dalam Vercel (env proyek
   sementara), dan yang dipakai di mesin ini hanya token unggah berdurasi pendek dari rute
   `/api/token`; rute itu sudah dinonaktifkan (`404`) setelah unggahan selesai.
3. **Jangan menilai kesiapan berkas dari status HTTP saja.** SPA rewrite Vercel menjawab path
   `.pmtiles` yang tidak ada dengan `index.html` berkode `206`, sehingga "apakah URL hidup" lolos
   padahal klien gagal mengurai. Yang menentukan: `content-type` dan `content-range`.

## Iterasi 12j — basemap pindah ke Cloudflare R2 (di luar repo)

Vercel Blob dihitung per transfer, dan peta memicu beberapa permintaan rentang setiap kunjungan. Basemap
dipindah ke R2 yang **tidak memungut biaya egress**.

| Hal | Nilai |
|---|---|
| Bucket | `geosafe-basemap` (location hint `apac`, kelas Standard) |
| Objek | `indonesia.pmtiles` · **216.138.172 byte** · etag `dfdf311c…` |
| Unggahan | REST Cloudflare `PUT /accounts/…/r2/buckets/geosafe-basemap/objects/indonesia.pmtiles` → **HTTP 200**, **39,6 dtk** |
| Domain | `geosafe-tiles.zisaltech.site` (CNAME `public.r2.dev`, TLS 1.2+, status aktif) |
| CORS | `GET`/`HEAD`, header `range`, `exposeHeaders: Content-Range, Content-Length, Accept-Ranges, ETag` |
| Env | `VITE_BASEMAP_URL=pmtiles://https://geosafe-tiles.zisaltech.site/indonesia.pmtiles` |

Bukti di peramban (produksi `dpl_GKd5Q78UWLRmypgY4g5MbbNf3dFf`): bundel memuat host R2 **1×** dan host
Blob **0×**; halaman melakukan **6 permintaan rentang `206`** ke `geosafe-tiles.zisaltech.site` dan
**0** ke Blob; tangkapan layar area peta **5.703 warna unik** (laut `#80deea`, darat `#c4e7d2`).
`curl -r 0-99` ke domain R2: `206` + `content-range: bytes 0-99/216138172` +
`access-control-allow-origin: <origin Vercel>`.

Temuan:

1. **Token Cloudflare API ≠ kredensial S3 R2.** Token `cfat_…` yang diberikan awalnya sah untuk
   `/accounts` (200) tetapi R2 menolak (`401 Authentication error 10000`) karena izin
   *Workers R2 Storage* belum ada. Setelah izin ditambahkan, unggahan REST berjalan tanpa perlu
   `Access Key ID`/`Secret Access Key`.
2. **Custom domain R2 butuh waktu provision.** Permintaan pertama dibalas `403` `error code: 1014`
   (CNAME cross-user) selama status `ssl: pending`/`ownership: pending`; sekitar satu menit kemudian
   statusnya aktif dan balasan berubah menjadi `404` (objek belum ada) lalu `206` setelah unggahan.
3. **Token rahasia tidak disimpan.** Nilainya hanya dipakai untuk satu unggahan lewat berkas
   `~/.config/geosafe/cf_token.txt` (chmod 600) yang **sudah dihapus**; token itu sendiri harus
   di-revoke di dasbor karena sempat tertulis di percakapan.

## Iterasi 12i — merapikan sisa Vercel

Pembersihan setelah 12f–12h, tanpa menyentuh aplikasi.

| Hal | Bukti |
|---|---|
| Proyek sementara `geosafe-uploader` | **sudah dihapus** — `GET /v9/projects/geosafe-uploader` → `404`; tiga URL deployment-nya → `410` (termasuk rute `/api/token`) |
| Rute penerbit token | mati, jadi tidak ada lagi jalan menerbitkan token unggah untuk store mana pun |
| Status `Vercel` pada commit `771bd2d` | `success` → `vercel.com/…/geosafe/HjKtJBBygrAeyzicKiE2F8NF1goK` — **menunjuk proyek `geosafe`**, bukan lagi `omniroute-relay` |
| Basemap | `206` dari `nwn0yxwn6uggklp6.public.blob.vercel-storage.com/indonesia.pmtiles` (216.138.172 byte) |
| Situs produksi | `200` |
| Env proyek | `VITE_API_BASE`, `VITE_BASEMAP_URL` (keduanya plain), dan `BLOB_READ_WRITE_TOKEN` milik store **kosong** |
| Git integrasi | push ke `main` benar-benar memicu deployment (`dpl_HjKt…` untuk commit `771bd2d`), dan pratinjau per cabang sudah terbukti sejak 12f |

Tersisa satu langkah manual yang **tidak bisa** dilakukan lewat API/MCP: menghapus store kosong
`geosafe-basemap` (`store_3QUGvXe0QDtRRitP`, 0 byte) dari dasbor Vercel → *Storage → geosafe-basemap →
Delete*. Menghapus store itu sekaligus mencabut `BLOB_READ_WRITE_TOKEN` yang menempel di proyek `geosafe`
(token itu tidak dipakai kode; frontend hanya butuh dua variabel `VITE_*`). Store `geosafe-basemap-files`
yang berisi basemap **jangan** dihapus — URL publiknya dipakai `VITE_BASEMAP_URL`.

## Iterasi 12g — `fix/vercel-basemap` (PR #29)

Basemap di pratinjau Vercel berakhir kosong karena `BASEMAP_URL` masih relatif ke origin (`/pmtiles/...`):
berkasnya tidak ada di Vercel, dan karena layer tematik dipasang setelah gaya selesai dimuat, seluruh
peta ikut hilang — bukan hanya latar. Perbaikan: `BASEMAP_URL` dibaca dari `VITE_BASEMAP_URL` (bawaan
tetap jalur lokal), dan blok `/pmtiles/indonesia.pmtiles` di nginx mengirim CORS +
`Access-Control-Expose-Headers`. Verifikasi: `206` + `content-range` dari host publik, bundel memuat
host basemap 1×, area peta 5.718 warna unik.

## Iterasi 12f — pratinjau frontend di Vercel (di luar repo)

Frontend kini punya pratinjau di Vercel; API tetap di mesin ini. Tidak ada berkas repo
yang berubah kecuali dokumentasi — konfigurasi proyeknya hidup di Vercel.

| Hal | Nilai |
|---|---|
| Proyek | `geosafe` (`prj_SoYy4Gxw8MXbVFjLc8GZH9p4B3IB`), tim `muhamad-azizs-projects-83e323d5` (plan hobby) |
| Setelan | Root Directory `frontend`, framework Vite, build `npm run build`, output `dist`, Node `26.x` |
| Variabel | `VITE_API_BASE=https://geosafe-api.zisaltech.site` (production + preview + development) |
| Protection | Vercel Authentication **dimatikan** supaya tautan bisa dibuka tanpa login |
| Deploy pertama | `dpl_C9PHp73pBmSvJJ6aB8nbFvvmFkvr` → state **READY**, commit `f6f14c7` |
| Alamat | `https://geosafe-muhamad-azizs-projects-83e323d5.vercel.app` (produksi) · `…-git-main-…` |

Bukti:

| Uji | Hasil |
|---|---|
| `curl` halaman produksi tanpa login | **200** (sebelum protection dimatikan: 302 ke Vercel Authentication) |
| `curl /tren` (rute dalam SPA) | **200** — rewrite `vercel.json` bekerja |
| Bundle `index-tHbdsBPx.js` | memuat `geosafe-api.zisaltech.site` **1 kali** → `VITE_API_BASE` benar-benar masuk saat build |
| `curl` API dengan `Origin` Vercel asli | `HTTP/2 200` + `access-control-allow-origin: https://geosafe-9c8y5qzca-…vercel.app` |

Temuan:

1. **Pratinjau yang dilindungi tidak bisa diverifikasi dengan `curl`.** Deploy pertama membalas
   `302 Protected by Vercel Authentication`; halaman terlihat "gagal" padahal build-nya sehat.
   Verifikasi harus lewat `web_fetch_vercel_url` (MCP) atau setelah protection dimatikan.
2. **Membuktikan `VITE_API_BASE` terpakai** tidak cukup dengan melihat build sukses: string host harus
   dicari di berkas JS hasil build. Tanpa itu aplikasi memanggil alamat relatif dan semua panel kosong.
3. **Repo ini masih tertaut ke proyek Vercel lain (`omniroute-relay`)** yang memunculkan check bernama
   `Vercel` di setiap PR. Proyek itu 404 lewat API (di luar scope token MCP), jadi pelepasan tautannya
   manual di dasbor: proyek `omniroute-relay` → Settings → Git → Disconnect.
4. **Basemap PMTiles tidak ikut** (216 MB, di luar git): di Vercel peta menggambar geometri di atas
   latar polos. Degradasi yang disengaja, bukan bug.

## Iterasi 12e — `feat/cors-vercel-preview` (PR #28)

API dibuka ke publik lewat Cloudflare Tunnel dan diberi CORS, karena pratinjau Vercel memanggil domain
lain. Sebelum ini `app/main.py` tidak punya middleware CORS sama sekali.

| Hal | Nilai |
|---|---|
| Tunnel | `geosafe-api.zisaltech.site` → `http://127.0.0.1:8000`, id `b7e28aca-692a-4c0f-ba5e-a0e900f7617f` |
| Konfigurasi | `/etc/cloudflared/config-geosafe-api.yml` + unit sistem `cloudflared-geosafe-api.service` |
| CORS | `GEOSAFE_ALLOWED_ORIGINS` (bawaan dua alamat lokal) + regex `https://geosafe*.vercel.app`, **hanya `GET`** |
| Uji | `pytest -q` **96 passed** (+3 uji `test_cors.py`); `curl /health` lewat tunnel **200**; header CORS terkirim untuk origin Vercel |

## Iterasi 12d — `ci/deploy-self-hosted` (PR #26 · #27)

CD ke mesin ini lewat runner **self-hosted** (label `geosafe`, `~/actions-runner`, unit pengguna
`geosafe-runner.service`, runner `2.338.2`). `deploy.yml` hanya berjalan pada push ke `main`:
sinkron working copy (`merge --ff-only`, menolak kalau bukan `main` atau kotor), `uv sync --frozen`,
`npm ci && npm run build`, `systemctl --user restart geosafe-api`, `sudo systemctl reload nginx`,
lalu uji asap.

| Uji | Hasil |
|---|---|
| Deploy pertama (`#26`) | **gagal**: uji asap membaca `/health` = **502** karena uvicorn belum siap |
| Perbaikan (`#27`) | uji asap menunggu sampai 30 dtk sebelum menyimpulkan gagal → **success 1 mnt 1 dtk** |
| Uji asap | `:8080` 200 · `/health` 200 · panel Merauke memuat `risk_score_a` |
| Rancangan awal yang dibatalkan | `git reset --hard origin/main` → **diganti** `merge --ff-only` + pemeriksaan bersih, supaya cabang lokal dan pekerjaan yang belum di-commit tidak tertimpa |

## Iterasi 12c — `ci/github-actions` (PR #25)

CI pertama untuk repo ini. Sebelumnya `AGENTS.md` menyatakan "tidak ada CI";
sekarang setiap push dan PR menjalankan dua job yang isinya **persis perintah
harian**: `frontend` (`npm ci` · `typecheck` · 113 uji · build) dan `backend`
(`uv sync --frozen` · koleksi uji · 93 uji ke basis data hidup).

Bukti dan angka:

| Hal | Hasil |
|---|---|
| Role baru di Aiven | `geosafe_ci`: login, tanpa SUPERUSER/CREATEDB/CREATEROLE, NOINHERIT; `SELECT` pada 15 tabel `public` + hak baca sequence; `has_schema_privilege(...,'CREATE')` = **false** |
| Seluruh uji dengan DSN role itu | **93 passed**, 34,92 dtk — bukti semua uji memang hanya membaca |
| Rahasia | `gh secret set GEOSAFE_DATABASE_URL` (role CI), tidak pernah ditulis di repo dan tidak dicetak |
| Job `frontend` di runner | **pass**, 25–37 dtk |
| Job `backend` di runner | **pass**, 1 mnt 48 dtk – 1 mnt 51 dtk (runner GitHub → Aiven) |
| Proteksi `main` | check wajib: `frontend (typecheck · test · build)` + `backend (pytest ke basis data hidup)`; `enforce_admins` **false** (pemilik repo tetap boleh push dokumen), force-push dan hapus cabang ditolak |

Temuan:

1. **Versi action harus yang benar-benar ada.** Dua percobaan gagal dalam 2 dtk
   dengan `Unable to resolve action astral-sh/setup-uv@v8` lalu `@v10`: rilis
   terbaru hanya punya tag `v10.3.3`, tanpa ref mayor bergerak. Dipakai tag
   rilis penuh.
2. **Dua uji unduhan tidak bisa jalan di runner** karena folder
   `../planning-GeoSafe/data/siap-pakai/` ada di luar repo: `0 >= 25` gagal dan
   unduhan menjawab `404`. Bukan cacat kode — endpoint-nya memang menjawab jujur
   (`count: 0` + catatan). Diselesaikan dengan `pytest.mark.skipif` berdasarkan
   `data_dir().is_dir()` (bukan tiruan), sehingga di mesin ini tetap 93 uji dan
   di runner 91 lulus + 2 dilewati dengan alasan tercetak.
3. **Repo publik + uji yang butuh rahasia** menuntut pagar: PR dari fork tidak
   menerima secret, jadi job backend hanya sampai `pytest --collect-only` dan
   menulis alasannya di ringkasan job. Tidak ada masukan tak tepercaya yang
   dipakai di `run:`; `permissions: contents: read`.

## Iterasi 12b — `fix/frontend-nrt-leftovers` (PR #24)

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
| 2026-11-19 | `docs/SRS-GeoSafe.md` → **v1.9** | bagian 3.7.1: halaman dilayani **Vercel**, latar peta dilayani **Cloudflare R2**, API = unit systemd pengguna + **Cloudflare Tunnel** `geosafe-api.zisaltech.site`, dan baris "Peladen web dan layanan" tidak lagi menyebut nginx; `docx`/`pdf` dibangun ulang (**35 halaman**, daftar isi 47/47 judul). Jumlah kebutuhan tetap 126 |
| 2026-11-19 | `docs/ARSITEKTUR.md` | diagram bagian 2 (Vercel + R2 + tunnel, tanpa nginx), tabel komponen (Basemap di R2, Deploy di Vercel + systemd + tunnel), tabel alur bagian 4 (nama endpoint yang benar + `W4`, `A2`/`A3`, penyempitan `bbox`, 4 tingkat pencarian), risiko baru (Vercel/Tunnel, dua basis data), dan **bagian 10: enam keputusan 2026-11-19** (Vercel-only, basemap R2, `month is null` untuk `W4`, ranking 514 baris di peramban, penanda tahun parsial dari `point_observations`, kepadatan per tahun di tile + seri `main` vs `main + fill`) |
| 2026-11-19 | `CATATAN-DISKUSI.md` | entri **sesi ke-26**: iterasi 12k/12l/12m/13a/13b beserta angka dan buktinya, delapan keputusan teknis, dokumen yang ikut berubah, dan empat butir terbuka (`P3`, `P5`, `W3`, revisi 6.383 → 6.390) |
| 2026-11-19 | `docs/API-P2.md` | bagian "Aturan pemotongan (2 MB)": penyempitan `bbox` **sudah dipakai antarmuka** beserta aturan potong ke `94,5…141,5`/`-11,5…6,5` dan alasan tidak otomatis per geseran; keputusan 9 #1: batas laju dihitung aplikasi FastAPI, bukan nginx |
| 2026-11-19 | `PETA-DIREKTORI.md` · `data/README.md` | basemap: disajikan **Cloudflare R2** (`geosafe-tiles.zisaltech.site`), bukan nginx `/pmtiles/` |
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
