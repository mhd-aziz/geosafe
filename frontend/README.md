# GeoSafe — frontend

Antarmuka web GeoSafe: peta choropleth sebaran titik panas kabupaten/kota dan
provinsi, lapisan kerawanan (`P4`), pencarian wilayah empat tingkat, dan panel
wilayah. React 19 + TypeScript + Vite 7.3.8 + Tailwind CSS 4 + MapLibre GL JS.

## Menjalankan

Prasyarat: **Node 20.19 atau lebih baru** (Vite 7 menolak versi lebih lama).
Tidak perlu basis data untuk menjalankan uji; untuk memakai aplikasinya, API
FastAPI di `../backend/` harus hidup di `127.0.0.1:8000`.

```bash
cd frontend
npm ci            # sekali; memasang dari package-lock.json
npm run dev       # http://127.0.0.1:5173
```

Selama pengembangan, Vite mem-proxy `/api` dan `/tiles` ke `127.0.0.1:8000`
(lihat `vite.config.ts`), jadi tidak ada alamat API di dalam kode dan tidak ada
kunci rahasia di sisi peramban. Basemap 216 MB **tidak** diproxy: berkasnya ditarik
langsung dari Cloudflare R2 (`geosafe-tiles.zisaltech.site`, bawaan `BASEMAP_URL` di
`src/lib/map-style.ts`), dan `VITE_BASEMAP_URL` bisa menimpanya bila ingin memakai
berkas lokal. Sejak 2026-11-19 mesin homelab tidak lagi menyajikan frontend maupun
`/pmtiles/`, jadi `npm run dev` tidak butuh nginx.

### Pratinjau di Vercel

Frontend bisa dipasang di Vercel untuk pratinjau (API tetap di homelab). Di
sana tidak ada proxy, jadi alamat API wajib diberikan lewat variabel lingkungan
**`VITE_API_BASE`** saat build (nilainya dibaca `src/api/client.ts`); contoh:
`VITE_API_BASE=https://geosafe-api.zisaltech.site`. API itu dijangkau lewat
Cloudflare Tunnel dan hanya mengizinkan origin `https://geosafe*.vercel.app`
(CORS, lihat `backend/app/config.py`). `vercel.json` di folder ini mengatur build
Vite + SPA fallback.

Basemap PMTiles (216 MB) **tidak** ikut ke Vercel sebagai berkas repo, melainkan disajikan dari
**Cloudflare R2** di domain sendiri dan alamatnya diisi lewat **`VITE_BASEMAP_URL`**, contoh:

```
VITE_BASEMAP_URL=pmtiles://https://geosafe-tiles.zisaltech.site/indonesia.pmtiles
```

Tanpa variabel itu, bawaannya tetap URL R2 di `src/lib/map-style.ts` (dipakai `npm run dev` juga).
Kalau basemap gagal dimuat, **seluruh peta kosong** — bukan hanya latar — karena layer tematik dipasang
setelah gaya selesai dimuat.

Perintah lain:

```bash
npm test          # uji Vitest (jsdom), sekali jalan — tanpa basis data
npm run test:watch
npm run typecheck # tsc --noEmit
npm run build     # tsc --noEmit + vite build ke dist/
npm run preview   # menyajikan hasil build
```

Catatan perkakas:

- **Vite 7.3.8 dikunci**, bukan 8: bundler Vite 8 (Rolldown) mati `SIGILL` pada
  CPU tanpa AVX/AVX2. `@vitejs/plugin-react` juga harus 5.x (6.x menuntut Vite 8).
- **npm 11 memblokir skrip instalasi paket.** Persetujuan untuk esbuild sudah
  tercatat di `package.json` (`allowScripts`), jadi `npm ci` biasa sudah cukup.
  Kalau npm tetap menolak, jalankan `npm install-scripts approve esbuild` sekali.
- Peta memerlukan **WebGL**; kalau peramban tidak menyediakannya, halaman tetap
  jalan dan menampilkan pesan bahwa peta tidak dapat digambar.

## Struktur

