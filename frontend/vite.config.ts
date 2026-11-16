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
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
  },
});
