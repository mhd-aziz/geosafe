import { useCallback, useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';

import {
  fetchNationalTrend,
  fetchPointCoverage,
  fetchRiskSchemes,
  fetchVillageProvinces,
} from '../api/geosafe';
import { Legend } from '../components/map/Legend';
import { LatestControl } from '../components/map/LatestControl';
import { MapToolbar } from '../components/map/MapToolbar';
import { MapView } from '../components/map/MapView';
import { DistrictDetailPanel } from '../components/panel/DistrictDetailPanel';
import { EventDetailPanel } from '../components/panel/EventDetailPanel';
import { EventPanel } from '../components/panel/EventPanel';
import { EventPointsPanel } from '../components/panel/EventPointsPanel';
import { LatestPanel } from '../components/panel/LatestPanel';
import { RegionPanel } from '../components/panel/RegionPanel';
import { RiskPanel } from '../components/panel/RiskPanel';
import { VillageDetailPanel } from '../components/panel/VillageDetailPanel';
import { VillagePanel } from '../components/panel/VillagePanel';
import { SearchBox } from '../components/search/SearchBox';
import { useEventPoints } from '../hooks/useEventPoints';
import { useIsNarrow } from '../hooks/useIsNarrow';
import { useLatestHotspots } from '../hooks/useLatestHotspots';
import { useRemoteData } from '../hooks/useRemoteData';
import { DEFAULT_YEAR } from '../lib/constants';
import { bboxParam } from '../lib/format';
import {
  DEFAULT_MAP_PAGE,
  mapPageFromSlug,
  mapPagePath,
  type MapPageConfig,
} from '../lib/map-pages';
import { DEFAULT_RISK_SCHEME } from '../lib/risk';
import type {
  ConfidenceCode,
  EventPoint,
  EventView,
  HotspotView,
  LatestWindow,
  MapLayer,
  MapLevel,
  RiskSchemeCode,
  RiskView,
  SearchLevel,
  SearchResult,
  SelectedRegion,
} from '../types/geosafe';

type Bounds = [number, number, number, number];

/** Kartu sidebar: satu lapisan visual untuk setiap bagian panel. */
const CARD = 'rounded-xl border border-slate-200 bg-white p-3 shadow-sm';

/** Tiga halaman peta, dipilih dari alamat (`/peta/:lapisan`).
 *
 * Satu komponen dipakai untuk ketiganya supaya `MapView` tidak diinisialisasi
 * ulang saat pengguna berpindah peta: basemap PMTiles dan gaya peta tidak dimuat
 * ulang, dan kamera tidak melompat. Tampilan di dalam halaman (choropleth/heatmap,
 * choropleth/titik kejadian, skor/kelas desa) tetap keadaan lokal.
 */
export function MapPage() {
  const { lapisan } = useParams<{ lapisan: string }>();
  const page = mapPageFromSlug(lapisan);
  if (!page) {
    return <Navigate to={mapPagePath(DEFAULT_MAP_PAGE)} replace />;
  }
  return <MapPageView page={page} />;
}

function MapPageView({ page }: { page: MapPageConfig }) {
  const narrow = useIsNarrow();
  // Pilihan skema dibiarkan kosong sampai pengguna memilih: selama belum dipilih,
  // yang dipakai adalah `default_scheme` dari API (`SRS-F-33`) — bukan nilai yang
  // dikunci di klien, supaya keputusan mana yang jadi tampilan awal tetap di API.
  const [schemeChoice, setSchemeChoice] = useState<RiskSchemeCode | null>(null);
  const [year, setYear] = useState<number>(DEFAULT_YEAR);
  // Kelas kepercayaan deteksi (`SRS-F-15`); hanya berlaku di tingkat kabupaten/kota.
  const [confidence, setConfidence] = useState<ConfidenceCode | null>(null);
  // Choropleth atau heatmap untuk lapisan titik panas (`SRS-F-14`).
  const [hotspotView, setHotspotView] = useState<HotspotView>('choropleth');
  // Tampilan di halaman kejadian (`P3`/`P5`) dan kerawanan (`P4`).
  const [eventView, setEventView] = useState<EventView>('choropleth');
  const [riskView, setRiskView] = useState<RiskView>('regency');
  // Lapisan titik terkini (`P2`) tetap overlay, tapi bisa dimatikan pengguna.
  const [showLatest, setShowLatest] = useState(true);
  const [level, setLevel] = useState<MapLevel>('regency');
  // Lapisan desa dimuat per provinsi (`SRS-F-38`): tanpa provinsi terpilih tidak
  // ada tile yang sah untuk diminta.
  const [provinceCode, setProvinceCode] = useState<string | null>(null);
  const [selected, setSelected] = useState<SelectedRegion | null>(null);
  // Titik kejadian yang diklik (`P5`, `SRS-F-42`): rinciannya dipisah dari panel
  // wilayah karena satu titik bukan satu wilayah.
  const [selectedPoint, setSelectedPoint] = useState<EventPoint | null>(null);
  const [focusBounds, setFocusBounds] = useState<Bounds | null>(null);
  const [latestWindow, setLatestWindow] = useState<LatestWindow>(72);
  // Kotak peta yang terakhir tampil dan kotak yang sedang dipakai sebagai `bbox`
  // permintaan. Balasan API tidak memuat `bbox` yang dipakai, jadi kesegaran data
  // terhadap kotak tidak bisa diperiksa seperti jendela jam — yang dijaga: kotak
  // hanya berubah atas permintaan pengguna, tidak setiap kali peta digeser.
  const [viewport, setViewport] = useState<Bounds | null>(null);
  const [latestBbox, setLatestBbox] = useState<string | null>(null);
  const latest = useLatestHotspots(latestWindow, latestBbox);
  // Skema bobot diambil sekali di sini dan dibagikan ke kendali peta maupun panel,
  // supaya bobot dan uji sensitivitas yang tampil berasal dari satu balasan API.
  const riskSchemes = useRemoteData(fetchRiskSchemes, []);
  // Seri nasional untuk pembanding lapisan kejadian (`SRS-F-31`): angkanya dibaca
  // dari endpoint tren, bukan dijumlahkan dari tile yang sedang tampil.
  const trend = useRemoteData(fetchNationalTrend, []);
  // Daftar provinsi + sebaran kelas desa: dipakai kendali lapisan desa dan panelnya.
  const villageProvinces = useRemoteData(fetchVillageProvinces, []);
  // Titik kejadian (`P5`) hanya diminta saat tampilannya aktif, dan selalu untuk
  // tahun yang sedang dipilih.
  const eventPoints = useEventPoints(year, eventView === 'points' && page.base === 'events');
  // Angka tampilan aktif (`SRS-F-16`): titik yang dipakai peta untuk tahun dan
  // kelas kepercayaan yang sedang dipilih, beserta yang jatuh di luar poligon.
  const coverage = useRemoteData(
    () => fetchPointCoverage(year, confidence),
    [year, confidence, page.slug],
  );
  // Data hanya dipakai bila berasal dari jendela yang sedang dipilih: saat pengguna
  // berganti jendela, angka jendela lama tidak boleh tetap tampil di sebelah tombol
  // jendela baru, dan bila tarikan jendela baru gagal hal itu disebut apa adanya.
  const latestMatchesWindow =
    latest.data?.window_hours === latestWindow && latest.summary?.window_hours === latestWindow;
  const riskScheme = schemeChoice ?? riskSchemes.data?.default_scheme ?? DEFAULT_RISK_SCHEME;

  // Lapisan tematik yang dikirim ke peta: halaman + tampilan di dalamnya.
  const layer: MapLayer =
    page.base === 'hotspot'
      ? 'hotspot'
      : page.base === 'events'
        ? eventView === 'points'
          ? 'event_points'
          : 'events'
        : riskView === 'village'
          ? 'risk_village'
          : 'risk';

  // Pindah halaman berarti pindah seri: pilihan wilayah dan titik tidak dibawa,
  // dan kendali yang hanya berlaku di halaman titik panas dikembalikan ke awal.
  useEffect(() => {
    setSelected(null);
    setSelectedPoint(null);
    if (page.base !== 'hotspot') {
      setLevel('regency');
      setConfidence(null);
    }
  }, [page.base, page.slug]);

  const latestVisible = page.base === 'hotspot' && showLatest;
  const latestShown = latestVisible && (latest.data?.points?.length ?? 0) > 0;

  const handleProvinceChange = useCallback(
    (code: string) => {
      setProvinceCode(code === '' ? null : code);
      // Peta diperbesar ke provinsi itu sebelum tile diminta: lapisan desa baru
      // dilayani API pada zoom 8 ke atas, dan pada zoom nasional tidak ada yang
      // bisa digambar.
      const bounds =
        villageProvinces.data?.provinces.find((province) => province.province_code === code)?.bbox ??
        null;
      setFocusBounds(bounds);
    },
    [villageProvinces.data],
  );

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

  // Di tingkat provinsi API tidak punya baris per kelas, jadi pilihan kelas
  // dikembalikan ke "semua" saat pengguna berpindah ke sana.
  const handleLevelChange = useCallback((next: MapLevel) => {
    setLevel(next);
    if (next === 'province') {
      setConfidence(null);
    }
  }, []);

  // Kotak peta hanya dikirim saat pengguna memintanya: mengirimnya otomatis setiap
  // geseran berarti menarik ulang titik setiap kali peta digeser. Kotaknya dipotong
  // ke batas wilayah Indonesia (`bboxParam`), dan `null` berarti peta sedang
  // memperlihatkan area di luar Indonesia sehingga tidak ada kotak yang sah.
  const viewportParam = viewport === null ? null : bboxParam(viewport);
  const handleUseViewport = useCallback(() => {
    if (viewportParam !== null) {
      setLatestBbox(viewportParam);
    }
  }, [viewportParam]);
  const handleClearBounds = useCallback(() => setLatestBbox(null), []);

  const activeSchemeName =
    riskSchemes.data?.schemes.find((scheme) => scheme.scheme_code === riskScheme)?.scheme_name ??
    null;

  const headlinePanel =
    page.base === 'hotspot' ? (
      <div className={CARD}>
        <LatestPanel
          summary={latestMatchesWindow ? latest.summary : null}
          status={latest.status}
          error={latest.error}
        />
      </div>
    ) : page.base === 'events' ? (
      eventView === 'points' ? (
        <div className={CARD}>
          <EventPointsPanel state={eventPoints} year={year} />
        </div>
      ) : (
        <div className={CARD}>
          <EventPanel trend={trend} year={year} />
        </div>
      )
    ) : riskView === 'village' ? (
      <div className={CARD}>
        <VillagePanel state={villageProvinces} provinceCode={provinceCode} />
      </div>
    ) : (
      <div className={CARD}>
        <RiskPanel state={riskSchemes} scheme={riskScheme} />
      </div>
    );

  // Legenda tinggal di satu tempat saja: di peta (layar sempit, bisa dilipat)
  // atau di kolom kanan (desktop), supaya teksnya tidak muncul dua kali.
  const legend = (
    <Legend
      layer={layer}
      hotspotView={hotspotView}
      confidence={confidence}
      coverage={page.base === 'hotspot' ? (coverage.data?.totals ?? null) : null}
      riskSchemeName={activeSchemeName}
      villageClassCounts={villageProvinces.data?.class_counts ?? {}}
      villageWithoutProvince={villageProvinces.data?.villages_without_province ?? null}
      latestShown={latestShown}
    />
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <section
        aria-label={page.title}
        className="relative h-[58vh] min-h-[340px] shrink-0 sm:h-[56vh] sm:min-h-[380px] lg:h-auto lg:min-h-0 lg:flex-1"
      >
        <MapView
          layer={layer}
          riskScheme={riskScheme}
          year={year}
          level={level}
          provinceCode={provinceCode}
          focusBounds={focusBounds}
          confidence={layer === 'hotspot' ? confidence : null}
          hotspotView={hotspotView}
          latestPoints={latestVisible ? (latest.data?.points ?? null) : null}
          eventPoints={layer === 'event_points' ? (eventPoints.data?.points ?? null) : null}
          onSelectRegion={handleSelectFromMap}
          onSelectEventPoint={setSelectedPoint}
          onViewportChange={setViewport}
        />

        {/* Kendali peta satu baris. Legenda dan kendali jendela terkini tinggal di
          * kolom kanan supaya peta tidak tertutup kartu apa pun. */}
        <div className="pointer-events-none absolute inset-x-2 top-2 z-10 max-h-[45%] overflow-y-auto sm:inset-x-3 sm:top-3 sm:max-h-none sm:overflow-visible">
          <div className="pointer-events-auto min-w-0 max-w-full">
            <MapToolbar
              page={page.slug}
              hotspotView={hotspotView}
              onHotspotViewChange={setHotspotView}
              eventView={eventView}
              onEventViewChange={setEventView}
              riskView={riskView}
              onRiskViewChange={setRiskView}
              showLatest={showLatest}
              onShowLatestChange={setShowLatest}
              riskScheme={riskScheme}
              onRiskSchemeChange={setSchemeChoice}
              riskSchemes={riskSchemes}
              provinceCode={provinceCode}
              onProvinceChange={handleProvinceChange}
              provinces={villageProvinces}
              year={year}
              level={level}
              onYearChange={setYear}
              onLevelChange={handleLevelChange}
              confidence={confidence}
              onConfidenceChange={setConfidence}
            />
          </div>
        </div>

        {narrow ? (
          <div className="pointer-events-none absolute inset-x-2 bottom-2 z-10">
            <div className="pointer-events-auto max-h-[38%] overflow-y-auto">{legend}</div>
          </div>
        ) : null}
      </section>

      <aside className="flex w-full min-h-0 shrink-0 flex-col gap-3 overflow-y-auto border-t border-slate-200 bg-slate-50/80 p-3 sm:p-4 lg:w-[26rem] lg:border-t-0 lg:border-l">
        <div className={CARD}>
          <SearchBox onSelect={handleSelectFromSearch} />
        </div>

        {headlinePanel}

        {latestVisible ? (
          <LatestControl
            windowHours={latestWindow}
            onWindowChange={setLatestWindow}
            loading={!latestMatchesWindow}
            fetchedAt={latestMatchesWindow ? (latest.data?.fetched_at ?? null) : null}
            satellites={latestMatchesWindow ? (latest.data?.satellites ?? []) : []}
            usingSnapshot={latestMatchesWindow ? (latest.data?.using_snapshot ?? false) : false}
            pointCount={latestMatchesWindow ? (latest.data?.point_count ?? null) : null}
            truncated={latestMatchesWindow ? (latest.data?.truncated ?? false) : false}
            bboxActive={latestBbox !== null}
            canUseViewport={viewportParam !== null}
            error={latest.error}
            onRefresh={latest.refresh}
            onUseViewport={handleUseViewport}
            onClearBounds={handleClearBounds}
          />
        ) : null}

        {narrow ? null : legend}

        {selectedPoint ? (
          // `SRS-F-42`: rincian satu kejadian. Tombol di dalamnya membuka panel
          // kabupaten/kota wilayahnya untuk angka wilayah (`SRS-F-44`).
          <div className={CARD}>
            <EventDetailPanel
              point={selectedPoint}
              onClose={() => setSelectedPoint(null)}
              onOpenRegion={(regionCode, regionName) => {
                setSelectedPoint(null);
                handleSelectFromMap({ code: regionCode, name: regionName, level: 'regency' });
              }}
            />
          </div>
        ) : selected ? (
          selected.level === 'regency' ? (
            <div className={CARD}>
              <RegionPanel regionCode={selected.code} onClose={closePanel} />
            </div>
          ) : selected.level === 'village' ? (
            // `W4`: klik poligon desa atau hasil pencarian desa. Kode kosong berarti
            // wilayah itu ditemukan tanpa kode BPS — panel tidak bisa diminta.
            selected.code ? (
              <div className={CARD}>
                <VillageDetailPanel villageCode={selected.code} onClose={closePanel} />
              </div>
            ) : (
              <div className={`${CARD} space-y-2 text-xs text-slate-700`}>
                <p className="text-sm font-medium text-slate-900">{selected.name}</p>
                <p>Desa ini tidak punya kode BPS di sumbernya, jadi panel angkanya tidak bisa dimuat.</p>
                <button
                  type="button"
                  onClick={closePanel}
                  className="min-h-9 cursor-pointer rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-100 sm:min-h-8"
                >
                  Tutup
                </button>
              </div>
            )
          ) : selected.level === 'district' ? (
            // `W3`: hasil pencarian tingkat kecamatan. Kode kosong berarti wilayah itu
            // ditemukan tanpa kode BPS — panelnya tidak bisa diminta.
            selected.code ? (
              <div className={CARD}>
                <DistrictDetailPanel districtCode={selected.code} onClose={closePanel} />
              </div>
            ) : (
              <div className={`${CARD} space-y-2 text-xs text-slate-700`}>
                <p className="text-sm font-medium text-slate-900">{selected.name}</p>
                <p>
                  Kecamatan ini tidak punya kode BPS di sumbernya, jadi panel angkanya tidak bisa
                  dimuat.
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
            <div className={`${CARD} space-y-2 text-xs text-slate-700`}>
              <p className="text-sm font-medium text-slate-900">
                {selected.name} ({selected.level})
              </p>
              <p>
                Peta sudah diarahkan ke wilayah ini. Panel angka tersedia untuk kabupaten/kota
                (`W2`), kecamatan (`W3`), dan desa/kelurahan (`W4`); tingkat provinsi belum punya
                panel karena bukan unit analisis.
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
