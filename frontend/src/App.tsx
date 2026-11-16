import { useCallback, useState } from 'react';

import { Legend } from './components/map/Legend';
import { MapToolbar } from './components/map/MapToolbar';
import { MapView } from './components/map/MapView';
import { RegionPanel } from './components/panel/RegionPanel';
import { SearchBox } from './components/search/SearchBox';
import { useSourceSummary } from './hooks/useSourceSummary';
import { DEFAULT_YEAR, MAP_SERIES } from './lib/constants';
import type { MapLevel, SearchLevel, SearchResult, SelectedRegion } from './types/geosafe';

type Bounds = [number, number, number, number];

/** Satu halaman MVP: pilih tahun → peta choropleth → klik wilayah → panel.
 *
 * Saklar tingkat wilayah memakai tile provinsi (`SRS-F-13`); panel hanya ada
 * untuk kabupaten/kota (`W2`), sehingga tingkat lain cukup memperbesar peta dan
 * menyebutkan bahwa panelnya belum dikerjakan.
 */
export function App() {
  const [year, setYear] = useState<number>(DEFAULT_YEAR);
  const [level, setLevel] = useState<MapLevel>('regency');
  const [selected, setSelected] = useState<SelectedRegion | null>(null);
  const [focusBounds, setFocusBounds] = useState<Bounds | null>(null);
  const { firms, error: sourceError } = useSourceSummary();

  const handleSelectFromMap = useCallback(
    (region: { code: string; name: string; level: SearchLevel }) => {
      setSelected({ code: region.code, name: region.name, level: region.level, bbox: null });
    },
    [],
  );

  const handleSelectFromSearch = useCallback((result: SearchResult) => {
    setSelected({
      code: result.code ?? '',
      name: result.name,
      level: result.level,
      bbox: result.bbox,
    });
    // `bbox` kosong = wilayah tanpa geometri; peta tidak diperbesar supaya
    // pengguna tidak dibawa ke suatu tempat secara asal.
    setFocusBounds(result.bbox);
  }, []);

  const closePanel = useCallback(() => setSelected(null), []);

  return (
    <div className="flex h-full flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-4 py-3">
        <h1 className="text-lg font-semibold">GeoSafe — Peta Titik Panas Karhutla</h1>
        <p className="mt-1 text-xs text-slate-600">
          Sebaran titik panas sebagai indikator kerawanan kebakaran hutan dan lahan, 514
          kabupaten/kota, 2020–2026. <strong>Titik panas bukan kebakaran:</strong> titik panas adalah
          anomali termal yang terdeteksi satelit, bukan kejadian terkonfirmasi.
        </p>
      </header>

      <main className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <section
          aria-label="Peta sebaran titik panas"
          className="relative min-h-[55vh] flex-1 lg:min-h-0"
        >
          <MapView
            year={year}
            level={level}
            focusBounds={focusBounds}
            onSelectRegion={handleSelectFromMap}
          />
          <div className="pointer-events-none absolute inset-x-3 top-3 flex flex-col items-start gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="pointer-events-auto">
              <MapToolbar
                year={year}
                level={level}
                onYearChange={setYear}
                onLevelChange={setLevel}
              />
            </div>
            <div className="pointer-events-auto">
              <Legend />
            </div>
          </div>
        </section>

        <aside className="w-full shrink-0 space-y-4 overflow-y-auto border-t border-slate-200 bg-white p-4 lg:w-[24rem] lg:border-t-0 lg:border-l">
          <SearchBox onSelect={handleSelectFromSearch} />

          {selected ? (
            selected.level === 'regency' ? (
              <RegionPanel regionCode={selected.code} onClose={closePanel} />
            ) : (
              <div className="space-y-2 rounded-md border border-slate-300 bg-slate-50 p-3 text-xs text-slate-700">
                <p className="text-sm font-medium text-slate-900">
                  {selected.name} ({selected.level})
                </p>
                <p>
                  Peta sudah diarahkan ke wilayah ini. Panel angka baru tersedia untuk kabupaten/kota
                  (`W2`); panel kecamatan (`W3`) dan desa/kelurahan (`W4`) belum dikerjakan.
                </p>
                <button
                  type="button"
                  onClick={closePanel}
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-xs hover:bg-slate-100"
                >
                  Tutup
                </button>
              </div>
            )
          ) : (
            <p className="text-xs text-slate-600">
              Klik satu kabupaten/kota pada peta, atau pilih hasil pencarian, untuk membuka panel
              wilayah.
            </p>
          )}
        </aside>
      </main>

      <footer className="border-t border-slate-200 bg-white px-4 py-2 text-[11px] text-slate-600">
        {firms ? (
          <p>
            Sumber titik panas: NASA FIRMS — {firms.source_name}. Data sampai{' '}
            {firms.data_until ?? 'tidak disebutkan'}, diakses {firms.accessed_on}. Peta memakai seri{' '}
            <code>{MAP_SERIES}</code> (arsip); seri <code>nrt</code> 2026 tidak sebanding dan tidak
            digambar, angkanya ada di panel wilayah.
          </p>
        ) : (
          <p>Keterangan sumber belum tersedia{sourceError ? `: ${sourceError}` : ''}.</p>
        )}
      </footer>
    </div>
  );
}