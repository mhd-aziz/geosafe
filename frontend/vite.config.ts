import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Vite 7.3.8 dikunci: bundler Vite 8 (Rolldown) mati `SIGILL` di CPU tanpa
// AVX/AVX2. `@vitejs/plugin-react` juga harus 5.x — 6.x menuntut Vite 8.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Selama pengembangan, SPA memanggil API FastAPI lewat proxy ini supaya
    // tidak ada CORS dan alamat API tidak ditulis di kode.
    proxy: {
      '/api': 'http://127.0.0.1:8000',
      '/tiles': 'http://127.0.0.1:8000',
      // Basemap tidak lagi diproxy: sejak 2026-11-19 mesin ini tidak menyajikan
      // `/pmtiles/`. Berkasnya ditarik langsung dari Cloudflare R2 lewat
      // `VITE_BASEMAP_URL` (bawaannya sudah menunjuk R2, lihat `src/lib/map-style.ts`).
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
  },
});
