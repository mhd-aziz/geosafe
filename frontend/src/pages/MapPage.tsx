import { useCallback, useState } from 'react';

import { fetchRiskSchemes } from '../api/geosafe';
import { Legend } from '../components/map/Legend';
import { LatestControl } from '../components/map/LatestControl';
import { MapToolbar } from '../components/map/MapToolbar';
import { MapView } from '../components/map/MapView';
import { LatestPanel } from '../components/panel/LatestPanel';
import { RegionPanel } from '../components/panel/RegionPanel';
import { RiskPanel } from '../components/panel/RiskPanel';
import { SearchBox } from '../components/search/SearchBox';
import { useLatestHotspots } from '../hooks/useLatestHotspots';
import { useRemoteData } from '../hooks/useRemoteData';
import { DEFAULT_YEAR } from '../lib/constants';
import { DEFAULT_RISK_SCHEME } from '../lib/risk';
import type {
  LatestWindow,
  MapLayer,
  MapLevel,
  RiskSchemeCode,
  SearchLevel,
  SearchResult,
  SelectedRegion,
} from '../types/geosafe';

type Bounds = [number, number, number, number];

/** Kartu sidebar: satu lapisan visual untuk setiap bagian panel. */
const CARD = 'rounded-xl border border-slate-200 bg-white p-3 shadow-sm';

/** Halaman peta: pilih lapisan → pilih tahun/skema → choropleth → klik wilayah → panel.
 *
 * Alur MVP (`P1` → `C1` → `W2`) ditambah lapisan kerawanan (`P4`) dan titik terkini
 * (`P2`). Lapisan kerawanan hanya ada di tingkat kabupaten/kota (`SRS-F-37`) dan
 * tidak bertahun, jadi saat lapisan itu aktif pilihan tingkat provinsi dan tahun
 * dinonaktifkan beserta sebabnya — bukan dibiarkan tampak berlaku.
 *
 * Lapisan titik terkini hidup berdampingan dengan choropleth arsip: dua seri itu
 * tidak pernah dijumlahkan (`SRS-F-26`) — titik terkini digambar sebagai titik,
 * choropleth memakai seri `main` per tahun atau skor kerawanan.
 */
export function MapPage() {
  const [layer, setLayer] = useState<MapLayer>('hotspot');
  const [riskScheme, setRiskScheme] = useState<RiskSchemeCode>(DEFAULT_RISK_SCHEME);
  const [year, setYear] = useState<number>(DEFAULT_YEAR);
  const [level, setLevel] = useState<MapLevel>('regency');
  const [selected, setSelected] = useState<SelectedRegion | null>(null);
  const [focusBounds, setFocusBounds] = useState<Bounds | null>(null);
  const [latestWindow, setLatestWindow] = useState<LatestWindow>(72);
  const latest = useLatestHotspots(latestWindow);
  // Skema bobot diambil sekali di sini dan dibagikan ke kendali peta maupun panel,
  // supaya bobot dan uji sensitivitas yang tampil berasal dari satu balasan API.
  const riskSchemes = useRemoteData(fetchRiskSchemes, []);
  // Data hanya dipakai bila berasal dari jendela yang sedang dipilih: saat pengguna
  // berganti jendela, angka jendela lama tidak boleh tetap tampil di sebelah tombol
  // jendela baru, dan bila tarikan jendela baru gagal hal itu disebut apa adanya.
  const latestMatchesWindow =
    latest.data?.window_hours === latestWindow && latest.summary?.window_hours === latestWindow;

  const handleLayerChange = useCallback((next: MapLayer) => {
    setLayer(next);
    // Kerawanan tidak punya tingkat provinsi, jadi pilihannya ikut dikembalikan ke
    // kabupaten/kota supaya tidak ada keadaan "lapisan kerawanan + tingkat provinsi".
    if (next === 'risk') {
      setLevel('regency');
    }
  }, []);

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

  const activeSchemeName =
    riskSchemes.data?.schemes.find((scheme) => scheme.scheme_code === riskScheme)?.scheme_name ??
    null;

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <section
        aria-label="Peta sebaran titik panas"
        className="relative h-[58vh] min-h-[340px] shrink-0 sm:h-[56vh] sm:min-h-[380px] lg:h-auto lg:min-h-0 lg:flex-1"
      >
        <MapView
          layer={layer}
          riskScheme={riskScheme}
          year={year}
          level={level}
          focusBounds={focusBounds}
          latestPoints={latest.data?.points ?? null}
          onSelectRegion={handleSelectFromMap}
        />
        {/* Kendali mengapung: di layar kecil daftar ini bisa digulir dan tingginya
         * dibatasi supaya peta tetap kelihatan di bawahnya — tanpa batas itu peta
         * tertutup penuh oleh kendali dan legenda. */}
        <div className="pointer-events-none absolute inset-x-2 top-2 flex max-h-[45%] flex-col items-stretch gap-2 overflow-y-auto sm:inset-x-3 sm:top-3 sm:max-h-none sm:flex-row sm:items-start sm:justify-between sm:overflow-visible">
          <div className="pointer-events-auto">
            <MapToolbar
              layer={layer}
              onLayerChange={handleLayerChange}
              riskScheme={riskScheme}
              onRiskSchemeChange={setRiskScheme}
              riskSchemes={riskSchemes.data?.schemes ?? null}
              year={year}
              level={level}
              onYearChange={setYear}
              onLevelChange={setLevel}
            />
          </div>
          <div className="pointer-events-auto">
            <Legend layer={layer} riskSchemeName={activeSchemeName} />
          </div>
          <div className="pointer-events-auto order-last sm:order-none">
            <LatestControl
              windowHours={latestWindow}
              onWindowChange={setLatestWindow}
              loading={!latestMatchesWindow}
              fetchedAt={latestMatchesWindow ? (latest.data?.fetched_at ?? null) : null}
              satellites={latestMatchesWindow ? (latest.data?.satellites ?? []) : []}
              usingSnapshot={latestMatchesWindow ? (latest.data?.using_snapshot ?? false) : false}
              pointCount={latestMatchesWindow ? (latest.data?.point_count ?? null) : null}
              truncated={latestMatchesWindow ? (latest.data?.truncated ?? false) : false}
              error={latest.error}
              onRefresh={latest.refresh}
            />
          </div>
        </div>
      </section>

      <aside className="flex w-full min-h-0 shrink-0 flex-col gap-3 overflow-y-auto border-t border-slate-200 bg-slate-50/80 p-3 sm:p-4 lg:w-[26rem] lg:border-t-0 lg:border-l">
        <div className={CARD}>
          <SearchBox onSelect={handleSelectFromSearch} />
        </div>

        {layer === 'risk' ? (
          <div className={CARD}>
            <RiskPanel state={riskSchemes} scheme={riskScheme} />
          </div>
        ) : (
          <div className={CARD}>
            <LatestPanel
              summary={latestMatchesWindow ? latest.summary : null}
              status={latest.status}
              error={latest.error}
            />
          </div>
        )}

        {selected ? (
          selected.level === 'regency' ? (
            <div className={CARD}>
              <RegionPanel regionCode={selected.code} onClose={closePanel} />
            </div>
          ) : (
            <div className={`${CARD} space-y-2 text-xs text-slate-700`}>
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
                className="min-h-9 cursor-pointer rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-100 sm:min-h-8"
              >
                Tutup
              </button>
            </div>
          )
        ) : (
          <p className="px-1 text-xs text-slate-600">
            Klik satu kabupaten/kota pada peta, atau pilih hasil pencarian, untuk membuka panel
            wilayah.
          </p>
        )}
      </aside>
    </div>
  );
}
