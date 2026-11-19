import { useEffect, useRef, useState } from 'react';
import { Map as MapLibreMap, addProtocol, setWorkerUrl } from 'maplibre-gl';
import { Protocol } from 'pmtiles';
import 'maplibre-gl/dist/maplibre-gl.css';
// Alamat worker harus dikunci: MapLibre v6 menurunkan URL worker dari
// `import.meta.url`, dan di dev server berkas hasil `optimizeDeps` membuat URL
// itu menunjuk ke `node_modules/.vite/deps/maplibre-gl-worker.mjs` yang tidak
// ada — peta lalu kosong tanpa galat yang terlihat ("Worker failed to load").
// Kueri `?v=mjs-mime` bukan hiasan: nama berkas worker diturunkan dari isi
// berkasnya, jadi namanya tidak berubah antar build, sementara peramban yang
// pernah membuka halaman **sebelum** nginx memetakan `.mjs` ke `text/javascript`
// masih menyimpan salinan `application/octet-stream` untuk URL itu — dan header
// `immutable` membuat salinan itu tidak pernah divalidasi ulang, sehingga peta
// tetap kosong walau server sudah benar. Kueri membuat kunci cache baru; jangan
// dihapus tanpa memeriksa `curl -sI` pada berkas `.mjs` hasil build.
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';

import { fillColorExpression } from '../../lib/choropleth';
import { latestCircleColorExpression, pointsToGeoJson } from '../../lib/latest-layer';
import { basemapStyle } from '../../lib/map-style';
import { riskFillColorExpression, villageRiskFillColorExpression } from '../../lib/risk';
import type { LatestPoint, MapLayer, MapLevel, RiskSchemeCode, SearchLevel } from '../../types/geosafe';
import { THEMATIC_IDS, VILLAGE_MIN_ZOOM, readoutText, thematicSpec } from './thematic-layer';

setWorkerUrl(`${maplibreWorkerUrl}?v=mjs-mime`);

// Protokol `pmtiles://` harus terdaftar sebelum gaya dipasang; basemap dibaca per
// rentang byte dari berkas yang dilayani nginx (`/pmtiles/`). Di maplibre-gl
// 6.18.0 `addProtocol` hanya menimpa entri `REGISTERED_PROTOCOLS` (diperiksa di
// `node_modules/maplibre-gl/dist/maplibre-gl-dev.mjs`), jadi tidak ada galat yang
// perlu ditangkap dan pemanggilan ulang tidak berbahaya.
addProtocol('pmtiles', new Protocol().tile);

const LATEST_SOURCE_ID = 'latest-hotspot';
const LATEST_LAYER_ID = 'latest-hotspot-points';

/** Layer poligon yang sedang aktif; dipakai klik, kursor, dan bacaan angka. */
const ACTIVE_FILL_LAYER: Record<MapLayer, string> = {
  hotspot: 'hotspot-fill',
  risk: 'risk-fill',
  risk_village: 'village-risk-fill',
};

/** Warna kelas per lapisan; peta hanya mewarnai, angkanya dibaca di bacaan kursor. */
const FILL_COLOR_EXPRESSION: Record<MapLayer, () => readonly unknown[]> = {
  hotspot: fillColorExpression,
  risk: riskFillColorExpression,
  risk_village: villageRiskFillColorExpression,
};

const CODE_PROPERTY: Record<MapLevel, string> = {
  regency: 'region_code',
  province: 'province_code',
};

const NAME_PROPERTY: Record<MapLevel, string> = {
  regency: 'region_name',
  province: 'province_name',
};

export interface MapViewProps {
  layer: MapLayer;
  riskScheme: RiskSchemeCode;
  year: number;
  level: MapLevel;
  /** Provinsi terpilih untuk lapisan desa (`P4`); `null` = lapisan belum bisa dipasang. */
  provinceCode: string | null;
  /** Kotak wilayah hasil pencarian: peta diperbesar ke wilayah itu (`SRS-F-70`). */
  focusBounds: [number, number, number, number] | null;
  /** Titik panas terkini (`P2`); `null` = belum ada/`truncated`, tidak digambar. */
  latestPoints: LatestPoint[] | null;
  onSelectRegion: (region: { code: string; name: string; level: SearchLevel }) => void;
  /** Kotak peta yang sedang tampil: dikirim hanya saat pengguna memintanya jadi `bbox`. */
  onViewportChange?: (bounds: [number, number, number, number]) => void;
}

