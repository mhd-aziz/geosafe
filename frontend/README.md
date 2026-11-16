# GeoSafe — frontend

Antarmuka web GeoSafe: peta choropleth sebaran titik panas kabupaten/kota dan
provinsi, pencarian wilayah empat tingkat, dan panel wilayah. React 19 +
TypeScript + Vite 7.3.8 + Tailwind CSS 4 + MapLibre GL JS.

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
kunci rahasia di sisi peramban.

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
    ├── pages/                  MapPage · TrendPage · SourcesPage (satu berkas per halaman)
    ├── api/                    client.ts (pembungkus fetch) · geosafe.ts (per endpoint)
    ├── components/
    │   ├── map/                MapView · MapToolbar · Legend
    │   ├── search/             SearchBox
    │   ├── panel/              RegionPanel
    │   ├── analysis/           TrendChart · BurnedAreaChart (SVG, tanpa pustaka grafik)
    │   └── common/             DataNotes
    ├── hooks/                  useDebouncedValue · useRegionSearch · useRegionPanel ·
    │                           useSourceSummary · useRemoteData (baca-saja halaman)
    ├── lib/                    constants · format · choropleth · transparency-content
    ├── types/geosafe.ts        bentuk balasan API (nama medan = nama kolom DB)
    └── test/setup.ts           pembersihan DOM antar uji
```

Halaman: `/` peta (P1 + C1 + W2) · `/tren` grafik nasional (A1) · `/sumber` Sumber &
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

## Yang sengaja belum ada

| Hal | Alasan |
|---|---|
| basemap PMTiles | berkas 216 MB ditunda ke iterasi deploy; peta memakai latar polos |
| heatmap titik panas (`SRS-F-14`) | endpoint tile titik belum ada (titik berkoordinat, bukan agregat wilayah) |
| kendali penyaring `confidence` di toolbar (`SRS-F-15`) | API sudah menerima `?confidence=h|n|l` untuk tile kabupaten/kota; kendalinya menyusul |
| panel kecamatan dan desa (`W3`, `W4`) | angka pendukung, bukan unit analisis; panelnya belum dikerjakan |
| grafik A2 dan A3 | turunan dari A1, belum dikerjakan |
| Apache ECharts | rencana awal memakai ECharts; grafik A1 cukup dua garis + tujuh titik, jadi digambar sebagai SVG tanpa pustaka tambahan. ECharts masuk saat A2/A3 butuh batang dan peringkat |
| ESLint/Prettier | repo belum punya konfigurasi lint; `tsc --noEmit` + Vitest jadi penjaga mutu |
