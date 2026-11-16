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
    ├── main.tsx                pemasangan React ke #root
    ├── App.tsx                 tata letak halaman + keadaan tahun/tingkat/pilihan
    ├── index.css               masuknya Tailwind (`@import 'tailwindcss'`)
    ├── api/                    client.ts (pembungkus fetch) · geosafe.ts (per endpoint)
    ├── components/
    │   ├── map/                MapView · MapToolbar · Legend
    │   ├── search/             SearchBox
    │   ├── panel/              RegionPanel
    │   └── common/             DataNotes
    ├── hooks/                  useDebouncedValue · useRegionSearch · useRegionPanel · useSourceSummary
    ├── lib/                    constants.ts · format.ts · choropleth.ts
    ├── types/geosafe.ts        bentuk balasan API (nama medan = nama kolom DB)
    └── test/setup.ts           pembersihan DOM antar uji
```

Uji diletakkan bersebelahan dengan berkas yang diuji (`*.test.ts(x)`), supaya
perubahan komponen dan ujinya terlihat dalam satu tampilan diff.

## Yang sengaja belum ada

| Hal | Alasan |
|---|---|
| basemap PMTiles | berkas 216 MB ditunda ke iterasi deploy; peta memakai latar polos |
| heatmap titik panas (`SRS-F-14`) | butuh endpoint titik berkoordinat per tahun; belum dikerjakan |
| penyaring tingkat kepercayaan (`SRS-F-15`) | endpoint tile belum menerima parameter `confidence` |
| grafik tren A1 | endpoint `/api/v1/analysis/national_trend` sudah ada, gambarnya menyusul |
| halaman Sumber & Batas Data (T1) | iterasi berikutnya |
| router halaman | satu halaman MVP; router ditambahkan saat ada halaman kedua |
| ESLint/Prettier | repo belum punya konfigurasi lint; `tsc --noEmit` + Vitest jadi penjaga mutu |