```
frontend/
├── index.html                  kerangka halaman (lang="id")
├── vite.config.ts              plugin React + Tailwind, proxy API, konfigurasi Vitest
├── tsconfig.json               strict, noUnusedLocals, verbatimModuleSyntax
└── src/
    ├── main.tsx                pemasangan React ke #root + BrowserRouter
    ├── App.tsx                 kerangka: judul, navigasi, rute, keterangan sumber
    ├── index.css               masuknya Tailwind (`@import 'tailwindcss'`)
    ├── pages/                  MapPage · TrendPage · AnalysisPage · SourcesPage (satu berkas per halaman)
    ├── api/                    client.ts (pembungkus fetch) · geosafe.ts (per endpoint)
    ├── components/
    │   ├── map/                MapView · MapToolbar · LatestControl · Legend
    │   ├── search/             SearchBox
    │   ├── panel/              RegionPanel · DistrictDetailPanel · VillageDetailPanel · LatestPanel · RiskPanel · VillagePanel
    │   ├── analysis/           TrendChart · BurnedAreaChart (SVG, tanpa pustaka grafik)
    │   └── common/             DataNotes
    ├── hooks/                  useDebouncedValue · useRegionSearch · useRegionPanel ·
    │                           useLatestHotspots (lapisan terkini) · useEventPoints (titik kejadian) ·
    │                           useSourceSummary · useRemoteData (baca-saja halaman)
    ├── lib/                    constants · format · choropleth · events · event-points · latest-layer ·
    │                           map-style · risk · transparency-content
    ├── types/geosafe.ts        bentuk balasan API (nama medan = nama kolom DB)
    └── test/setup.ts           pembersihan DOM antar uji
```

Halaman: `/` peta (P1 + P3 lapisan kejadian + P5 titik kejadian + C1 + W2 + P2/W1 lapisan terkini + W3 panel kecamatan + W4 panel desa) · `/tren` grafik nasional
(A1) · `/analisis` komposisi wilayah (A2) + peringkat kabupaten/kota (A3) · `/sumber` Sumber &
Batas Data (T1). Uji diletakkan bersebelahan dengan berkas yang diuji
(`*.test.ts(x)`), supaya perubahan komponen dan ujinya terlihat dalam satu
tampilan diff.

## Jebakan yang sudah kena

1. **Address worker MapLibre harus dikunci** (`setWorkerUrl` + impor `?url`). Tanpa
   itu peta **kosong tanpa pesan galat** di antarmuka: MapLibre v6 menurunkan URL
   worker dari `import.meta.url`, yang di bawah `optimizeDeps` Vite menunjuk berkas
   yang tidak ada. Penyebabnya hanya terlihat dari konsol peramban.
2. **Dev server harus dijalankan ulang setelah `vite.config.ts` atau dependensi
   berubah.** Sekali kejadian: `/api` dan `/tiles` dilayani `index.html` (bukan
   diteruskan ke backend) karena proses dev server masih memakai konfigurasi sebelum
   perubahan, sehingga halaman melaporkan "Unexpected token '<'".
3. **Uji jsdom dan `tsc` tidak menangkap dua hal di atas.** Halaman wajib dibuka
   sekali di peramban sungguhan sebelum sebuah iterasi ditutup.
4. **Basemap butuh tiga hal sekaligus, dan kalau satu hilang gejalanya berbeda:**
   berkas PMTiles dari Cloudflare R2 (`geosafe-tiles.zisaltech.site`; kalau sumber
   salah atau CORS-nya hilang → peta kosong), protokol `pmtiles` terdaftar sebelum
   gaya dipasang (kalau tidak → sumber gagal dimuat), dan berkas font/sprite dari
   `protomaps.github.io/basemaps-assets` (kalau tanpa internet → geometri tetap
   tergambar tetapi semua nama tempat hilang). Periksa berkasnya per rentang byte:
   `curl -r 0-99 -D- https://geosafe-tiles.zisaltech.site/indonesia.pmtiles` harus
   menjawab `206` dengan `Content-Range`.
5. **Salinan lama berkas worker di cache peramban tidak pernah kedaluwarsa.**
   Berkas `maplibre-gl-worker-<hash>.mjs` diberi `Cache-Control: immutable`, dan
   namanya diturunkan dari isi berkasnya — jadi peramban yang pernah membukanya
   saat nginx **belum** memetakan `.mjs` masih memakai salinan
   `application/octet-stream`, dan petanya kosong dengan pita "Worker failed to
   load" walaupun `curl -sI` pada berkas itu sudah menjawab `text/javascript`.
   Cara memastikan sebabnya (bukan menebak): jalankan di konsol halaman
   `fetch('/assets/maplibre-gl-worker-<hash>.mjs', {cache:'reload'}).then(r => r.headers.get('content-type'))`
   — kalau hasilnya `text/javascript`, yang salah adalah salinan di cache, bukan
   server atau kode. Penawarnya: kunci cache baru lewat kueri pada `setWorkerUrl`
   di `MapView.tsx` (`?v=mjs-mime`), atau sekali `Ctrl+Shift+R`; memuat ulang biasa
   tidak cukup karena `immutable` melarang validasi ulang. Untuk memeriksa halaman
   dari keadaan bersih tanpa mengutak-atik cache peramban milik pengguna, buka
   halaman di konteks peramban incognito (`Target.createBrowserContext`).

