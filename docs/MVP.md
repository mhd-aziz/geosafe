# MVP — GeoSafe

*Minimum Viable Product.* Batasan **apa yang harus jalan lebih dulu** supaya
GeoSafe bisa didemokan dan dinilai, dan apa yang sengaja ditunda.

Status: 2026-11-19 · kelima fitur MVP (P1, C1, W2, A1, T1) selesai dan alurnya sudah
bisa dijalankan lewat satu alamat (halaman di **Vercel**, API di mesin ini lewat Cloudflare
Tunnel `geosafe-api.zisaltech.site`, basemap dari Cloudflare R2; salinan halaman di
`127.0.0.1:8080` dihapus pada 12l). Iterasi 10 (P2 titik panas terkini + W1 panelnya) selesai di API
(10a) dan di antarmuka (10b); iterasi 11 mengerjakan P4 kerawanan versi B — 11a
memindahkan basis data pengembangan ke Aiven, 11b menyelesaikan sisinya di API,
11c mengerjakannya di antarmuka sekaligus merapikan tampilan dan tata letak, 11d
menambahkan lapisan **kelas kerawanan desa** di API (per provinsi, zoom 8 ke
atas) beserta daftar provinsi untuk pemilihnya, dan 11e membawanya ke antarmuka
sakaligus mengganti koneksi basis data menjadi kolam (`psycopg_pool`, maksimal 3)
karena satu koneksi per permintaan tidak lagi cukup saat satu lapisan meminta
belasan tile sekaligus.
Sisa yang direncanakan: kepadatan per tahun sebagai atribut tile, lalu `P3`/`P5`. Skor
kerawanan di panel kabupaten/kota (`W2`) selesai di 12a, kendali kotak wilayah untuk kasus
`truncated` pada lapisan terkini selesai di 12k, panel desa/kelurahan (`W4`) selesai di 12m,
dan komposisi (`A2`), peringkat (`A3`), serta penanda tahun parsial selesai di 13a. Sisa antrean
peta ditutup di 14–18 (panel `W3`, peta kejadian `P3`, titik kejadian `P5`, penyaring kepercayaan,
mode heatmap `P1`), lalu **19** menutup celah terakhir penyisiran `SRS`: halaman Sumber & Batas
Data mencantumkan versi dokumen SRS (`SRS-S-04`) dan redaksi `SRS-F-02` disesuaikan dengan
empat halaman yang benar-benar ada. Tidak ada fitur peta yang tersisa; yang terbuka tinggal
kualitas (optimasi heatmap `SRS-NF-08`, dokumen pengujian terpisah, deck/DFD Level 1).

---

## 1. Pernyataan MVP

Satu alur utuh yang bisa ditunjukkan di depan dosen:

> **orang membuka satu halaman → memilih tahun → melihat peta warna kabupaten/kota
> menurut jumlah titik panas → mengklik satu kabupaten → melihat angka titik panas,
> kejadian, status darurat, dan IRBI-nya → menelusuri asal angkanya di halaman
> Sumber & Batas Data.**

Kalau alur itu jalan, GeoSafe sudah bisa dinilai sebagai purwarupa yang bekerja.
Fitur lain memperkuat, tapi tidak menentukan.

## 2. Isi MVP (5 dari 14 fitur)

| Kode | Fitur | Kriteria selesai |
|---|---|---|
| **P1** | peta sebaran titik panas kabupaten/kota | choropleth dari MVT, filter tahun 2020–2026, legenda + skala warna, saklar tingkat provinsi |
| **C1** | pencarian wilayah 4 tingkat | ketik nama/kode → daftar provinsi + kabupaten/kota + kecamatan + desa/kelurahan (maks 20 baris) → pilih → peta bergerak ke wilayah itu |
| **W2** | panel kabupaten/kota | satu panel memuat: jumlah titik panas per tahun, jumlah kejadian, status darurat 2025, IRBI 2025 |
| **A1** | tren 2020–2026 dua seri | garis titik panas **dan** kejadian pada satu grafik, dua sumbu terpisah, keterangan bahwa dua seri itu alat ukur berbeda |
| **T1** | sumber & batas data | daftar 7 dataset + URL + tanggal akses + jumlah baris, 7 celah data, unduh CSV, daftar istilah |

