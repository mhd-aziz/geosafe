import { NavLink, Route, Routes } from 'react-router-dom';

import { useSourceSummary } from './hooks/useSourceSummary';
import { MAP_SERIES } from './lib/constants';
import { MapPage } from './pages/MapPage';
import { SourcesPage } from './pages/SourcesPage';
import { TrendPage } from './pages/TrendPage';

const NAV = [
  { to: '/', label: 'Peta' },
  { to: '/tren', label: 'Tren nasional' },
  { to: '/sumber', label: 'Sumber & Batas Data' },
];

/** Kerangka halaman: judul, navigasi, isi halaman, dan keterangan sumber.
 *
 * Router memisahkan halaman peta (`P1`/`C1`/`W2`), tren (`A1`), dan sumber data
 * (`T1`) supaya tiap halaman bisa tumbuh tanpa membuat satu komponen raksasa.
 * `BrowserRouter` dipasang di `main.tsx`, sehingga halaman bisa diuji dengan
 * `MemoryRouter` tanpa menyentuh riwayat peramban.
 */
export function App() {
  const { firms, error: sourceError } = useSourceSummary();

  return (
    <div className="flex h-full flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-4 py-3">
        <h1 className="text-lg font-semibold">GeoSafe — Peta Titik Panas Karhutla</h1>
        <p className="mt-1 text-xs text-slate-600">
          Sebaran titik panas sebagai indikator kerawanan kebakaran hutan dan lahan, 514
          kabupaten/kota, 2020–2026. <strong>Titik panas bukan kebakaran:</strong> titik panas adalah
          anomali termal yang terdeteksi satelit, bukan kejadian terkonfirmasi.
        </p>
        <nav aria-label="Navigasi halaman" className="mt-2 flex flex-wrap gap-3 text-sm">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                isActive
                  ? 'border-b-2 border-slate-900 pb-0.5 font-semibold text-slate-900'
                  : 'border-b-2 border-transparent pb-0.5 text-slate-600 hover:text-slate-900'
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="flex min-h-0 flex-1 flex-col">
        <Routes>
          <Route path="/" element={<MapPage />} />
          <Route path="/tren" element={<TrendPage />} />
          <Route path="/sumber" element={<SourcesPage />} />
          <Route
            path="*"
            element={
              <p className="p-4 text-sm text-slate-700">
                Halaman tidak ditemukan. Kembali ke{' '}
                <NavLink to="/" className="text-blue-700 underline">
                  peta
                </NavLink>
                .
              </p>
            }
          />
        </Routes>
      </main>

      <footer className="border-t border-slate-200 bg-white px-4 py-2 text-[11px] text-slate-600">
        {firms ? (
          <p>
            Sumber titik panas: NASA FIRMS — {firms.source_name}. Data sampai{' '}
            {firms.data_until ?? 'tidak disebutkan'}, diakses {firms.accessed_on}. Peta memakai seri{' '}
            <code>{MAP_SERIES}</code> (arsip); seri <code>nrt</code> 2026 tidak sebanding dan tidak
            digambar, angkanya ada di panel wilayah dan halaman tren.
          </p>
        ) : (
          <p>Keterangan sumber belum tersedia{sourceError ? `: ${sourceError}` : ''}.</p>
        )}
      </footer>
    </div>
  );
}