## Lapisan kerawanan (`P4`)

Saklar lapisan di kendali peta mengganti choropleth: **Titik panas** (jumlah
deteksi per tahun, seri `main`), **Kerawanan** (kelas kerawanan `rendah` /
`sedang` / `tinggi` per kabupaten/kota), atau **Kerawanan desa** (kelas kerawanan
`rendah` / `sedang` / `tinggi` / `tidak_ada_deteksi` per desa/kelurahan, satu
provinsi). Lapisan kerawanan membaca
`/tiles/risk/{z}/{x}/{y}.mvt?scheme=a|b|c`; definisi bobot, uji sensitivitas, dan
catatan wajibnya datang dari `/api/v1/risk/schemes` (`src/lib/risk.ts` untuk
warna dan legenda).

Empat hal yang disengaja:

| Hal | Alasan |
|---|---|
| tahun dan saklar provinsi **dinonaktifkan** saat lapisan kerawanan aktif | skornya ringkasan satu periode dan hanya dihitung untuk kabupaten/kota (`SRS-F-37`); kendali yang tampak berlaku padahal tidak adalah bacaan yang menyesatkan |
| abu-abu bernama **"skor belum ada"** | berbeda dari `has_fact = 0` di lapisan titik panas (di sana artinya nol deteksi); kalau disamakan, wilayah tanpa skor akan terbaca sebagai kerawanan rendah |
| bobot tiap skema ditampilkan apa adanya dari API, bukan ditulis ulang di antarmuka | skema A (50/50 tanpa IRBI) adalah tampilan awal, B dan C adalah skema uji; IRBI 2025 tetap sejajar sebagai konteks (`SRS-F-35`) |
| panel kerawanan memuat uji sensitivitas (korelasi peringkat + jumlah wilayah berpindah kelas) | `SRS-F-34` menuntut hasil ujinya ikut terbaca, bukan hanya pilihan skema |

## Lapisan kerawanan desa (`P4`, `SRS-F-38`/`F-39`)

Lapisan ketiga ini bukan lapisan kabupaten/kota yang diperkecil: kelasnya datang
dari `village_facts` metrik `risk_class_desa` dan **hanya ada per desa**, jadi
lapisannya dimuat **satu provinsi pada satu waktu** melalui
`/tiles/risk/villages/{z}/{x}/{y}.mvt?province=NN` (pemilih provinsi diisi
`/api/v1/provinces`). Beberapa hal yang ditentukan oleh sifat data itu:

| Hal | Alasan |
|---|---|
| kelas `tidak_ada_deteksi` diberi warna biru muda dan label **"bukan rendah"** | nol deteksi bisa berarti tidak terdeteksi satelit (`SRS-F-39`); mewarnainya seperti kelas rendah akan menyatakan sesuatu yang datanya tidak katakan |
| legenda dan panel memuat jumlah desa tiap kelas dan dua celah datanya (215 desa tanpa kelas, 812 desa tanpa kode kecamatan induk) | angkanya datang dari `/api/v1/provinces`, bukan ditulis di kode; celah yang tidak disebut akan terbaca sebagai nol |
| **zoom peta dipaksa 8 ke atas** selama lapisan ini aktif (`map.setMinZoom`, `fitBounds` dengan `minZoom`) | API menolak tile di bawah z=8 (`422`), dan MapLibre tidak meminta satu tile pun bila `minzoom` sumbernya di atas zoom peta (jebakan 15 di `AGENTS.md`) |
| klik pada desa membuka panel desa/kelurahan (`W4`) | kelas kerawanan, kepadatan, titik panas, dan kejadian satu desa dibaca dari `/api/v1/panel/desa/{kode}` — bacaan kursor tetap ada untuk menjelajah cepat |
| memilih provinsi langsung memperbesar peta ke kotak wilayahnya | pada zoom nasional lapisan ini tidak bisa digambar sama sekali, jadi memperbesar bukan pilihan pengguna melainkan syarat lapisannya |

Ringkasan nasionalnya: 83.530 desa/kelurahan — `tidak_ada_deteksi` 43.753 ·
`sedang` 24.293 · `rendah` 8.881 · `tinggi` 6.388 (angka 2026-11-17).

## Lapisan kejadian (`P3`, `SRS-F-28`…`31`)

