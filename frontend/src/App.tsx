import { NavLink, Navigate, Route, Routes } from 'react-router-dom';

import { useSourceSummary } from './hooks/useSourceSummary';
import { MAP_SERIES } from './lib/constants';
import { DEFAULT_MAP_PAGE, MAP_PAGES, mapPagePath } from './lib/map-pages';
import { AnalysisPage } from './pages/AnalysisPage';
import { MapPage } from './pages/MapPage';
import { SourcesPage } from './pages/SourcesPage';
import { TrendPage } from './pages/TrendPage';

const NAV = [
  // Tiga peta dipisah karena serinya berbeda dan tidak boleh dicampur; navigasi
  // utama tetap satu daftar supaya setiap halaman punya alamat sendiri.
  ...MAP_PAGES.map((page) => ({ to: mapPagePath(page.slug), label: page.label })),
  { to: '/tren', label: 'Tren nasional' },
  { to: '/analisis', label: 'Analisis wilayah' },
  { to: '/sumber', label: 'Sumber & Batas Data' },
];

/** Kerangka halaman: merek, navigasi, isi halaman, dan keterangan sumber.
 *
 * Router memisahkan halaman peta (`P1`/`C1`/`W2`/`P4`), tren (`A1`), dan sumber
 * data (`T1`) supaya tiap halaman bisa tumbuh tanpa membuat satu komponen
 * raksasa. `BrowserRouter` dipasang di `main.tsx`, sehingga halaman bisa diuji
 * dengan `MemoryRouter` tanpa menyentuh riwayat peramban.
 */
export function App() {
  const { firms, error: sourceError } = useSourceSummary();

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50 text-slate-900">
      <header className="z-20 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-2 px-3 py-2.5 sm:px-5">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-teal-700 text-white shadow-sm"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 3 3 5.5v15L9 18l6 3 6-2.5v-15L15 6Z" />
                <path d="M9 3v15M15 6v15" />
              </svg>
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold tracking-tight sm:text-lg">
                GeoSafe — Peta Titik Panas Karhutla
              </h1>
              <p className="text-[11px] text-slate-600 sm:text-xs">
                Sebaran titik panas sebagai indikator kerawanan kebakaran hutan dan lahan · 514
                kabupaten/kota · 2020–2026
              </p>
            </div>
          </div>

          <nav
            aria-label="Navigasi halaman"
            className="-mx-1 flex gap-1 overflow-x-auto pb-0.5 text-sm"
          >
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `min-h-9 shrink-0 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 sm:min-h-8 sm:text-sm ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <p className="border-b border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] text-amber-900 sm:px-5">
        <strong>Titik panas bukan kebakaran.</strong> Titik panas adalah anomali termal yang
        terdeteksi satelit — indikasi awal, bukan kejadian terkonfirmasi. Angka kejadian karhutla
        adalah seri terpisah dan tidak pernah dijumlahkan dengan titik panas.
      </p>

      <main className="flex min-h-0 flex-1 flex-col">
        <Routes>
          <Route path="/" element={<Navigate to={mapPagePath(DEFAULT_MAP_PAGE)} replace />} />
          <Route path="/peta" element={<Navigate to={mapPagePath(DEFAULT_MAP_PAGE)} replace />} />
          {/* Satu komponen untuk tiga halaman: parameter rute yang memilih lapisan,
            * sehingga MapLibre tidak diinisialisasi ulang saat berpindah peta. */}
          <Route path="/peta/:lapisan" element={<MapPage />} />
          <Route path="/tren" element={<TrendPage />} />
          <Route path="/analisis" element={<AnalysisPage />} />
          <Route path="/sumber" element={<SourcesPage />} />
          <Route
            path="*"
            element={
              <p className="p-4 text-sm text-slate-700">
                Halaman tidak ditemukan. Kembali ke{' '}
                <NavLink to="/" className="text-teal-700 underline">
                  peta
                </NavLink>
                .
              </p>
            }
          />
        </Routes>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-[1800px] px-3 py-2 text-[11px] leading-relaxed text-slate-600 sm:px-5">
          {firms ? (
            <p>
              Sumber titik panas: NASA FIRMS — {firms.source_name}. Data sampai{' '}
              {firms.data_until ?? 'tidak disebutkan'}, diakses {firms.accessed_on}. Choropleth
              memakai seri <code>{MAP_SERIES}</code> (arsip); titik oranye memakai seri{' '}
              <code>nrt</code> (terkini). Kedua seri tidak sebanding dan tidak pernah dijumlahkan;
              angka 2026 belum setahun penuh.
            </p>
          ) : (
            <p>Keterangan sumber belum tersedia{sourceError ? `: ${sourceError}` : ''}.</p>
          )}
        </div>
      </footer>
    </div>
  );
}