## 3. Yang sengaja tidak masuk MVP

| Fitur / hal | Ditunda karena | Kapan |
|---|---|---|
| P2 titik panas terkini | butuh penarik FIRMS + cache 15 menit + snapshot; kuota kunci harus dijaga | iterasi setelah MVP jalan |
| P4 peta kerawanan (versi B) | skor disusun sendiri; bobot + uji sensitivitas belum ditetapkan | setelah W2/A1 jadi bahan pembanding |
| P3 peta kejadian | bergantung pada lapisan peta yang sudah stabil | ✅ dikerjakan 15 |
| P5 peta titik | 6.383 titik kejadian + tingkat ketelitian koordinat; butuh keputusan tampilan | ✅ dikerjakan 16 (GeoJSON, bukan tile: 841 KB untuk tahun terbesar) |
| A2, A3 komposisi dan peringkat | turunan dari A1 | ✅ dikerjakan 13a |
| W1 panel terkini | bergantung P2 | bersama P2 |
| W3, W4 panel kecamatan/desa | angka pendukung, bukan unit analisis | ✅ dikerjakan: `W4` di 12m, `W3` di 14 |
| mode heatmap di P1 | ratusan ribu titik per tahun; diukur dulu | ✅ dikerjakan 18 (agregasi sel grid, 1,4 MB → 84 KB per tile) |
| basemap PMTiles (216 MB) | berkas besar; untuk MVP cukup geometri sendiri di atas latar polos | sebelum demo |
| HTTPS + domain | perlu saat dipasang, bukan saat dikembangkan | saat unjuk kerja |

## 4. Definisi "selesai" untuk setiap iterasi

Satu iterasi dianggap selesai kalau **semua** ini benar:

1. `uv run pytest` lulus (uji endpoint nyata, bukan uji palsu).
2. Angka yang dijanjikan diukur lewat jalur yang dipakai peramban (HTTP), bukan lewat `psql` saja.
3. Ada PR dengan deskripsi memuat bukti jalannya, di-*squash merge*, dan diberi tag `iter-NN-<slug>`.
4. `README.md` diperbarui: daftar endpoint dan hasil ukur terbaru.

## 5. Urutan iterasi