Lapisan keempat memakai tile sendiri (`/tiles/events/{z}/{x}/{y}.mvt?year=`) karena yang
diwarnai adalah **kejadian tercatat BNPB**, bukan deteksi satelit (`SRS-F-30`) — warna, kelas, dan
artinya berbeda dari lapisan titik panas, sehingga tidak boleh berbagi skala.

| Hal | Alasan |
|---|---|
| warna abu-abu berarti **tidak ada kejadian tercatat** | berbeda dari lapisan titik panas, tempat abu-abu berarti wilayah belum punya baris fakta; BNPB hanya mencatat kejadian yang terjadi, jadi tidak ada baris nol yang perlu dibaca |
| tingkat wilayah dikunci ke kabupaten/kota | kejadian dipetakan pada tingkat itu (`SRS-F-28`); baris provinsi dan nasional hanya jadi pembanding |
| angka nasional dibaca dari `/api/v1/analysis/national_trend` | tile hanya memuat wilayah di dalam kotak peta, jadi menjumlahkan tile akan membuat angka nasional berubah setiap kali peta digeser (`SRS-F-31`) |
| tahun 2026 ditandai angka berjalan | data kejadian 2026 belum lengkap sampai akhir tahun (`SRS-AS-06`) |

## Lapisan titik kejadian (`P5`, `SRS-F-40`…`44`)

Lapisan kelima menggambar **satu titik per kejadian tercatat BNPB**, bukan poligon. Sumbernya GeoJSON
dari `/api/v1/events/points?year=`, dimuat hanya saat lapisannya aktif; tahun terbesar (2.153 titik,
rincian penuh) berukuran 841 KB dan 0,76 dtk, jadi tile titik belum perlu.

| Hal | Alasan |
|---|---|
| warna **dan** ukuran titik mengikuti `coord_level` | 2.599 kejadian hanya punya titik pusat kabupaten/kota (262 koordinat unik); tanpa pembedaan itu peta terbaca lebih presisi daripada datanya (`SRS-F-41`) |
| legenda dan kartu samping menyebut jumlah per tingkat | angka itu yang menjelaskan kenapa banyak titik bertumpuk di satu tempat |
| klik titik membuka rincian kejadian (`EventDetailPanel`) | `SRS-F-42`: tanggal, rantai wilayah, `point_id`, dampak; “—” berarti tidak dilaporkan, 0 berarti dilaporkan nol |
| tombol “Buka panel kabupaten/kota” di rincian | `SRS-F-44`: angka wilayah dibaca dari panel `W2`, tidak dihitung ulang di lapisan ini |
| `point_id` berbentuk `EVT-<event_id>` untuk 1.655 kejadian | kode identitas BNPB kosong untuk seluruh 2025–2026 (`SRS-D-06`) |

## Mode choropleth dan heatmap (`P1`, `SRS-F-14`)

Lapisan titik panas punya dua cara gambar, dipilih lewat saklar **Tampilan**:

| Mode | Sumber | Catatan |
|---|---|---|
| Choropleth | `/tiles/regions` (poligon + jumlah per wilayah) | kelas warna berangka (`SRS-F-18`), klik membuka panel `W2` |
| Heatmap | `/tiles/hotspot_points` (sel grid dari titik berkoordinat) | gradasi kepadatan tanpa kelas angka; API membalas `422` di bawah z=4 dan peta memanggil `setMinZoom(4)` |

Heatmap **tidak** mengirim titik mentah dari server: satu tile z=4 Kalimantan berisi 139.000 titik
(1,4 MB, 3 dtk), sedangkan sel grid 1/256 tile hanya 84 KB. Warna menyatakan kepadatan, bukan kelas —
legenda menyebut hal itu supaya tidak dibaca sebagai kelas kerawanan.

Penyaring **Kepercayaan** (`Semua`/`h`/`n`/`l`) berlaku di kedua mode dan hanya di tingkat
kabupaten/kota; di tingkat provinsi ia nonaktif dengan sebabnya, karena basis data tidak menyimpan
baris provinsi per kelas (API membalas `422`). Legenda juga menampilkan angka tampilan aktif dari
`/api/v1/point_coverage`: titik yang dipakai (per seri), yang masuk poligon, dan yang di luar poligon.

## Responsif

Tata letak diuji di 375 px, 768 px, dan 1440 px: tidak ada gulir horizontal di
ketiganya (`document.documentElement.scrollWidth <= innerWidth`).