/** Peta MapLibre dengan satu lapisan tematik aktif.
 *
 * Tiga lapisan tematik datang dari endpoint berbeda dan tidak pernah tampil
 * bersamaan: jumlah titik panas (`/tiles/regions`, `/tiles/provinces`), kelas
 * kerawanan kabupaten/kota (`/tiles/risk`), dan kelas kerawanan desa
 * (`/tiles/risk/villages`, satu provinsi). Saat berpindah lapisan, layer lama
 * dibuang lebih dulu supaya tidak ada dua poligon bertumpuk dengan arti warna
 * berbeda di satu kanvas.
 */
export function MapView({
  layer,
  riskScheme,
  year,
  level,
  provinceCode,
  focusBounds,
  latestPoints,
  onSelectRegion,
  onViewportChange,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Galat memuat sumber/gaya tidak menggagalkan kejadian `load` dan tidak tampil
  // di antarmuka; sudah dua kali kejadian peta tampak kosong tanpa pesan apa pun,
  // jadi pesannya ditangkap dan ditampilkan.
  const [loadError, setLoadError] = useState<string | null>(null);
  /** Bacaan angka di balik warna; mengikuti kursor dan hilang saat keluar peta. */
  const [readout, setReadout] = useState<{ x: number; y: number; text: string } | null>(null);
  // Handler peta tidak dibuat ulang setiap render, jadi nilai terbaru dibaca
  // lewat ref: kalau tidak, klik selalu memakai tingkat wilayah/lapisan yang lama.
  const latest = useRef({ layer, level, year, onSelectRegion, onViewportChange });
  latest.current = { layer, level, year, onSelectRegion, onViewportChange };

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    let map: MapLibreMap;
    try {
      map = new MapLibreMap({
        container: containerRef.current,
        style: basemapStyle(),
        center: [118, -2.5],
        zoom: 3.2,
        attributionControl: false,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'peta gagal dibuat');
      return;
    }

    mapRef.current = map;
    // Kotak peta dilaporkan setiap gerakan selesai **dan** sekali saat gaya siap:
    // tanpa laporan awal itu, kendali "Batasi ke area tampak" tidak punya kotak
    // untuk dikirim selama pengguna belum menggeser peta.
    const emitViewport = () => {
      const handler = latest.current.onViewportChange;
      if (!handler) {
        return;
      }
      const box = map.getBounds();
      handler([box.getWest(), box.getSouth(), box.getEast(), box.getNorth()]);
    };
    map.on('load', () => {
      setReady(true);
      emitViewport();
    });
    map.on('moveend', emitViewport);

    map.on('error', (event) => {
      const cause = (event as { error?: unknown }).error;
      setLoadError(cause instanceof Error ? cause.message : 'galat peta tidak dikenal');
    });

    map.on('click', (event) => {
      const currentLayer = latest.current.layer;
      // Lapisan desa: klik membuka panel desa (`W4`). Nama desa dan kelasnya juga
      // terbaca di bacaan kursor, tetapi panelnya butuh kode desa dari properti
      // tile — kabupaten/kota induknya tidak dipakai karena itu wilayah berbeda.
      if (currentLayer === 'risk_village') {
        const [villageFeature] = map.queryRenderedFeatures(event.point, {
          layers: [ACTIVE_FILL_LAYER.risk_village],
        });
        const villageProperties = villageFeature?.properties;
        if (!villageProperties?.village_code) {
          return;
        }
        latest.current.onSelectRegion({
          code: String(villageProperties.village_code),
          name: String(villageProperties.village_name),
          level: 'village',
        });
        return;
      }
      const fillLayer = ACTIVE_FILL_LAYER[currentLayer];
      if (!map.getLayer(fillLayer)) {
        return;
      }
      const [feature] = map.queryRenderedFeatures(event.point, { layers: [fillLayer] });
      const properties = feature?.properties;
      if (!properties) {
        return;
      }

      // Lapisan kerawanan hanya ada di tingkat kabupaten/kota (`SRS-F-37`), jadi
      // klik di sana selalu membuka panel kabupaten/kota.
      const currentLevel: MapLevel = currentLayer === 'risk' ? 'regency' : latest.current.level;
      latest.current.onSelectRegion({
        code: String(properties[CODE_PROPERTY[currentLevel]]),
        name: String(properties[NAME_PROPERTY[currentLevel]]),
        level: currentLevel === 'province' ? 'province' : 'regency',
      });
    });

    map.on('mousemove', (event) => {
      const current = latest.current;
      const fillLayer = ACTIVE_FILL_LAYER[current.layer];
      if (!map.getLayer(fillLayer)) {
        return;
      }
      const [feature] = map.queryRenderedFeatures(event.point, { layers: [fillLayer] });
      map.getCanvas().style.cursor = feature ? 'pointer' : '';

      if (!feature?.properties) {
        setReadout(null);
        return;
      }
      setReadout({
        x: event.point.x,
        y: event.point.y,
        text: readoutText(current.layer, current.level, current.year, feature.properties),
      });
    });

    map.on('mouseout', () => setReadout(null));

    return () => {
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, []);

  // Lapisan tematik dipasang ulang setiap lapisan, tingkat, tahun, skema bobot,
  // atau provinsi (lapisan desa) berganti: nama layer di dalam tile berbeda dan
  // URL-nya punya parameter sendiri, jadi `setTiles` saja tidak cukup.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) {
      return;
    }

    const spec = thematicSpec(layer, level, year, riskScheme, provinceCode);
    for (const ids of THEMATIC_IDS) {
      if (map.getLayer(ids.fillLayerId)) {
        map.removeLayer(ids.fillLayerId);
      }
      if (map.getLayer(ids.lineLayerId)) {
        map.removeLayer(ids.lineLayerId);
      }
      if (map.getSource(ids.sourceId)) {
        map.removeSource(ids.sourceId);
      }
    }

    // Lapisan desa tanpa provinsi terpilih: tidak ada tile yang sah untuk
    // diminta, jadi pembersihan di atas sudah cukup.
    if (!spec) {
      return;
    }

    // Choropleth dipasang **di bawah** lapisan terkini bila lapisan itu sudah ada,
    // supaya titik terkini tidak pernah tertutup poligon setelah lapisan/tingkat
    // berganti — kalau tidak, urutannya bergantung efek mana yang selesai dulu.
    const beforeId = map.getLayer(LATEST_LAYER_ID) ? LATEST_LAYER_ID : undefined;

    map.addSource(spec.sourceId, {
      type: 'vector',
      tiles: [spec.url],
      minzoom: spec.minzoom,
      maxzoom: 14,
    });
    map.addLayer(
      {
        id: spec.fillLayerId,
        type: 'fill',
        source: spec.sourceId,
        'source-layer': spec.sourceLayer,
        paint: {
          // Nilai `fill-color` adalah ekspresi gaya; tipe resminya tidak diekspor
          // oleh maplibre-gl v6, jadi nilainya di-cast di sini (bentuknya diuji di
          // `src/lib/choropleth.test.ts` dan `src/lib/risk.test.ts`).
          'fill-color': FILL_COLOR_EXPRESSION[layer]() as never,
          'fill-outline-color': '#ffffff',
          // Tembus pandang 0,72 pada lapisan titik panas: pada 0,82 jalan dan
          // sungai dari basemap tak lagi terlihat di bawah kelas warna (diperiksa
          // di peramban, tidak cukup dari kode). Kelas kerawanan hanya tiga sampai
          // empat, jadi opasitasnya boleh lebih tinggi.
          'fill-opacity': layer === 'hotspot' ? 0.72 : 0.78,
        },
      },
      beforeId,
    );
    map.addLayer(
      {
        id: spec.lineLayerId,
        type: 'line',
        source: spec.sourceId,
        'source-layer': spec.sourceLayer,
        paint: { 'line-color': '#94a3b8', 'line-width': 0.4 },
      },
      beforeId,
    );
  }, [ready, layer, level, year, riskScheme, provinceCode]);

  // Lapisan titik panas terkini (`P2`): titik, bukan poligon — wilayahnya dipakai
  // panel, sedangkan peta menunjukkan sebaran deteksinya.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) {
      return;
    }

    if (map.getLayer(LATEST_LAYER_ID)) {
      map.removeLayer(LATEST_LAYER_ID);
    }
    if (map.getSource(LATEST_SOURCE_ID)) {
      map.removeSource(LATEST_SOURCE_ID);
    }
    if (!latestPoints || latestPoints.length === 0) {
      return;
    }

    map.addSource(LATEST_SOURCE_ID, {
      type: 'geojson',
      data: pointsToGeoJson(latestPoints),
    });
    map.addLayer({
      id: LATEST_LAYER_ID,
      type: 'circle',
      source: LATEST_SOURCE_ID,
      paint: {
        'circle-color': latestCircleColorExpression() as never,
        // Jari-jari menyesuaikan zoom: pada tingkat nasional titik harus tetap
        // terpisah, dan setelah diperbesar ke satu provinsi titiknya perlu terlihat.
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 3, 1.6, 9, 4] as never,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 0.3,
      },
    });
  }, [ready, latestPoints]);

  // Zoom minimum peta harus ikut lapisan aktif. MapLibre mengembalikan **nol
  // tile** untuk sumber yang `minzoom`-nya lebih besar daripada zoom peta yang
  // dibulatkan ke bawah (`coveringTiles` berhenti sebelum meminta apa pun), jadi
  // sumber lapisan desa (minzoom 8) tidak akan pernah terisi selama pengguna
  // berada di zoom nasional — ditemukan 2026-11-17 lewat jalur peramban, bukan
  // dari uji: tile desa sama sekali tidak pernah diminta. Karena itu zoom peta
  // dijadikan 8 ke atas selama lapisan desa aktif; sekaligus menutup kemungkinan
  // permintaan di bawah batas API (422).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) {
      return;
    }
    map.setMinZoom(layer === 'risk_village' ? VILLAGE_MIN_ZOOM : 0);
  }, [ready, layer]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusBounds) {
      return;
    }
    const [minX, minY, maxX, maxY] = focusBounds;
    // Hormati permintaan sistem pengguna: tanpa animasi kalau gerak dikurangi.
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
    map.fitBounds(
      [
        [minX, minY],
        [maxX, maxY],
      ],
      {
        padding: 48,
        maxZoom: 11,
        minZoom: layer === 'risk_village' ? VILLAGE_MIN_ZOOM : undefined,
        duration: reduceMotion ? 0 : 800,
      },
    );
  }, [focusBounds, layer]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" data-testid="map-container" />
      {error ? (
        <p className="absolute inset-0 flex items-center justify-center bg-slate-100 p-6 text-center text-sm text-slate-700">
          Peta vektor butuh WebGL pada peramban ini, sehingga peta tidak dapat digambar. Panel dan
          pencarian tetap bisa dipakai. Penyebab: {error}
        </p>
      ) : null}
      {readout ? (
        // Bacaan angka di balik warna; digeser sedikit dari kursor supaya tidak
        // menutupi poligon yang sedang dibaca.
        <p
          data-testid="map-readout"
          style={{ left: Math.max(8, readout.x - 120), top: readout.y + 14 }}
          className="pointer-events-none absolute z-10 max-w-[16rem] rounded-lg bg-slate-900/90 px-2 py-1 text-[11px] leading-tight text-white shadow-lg"
        >
          {readout.text}
        </p>
      ) : null}
      {loadError ? (
        <p
          className="absolute inset-x-2 bottom-2 rounded-lg border border-amber-300 bg-amber-50/95 px-3 py-2 text-xs text-amber-900"
          data-testid="map-load-error"
        >
          Sebagian latar peta gagal dimuat ({loadError}). Geometri wilayah tetap tergambar dan panel
          tetap bisa dipakai.
        </p>
      ) : null}
    </div>
  );
}
