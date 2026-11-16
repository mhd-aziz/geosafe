/** Nilai tetap yang dipakai lebih dari satu komponen. */

/** Rentang data proyek: 1 Januari 2020 – sekarang (`SRS-C-03`). */
export const YEARS = [2020, 2021, 2022, 2023, 2024, 2025, 2026] as const;

/** Tahun aktif saat halaman dibuka: tahun terbaru pada rentang data. */
export const DEFAULT_YEAR = 2026;

/** Panjang kata kunci minimum untuk pencarian wilayah (sama dengan API). */
export const MIN_KEYWORD_LENGTH = 2;

/** Lama tunggu sebelum pencarian dikirim ke API (milidetik). */
export const SEARCH_DEBOUNCE_MS = 250;

/** Seri titik panas yang digambar di peta. Seri `nrt` dipisah (lihat catatan). */
export const MAP_SERIES = 'main';