| Lebar | Tata letak |
|---|---|
| < 640 px | peta di atas (58vh), kendali dan legenda mengapung dengan tinggi dibatasi 45% dan bisa digulir supaya peta tetap kelihatan; panel pencarian, ringkasan/kerawanan, dan panel wilayah tersusun di bawahnya |
| 640–1024 px | kendali sejajar mendatar di atas peta, panel di bawah peta selebar layar |
| ≥ 1024 px | peta di kiri, panel 26rem di kanan; legenda dan kendali mengapung di atas peta |

Sasaran sentuh minimal 36 px, cincin fokus terlihat (`focus-visible`), dan
`prefers-reduced-motion` dihormati — baik di CSS (`src/index.css`) maupun saat
peta memperbesar ke wilayah hasil pencarian (`MapView.tsx`).

## Yang sengaja belum ada

| Hal | Alasan |
|---|---|
| basemap PMTiles | **sudah ada** sejak penyisipan 09c: berkas 216 MB di `../planning-GeoSafe/data/basemap/`, disajikan **Cloudflare R2** (`geosafe-tiles.zisaltech.site`), gaya dari `@protomaps/basemaps` |
| heatmap titik panas (`SRS-F-14`) | endpoint tile titik belum ada (titik berkoordinat, bukan agregat wilayah) |
| lapisan kelas kerawanan desa (`SRS-F-38`, `SRS-F-39`) | **sudah ada** sejak iterasi 11e: lapisan ketiga di saklar peta, dimuat per provinsi pada zoom 8 ke atas |
| panel desa/kelurahan saat desa diklik (`W4`) | **sudah ada** sejak iterasi 12m: panel terbuka dari klik poligon desa maupun hasil pencarian |
| kendali penyaring `confidence` di toolbar (`SRS-F-15`) | API sudah menerima `?confidence=h\|n\|l` untuk tile kabupaten/kota; kendalinya menyusul |
| panel kecamatan (`W3`) | **sudah ada** sejak iterasi 14: hasil pencarian tingkat kecamatan membuka panelnya; angkanya pendukung, bukan unit analisis (`SRS-F-64`) |
| grafik A2 dan A3 | **sudah ada** sejak iterasi 13a: komposisi digambar sebagai batang SVG dan peringkat 514 kabupaten/kota sebagai tabel yang bisa diurutkan/dicari |
| Apache ECharts | rencana awal memakai ECharts; A1–A3 cukup SVG dan tabel, jadi digambar tanpa pustaka grafik tambahan |
| ESLint/Prettier | repo belum punya konfigurasi lint; `tsc --noEmit` + Vitest jadi penjaga mutu |

## Lapisan titik panas terkini (`P2` + `W1`)

Titik terkini digambar sebagai lapisan `circle` dari GeoJSON di atas choropleth,
diperbarui setiap 15 menit tanpa memuat ulang halaman (`SRS-F-24`), dengan pemilih
jendela 24/48/72 jam dan tombol segarkan manual. Titik dan ringkasan
(`/latest/summary`) diambil bersama oleh `useLatestHotspots` supaya keduanya
berasal dari generasi cache yang sama — invarian kontrak `API-P2.md` bagian 2
menuntut `fetched_at` dan `point_count` identik antara titik di peta dan angka di
panel.

Empat hal yang disengaja:

| Hal | Alasan |
|---|---|
| titik digambar tanpa penyaring kelas keyakinan | kelas dipakai untuk warna (`confidence_class`), bukan untuk menyembunyikan titik; penyaring kelas butuh keputusan penyaring mana yang dipakai pengguna |
| penyempitan `bbox` atas permintaan pengguna, bukan otomatis | API mengganti `points` dengan `null` bila muatan melewati 2 MB. Antarmuka tidak menebak kotak: pengguna menekan **Batasi ke area tampak** dan kotak peta yang sedang tampil dipotong ke batas wilayah Indonesia (`bboxParam`; peta pada zoom nasional lebih lebar daripada `94,5…141,5` / `-11,5…6,5`, dan tanpa potongan itu API menjawab `422`). Otomatis per geseran ditolak: satu tarikan FIRMS per geseran peta menghabiskan kuota |
| batas laju 429 | API menahan 60 permintaan/menit per IP; satu peramban memakai 2 permintaan per penyegaran sehingga batas itu tidak pernah tersentuh dari antarmuka |
| penyegaran memakai `setInterval` biasa | peramban menahan timer di tab latar, jadi jarak tarikan nyata bisa lebih dari 15 menit; `SRS-F-24` menyebut batas *paling sering* 15 menit, bukan jaminan tepat 15 menit |
