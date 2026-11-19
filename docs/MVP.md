# MVP — GeoSafe

*Minimum Viable Product.* Batasan **apa yang harus jalan lebih dulu** supaya
GeoSafe bisa didemokan dan dinilai, dan apa yang sengaja ditunda.

Status: 2026-11-19 · kelima fitur MVP (P1, C1, W2, A1, T1) selesai dan alurnya sudah
bisa dijalankan lewat satu alamat (`http://127.0.0.1:8080`, nginx menyajikan halaman
hasil build, meneruskan `/api` serta `/tiles` ke API, dan melayani basemap
`/pmtiles/`). Iterasi 10 (P2 titik panas terkini + W1 panelnya) selesai di API
(10a) dan di antarmuka (10b); iterasi 11 mengerjakan P4 kerawanan versi B — 11a
memindahkan basis data pengembangan ke Aiven, 11b menyelesaikan sisinya di API,
11c mengerjakannya di antarmuka sekaligus merapikan tampilan dan tata letak, 11d
menambahkan lapisan **kelas kerawanan desa** di API (per provinsi, zoom 8 ke
atas) beserta daftar provinsi untuk pemilihnya, dan 11e membawanya ke antarmuka
sakaligus mengganti koneksi basis data menjadi kolam (`psycopg_pool`, maksimal 3)
karena satu koneksi per permintaan tidak lagi cukup saat satu lapisan meminta
belasan tile sekaligus.
Sisa yang direncanakan: panel desa/kelurahan (`W4`), kepadatan per tahun sebagai
atribut tile, penanda tahun parsial, lalu `P3`/`P5` dan `A2`/`A3`. Skor kerawanan di
panel kabupaten/kota (`W2`) selesai di 12a, dan kendali kotak wilayah untuk kasus
`truncated` pada lapisan terkini selesai di 12k.

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
| P3, P5 peta kejadian dan titik | bergantung pada lapisan peta yang sudah stabil | setelah P1 stabil |
| A2, A3 komposisi dan peringkat | turunan dari A1 | cepat, setelah A1 |
| W1 panel terkini | bergantung P2 | bersama P2 |
| W3, W4 panel kecamatan/desa | angka pendukung, bukan unit analisis | setelah MVP |
| mode heatmap di P1 | ratusan ribu titik per tahun; diukur dulu | setelah P1 choropleth stabil |
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
| 12h | Vercel (di luar repo) | Basemap PMTiles 216 MB di Vercel Blob; homelab berhenti melayani basemap | ✅ `iter-12h-basemap-blob` |
| 12i | Vercel (di luar repo) | Sisa Vercel dirapikan: proyek sementara hilang (410), status `Vercel` menunjuk proyek `geosafe`, token unggah mati, dua store Blob yang tidak dipakai dihapus pemilik repo (2026-11-19) | ✅ `iter-12i-vercel-cleanup` |
| 12j | Cloudflare R2 (di luar repo) | Basemap 216 MB pindah ke R2 (`geosafe-basemap` + domain `geosafe-tiles.zisaltech.site`); unggah REST 39,6 dtk; peta terbukti `206` dari R2 dengan **0** permintaan ke Blob | ✅ `iter-12j-basemap-r2` |
| 12k | `feat/frontend-latest-bbox` — lapisan terkini bisa dipersempit ke kotak peta saat muatan `truncated`; kotak dipotong ke batas wilayah Indonesia lebih dulu | ✅ PR #30, tag `iter-12k-latest-bbox` |
| — | panel desa `W4`, kepadatan per tahun sebagai atribut tile, penanda tahun parsial, lalu `P3`/`P5` dan `A2`/`A3` | belum dijadwalkan |

Urutan ini boleh bergeser; yang tidak boleh: memasukkan P2/P4 sebelum alur inti
(P1 → C1 → W2 → A1 → T1) berjalan, karena keduanya menambah ketergantungan luar
(kuota FIRMS, bobot yang belum disetujui).
