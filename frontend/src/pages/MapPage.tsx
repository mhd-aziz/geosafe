import { useCallback, useState } from 'react';

import { Legend } from '../components/map/Legend';
import { LatestControl } from '../components/map/LatestControl';
import { MapToolbar } from '../components/map/MapToolbar';
import { MapView } from '../components/map/MapView';
import { LatestPanel } from '../components/panel/LatestPanel';
import { RegionPanel } from '../components/panel/RegionPanel';
import { SearchBox } from '../components/search/SearchBox';
import { useLatestHotspots } from '../hooks/useLatestHotspots';
import { DEFAULT_YEAR } from '../lib/constants';
import type {
  LatestWindow,
  MapLevel,
  SearchLevel,
  SearchResult,
  SelectedRegion,
} from '../types/geosafe';

type Bounds = [number, number, number, number];

/** Halaman peta: pilih tahun → choropleth → klik wilayah → panel.
 *
 * Saklar tingkat wilayah memakai tile provinsi (`SRS-F-13`); panel hanya ada
 * untuk kabupaten/kota (`W2`), sehingga tingkat lain cukup memperbesar peta dan
 * menyebutkan bahwa panelnya belum dikerjakan.
 *
 * Lapisan titik terkini (`P2`) hidup berdampingan dengan choropleth arsip: dua
 * seri itu tidak pernah dijumlahkan (`SRS-F-26`) — titik terkini digambar sebagai
 * titik, choropleth memakai seri `main` per tahun.
 */
export function MapPage() {
  const [year, setYear] = useState<number>(DEFAULT_YEAR);
  const [level, setLevel] = useState<MapLevel>('regency');
  const [selected, setSelected] = useState<SelectedRegion | null>(null);
  const [focusBounds, setFocusBounds] = useState<Bounds | null>(null);
  const [latestWindow, setLatestWindow] = useState<LatestWindow>(72);
  const latest = useLatestHotspots(latestWindow);

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
    <div className="flex h-full min-h-0 flex-col lg:flex-row">
      <section
        aria-label="Peta sebaran titik panas"
        className="relative min-h-[55vh] flex-1 lg:min-h-0"
      >
        <MapView
          year={year}
          level={level}
          focusBounds={focusBounds}
          latestPoints={latest.data?.points ?? null}
          onSelectRegion={handleSelectFromMap}
        />
        <div className="pointer-events-none absolute inset-x-3 top-3 flex flex-col items-start gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="pointer-events-auto flex flex-col gap-3">
            <MapToolbar year={year} level={level} onYearChange={setYear} onLevelChange={setLevel} />
            <LatestControl
              windowHours={latestWindow}
              onWindowChange={setLatestWindow}
              fetchedAt={latest.data?.fetched_at ?? null}
              satellites={latest.data?.satellites ?? []}
              usingSnapshot={latest.data?.using_snapshot ?? false}
              pointCount={latest.data?.point_count ?? null}
              truncated={latest.data?.truncated ?? false}
              onRefresh={latest.refresh}
            />
          </div>
          <div className="pointer-events-auto">
            <Legend />
          </div>
        </div>
      </section>

      <aside className="w-full shrink-0 space-y-4 overflow-y-auto border-t border-slate-200 bg-white p-4 lg:w-[24rem] lg:border-t-0 lg:border-l">
        <SearchBox onSelect={handleSelectFromSearch} />

        <LatestPanel summary={latest.summary} status={latest.status} error={latest.error} />

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
    </div>
  );
}