| Iterasi | Isi | Status |
|---|---|---|
| 01 | `feat/api-database` — koneksi PostgreSQL + `GET /api/v1/sources` | ✅ PR #1, tag `iter-01-api-database` |
| 02 | `feat/api-tiles` — tile MVT kabupaten/kota (dasar P1) | ✅ PR #2, tag `iter-02-api-tiles` |
| 03 | `feat/api-panel` — panel kabupaten/kota (W2) | ✅ PR #3, tag `iter-03-api-panel` |
| 04 | `fix/tile-missing-regions` — tile memuat wilayah yang belum punya baris fakta (39 wilayah pada 2020) | ✅ PR #4, tag `iter-04-tile-missing-regions` |
| 05 | `feat/api-search` — pencarian wilayah empat tingkat (C1) | ✅ PR #5, tag `iter-05-api-search` |
| 06 | `feat/api-trend` — tren nasional dua seri (A1) | ✅ PR #6, tag `iter-06-api-trend` |
| 07 | `feat/frontend-app` — frontend: peta choropleth + pencarian + panel (Vite 7.3.8) | ✅ PR #9, tag `iter-07-frontend` |
| 08 | `feat/frontend-t1-trend` — halaman tren (A1) + Sumber & Batas Data (T1) + router | ✅ PR #12, tag `iter-08-frontend-t1` |
| 09a | deploy: API sebagai unit systemd pengguna | ✅ PR #10, tag `iter-09a-api-service` |
| 09b | deploy: nginx menyajikan halaman hasil build + proxy API (port 8080); berkas `deploy/` dikeluarkan dari git | ✅ PR #13, tag `iter-09b-nginx` |
| 09c | `feat/frontend-basemap` — basemap PMTiles z12 (216 MB) di luar repo, dilayani nginx `/pmtiles/`, gaya Protomaps | ✅ PR #14, tag `iter-09c-basemap` |
| 10a | `feat/api-latest-hotspots` — `P2`/`W1` di API: tarikan FIRMS, cache 15 menit, snapshot, join kabupaten/kota saat permintaan | ✅ PR #15, tag `iter-10a-latest-api` |
| 10b | `feat/frontend-latest` — lapisan terkini di peta, pemilih 24/48/72 jam, panel `W1` | ✅ PR #16, tag `iter-10b-frontend-latest` |
| 11a | basis data pengembangan pindah ke Aiven (PG 18.7 + PostGIS 3.6.4) + skrip sinkronisasi data | ✅ PR #17, tag `iter-11a-aiven-db` |
| 11b | `feat/api-risk-map` — `P4` di API: tile kerawanan tiga skema bobot + endpoint uji sensitivitas | ✅ PR #19, tag `iter-11b-risk-api` |
| 11c | `feat/frontend-risk-ui` — `P4` di antarmuka: pemilih skema, legenda kelas, bacaan skor, perapian tampilan + responsif | ✅ PR #20, tag `iter-11c-risk-ui` |
| 11d | `feat/api-village-risk-tiles` — `P4` di API: tile kelas kerawanan desa per provinsi (`SRS-F-38`) + daftar provinsi untuk pemilihnya, pagar zoom di `app/tiles.py` | ✅ PR #21, tag `iter-11d-village-risk-api` |
| 11e | `feat/frontend-village-risk` — `P4` di antarmuka: lapisan kerawanan desa + pemilih provinsi, zoom peta dijaga 8 ke atas; sekaligus `fix(api)` kolam koneksi | ✅ PR #22, tag `iter-11e-village-risk-ui` |
| 12a | `feat/api-panel-risk-density` — data bangun ulang 2026-11-19 masuk aplikasi: angka uji disinkronkan, skor kerawanan tiga skema di panel `W2`, label kepadatan "rata-rata 2020–2025" | ✅ PR #23, tag `iter-12a-data-sync-panel` |
| 12b | `fix/frontend-nrt-leftovers` — sisa seri NRT dibersihkan dari antarmuka, T1 mengirim rincian seri arsip dan menyatakan NRT tidak dimuat | ✅ PR #24, tag `iter-12b-t1-archive-nrt` |
| 12c | `ci/github-actions` — CI GitHub Actions (frontend + backend ke basis data hidup lewat role baca-saja), proteksi `main` mewajibkan check | ✅ PR #25, tag `iter-12c-ci-github-actions` |
| 12d | `ci/deploy-self-hosted` — CD: runner self-hosted di mesin ini, deploy otomatis ke `:8080` pada push ke `main` | ✅ PR #26 · #27, tag `iter-12d-deploy-self-hosted` |
| 12e | `feat/cors-vercel-preview` — API publik (Cloudflare Tunnel) + CORS untuk origin pratinjau Vercel | ✅ PR #28, tag `iter-12e-vercel-preview` |
| 12f | Vercel (di luar repo) — pratinjau frontend hidup dengan `VITE_API_BASE` ke API publik | ✅ `iter-12f-vercel-preview-live` |
| 12h | (di luar repo) Basemap PMTiles 216 MB di Vercel Blob; homelab berhenti melayani basemap | ✅ `iter-12h-basemap-blob` |
| 12i | (di luar repo) Sisa Vercel dirapikan: proyek sementara hilang (410), status `Vercel` menunjuk proyek `geosafe`, token unggah mati, dua store Blob yang tidak dipakai dihapus pemilik repo (2026-11-19) | ✅ `iter-12i-vercel-cleanup` |
| 12j | (di luar repo) Basemap 216 MB pindah ke Cloudflare R2 (`geosafe-basemap` + domain `geosafe-tiles.zisaltech.site`); unggah REST 39,6 dtk; peta terbukti `206` dari R2 dengan **0** permintaan ke Blob | ✅ `iter-12j-basemap-r2` |
| 12k | `feat/frontend-latest-bbox` — lapisan terkini bisa dipersempit ke kotak peta saat muatan `truncated`; kotak dipotong ke batas wilayah Indonesia lebih dulu | ✅ PR #30, tag `iter-12k-latest-bbox` |
| 12l | `chore/drop-homelab-frontend` — hosting frontend di mesin ini dihapus (nginx mati, `:8080` hilang), CD hanya memuat ulang API, basemap dev dari R2; halaman sepenuhnya di Vercel | ✅ PR #31, tag `iter-12l-vercel-only` |
| 12m | `feat/api-village-panel` — panel desa/kelurahan (`W4`): `GET /api/v1/panel/desa/{kode}` + panel di antarmuka, terbuka dari klik poligon desa maupun pencarian | ✅ PR #32, tag `iter-12m-village-panel` |
| 13a | `feat/api-composition-ranking` — `A2` komposisi wilayah + `A3` peringkat 514 kabupaten/kota + penanda tahun parsial dari tanggal deteksi terakhir | ✅ PR #33, tag `iter-13a-composition-ranking` |
| 13b | `feat/api-tile-yearly-density` — kepadatan titik panas per tahun jadi properti tile kabupaten/kota + tampil di bacaan kursor | ✅ PR #34, tag `iter-13b-tile-density` |
| 14 | `feat/api-panel-kecamatan` — panel kecamatan (`W3`): `GET /api/v1/panel/kecamatan/{kode}` + panel di antarmuka lewat hasil pencarian; baris bulanan disaring, sifat angka pendukung dinyatakan | ✅ PR #35, tag `iter-14-district-panel` |
| 15 | `feat/api-event-map` — peta kejadian (`P3`): `GET /tiles/events/{z}/{x}/{y}.mvt?year=` + lapisan keempat "Kejadian" dengan panel angka nasional tahun terpilih | ✅ PR #36, tag `iter-15-event-map` |
| 16 | `feat/api-event-points` — peta titik kejadian (`P5`): `GET /api/v1/events/points?year=` + lapisan kelima dengan warna/ukuran menurut ketelitian koordinat, panel rincian kejadian, dan jalan ke panel wilayah | ✅ PR #37, tag `iter-16-event-points` |
| 17 | `feat/frontend-confidence-filter` — penyaring kepercayaan `h`/`n`/`l` di lapisan titik panas (`SRS-F-15`) + angka tampilan aktif dan titik di luar poligon (`SRS-F-16`) | ✅ PR #38, tag `iter-17-confidence-filter` |
| 17b | `fix/legend-coverage-series` — angka legenda penempatan titik diambil dari `point_count` supaya berjumlah dengan `placed`/`outside` | ✅ PR #39, tag `iter-17b-coverage-line` |
| 18 | `feat/api-heatmap-mode` — mode heatmap `P1` (`SRS-F-14`): tile titik berkoordinat diagregasi per sel grid + saklar Choropleth/Heatmap, mulai zoom 4 | ✅ PR #40, tag `iter-18-heatmap` |
| 19 | `feat/frontend-srs-version` — halaman Sumber & Batas Data mencantumkan versi dokumen SRS (`SRS-S-04`) + angka kejadian daftar istilah disinkronkan ke 6.390 | ✅ PR #41, tag `iter-19-srs-version` |
| 20 | `feat/frontend-srs-v1-12` — sinkronisasi angka dokumen perencanaan ke muat ulang 2026-11-19 + SRS **v1.12** (`SRS-D-06` 1.655, `SRS-D-09` 837.075, `SRS-AS-03` 31 tabel) + `SRS_DOCUMENT` di halaman `/sumber` naik ke 1.12 | ✅ PR #42, tag `iter-20-srs-v1-12` |

Urutan ini boleh bergeser; yang tidak boleh: memasukkan P2/P4 sebelum alur inti
(P1 → C1 → W2 → A1 → T1) berjalan, karena keduanya menambah ketergantungan luar
(kuota FIRMS, bobot yang belum disetujui).
