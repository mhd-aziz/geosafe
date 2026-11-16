import { useEffect, useRef, useState } from 'react';
import { Map as MapLibreMap, addProtocol, setWorkerUrl } from 'maplibre-gl';
import { Protocol } from 'pmtiles';
import 'maplibre-gl/dist/maplibre-gl.css';
// Alamat worker harus dikunci: MapLibre v6 menurunkan URL worker dari
// `import.meta.url`, dan di dev server berkas hasil `optimizeDeps` membuat URL
// itu menunjuk ke `node_modules/.vite/deps/maplibre-gl-worker.mjs` yang tidak
// ada — peta lalu kosong tanpa galat yang terlihat ("Worker failed to load").
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';

import { tileSourceLayer, tileUrlTemplate } from '../../api/geosafe';
import { fillColorExpression } from '../../lib/choropleth';
import { basemapStyle } from '../../lib/map-style';
import type { MapLevel, SearchLevel } from '../../types/geosafe';

setWorkerUrl(maplibreWorkerUrl);

// Protokol `pmtiles://` harus terdaftar sebelum gaya dipasang; basemap dibaca per
// rentang byte dari berkas yang dilayani nginx (`/pmtiles/`). Di maplibre-gl
// 6.18.0 `addProtocol` hanya menimpa entri `REGISTERED_PROTOCOLS` (diperiksa di
// `node_modules/maplibre-gl/dist/maplibre-gl-dev.mjs`), jadi tidak ada galat yang
// perlu ditangkap dan pemanggilan ulang tidak berbahaya.
addProtocol('pmtiles', new Protocol().tile);

const SOURCE_ID = 'hotspot';
const FILL_LAYER_ID = 'hotspot-fill';
const LINE_LAYER_ID = 'hotspot-line';

const CODE_PROPERTY: Record<MapLevel, string> = {
  regency: 'region_code',
  province: 'province_code',
};

const NAME_PROPERTY: Record<MapLevel, string> = {
  regency: 'region_name',
  province: 'province_name',
};

export interface MapViewProps {
  year: number;
  level: MapLevel;
  /** Kotak wilayah hasil pencarian: peta diperbesar ke wilayah itu (`SRS-F-70`). */
  focusBounds: [number, number, number, number] | null;
  onSelectRegion: (region: { code: string; name: string; level: SearchLevel }) => void;
}

export function MapView({ year, level, focusBounds, onSelectRegion }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Galat memuat sumber/gaya tidak menggagalkan kejadian `load` dan tidak tampil
  // di antarmuka; sudah dua kali kejadian peta tampak kosong tanpa pesan apa pun,
  // jadi pesannya ditangkap dan ditampilkan.
  const [loadError, setLoadError] = useState<string | null>(null);
  // Handler peta tidak dibuat ulang setiap render, jadi nilai terbaru dibaca
  // lewat ref: kalau tidak, klik selalu memakai tingkat wilayah yang lama.
  const latest = useRef({ level, onSelectRegion });
  latest.current = { level, onSelectRegion };

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
    map.on('load', () => setReady(true));

    map.on('error', (event) => {
      const cause = (event as { error?: unknown }).error;
      setLoadError(cause instanceof Error ? cause.message : 'galat peta tidak dikenal');
    });

    map.on('click', (event) => {
      if (!map.getLayer(FILL_LAYER_ID)) {
        return;
      }
      const [feature] = map.queryRenderedFeatures(event.point, { layers: [FILL_LAYER_ID] });
      const properties = feature?.properties;
      if (!properties) {
        return;
      }

      const currentLevel = latest.current.level;
      latest.current.onSelectRegion({
        code: String(properties[CODE_PROPERTY[currentLevel]]),
        name: String(properties[NAME_PROPERTY[currentLevel]]),
        level: currentLevel === 'province' ? 'province' : 'regency',
      });
    });

    map.on('mousemove', (event) => {
      const cursor =
        map.getLayer(FILL_LAYER_ID) &&
        map.queryRenderedFeatures(event.point, { layers: [FILL_LAYER_ID] }).length > 0
          ? 'pointer'
          : '';
      map.getCanvas().style.cursor = cursor;
    });

    return () => {
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, []);

  // Tingkat wilayah mengubah nama layer di dalam tile, jadi sumber dan layer
  // dipasang ulang setiap tingkat atau tahun berganti (bukan hanya `setTiles`).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) {
      return;
    }

    if (map.getLayer(FILL_LAYER_ID)) {
      map.removeLayer(FILL_LAYER_ID);
    }
    if (map.getLayer(LINE_LAYER_ID)) {
      map.removeLayer(LINE_LAYER_ID);
    }
    if (map.getSource(SOURCE_ID)) {
      map.removeSource(SOURCE_ID);
    }

    map.addSource(SOURCE_ID, {
      type: 'vector',
      tiles: [tileUrlTemplate(level, year)],
      minzoom: 0,
      maxzoom: 14,
    });
    map.addLayer({
      id: FILL_LAYER_ID,
      type: 'fill',
      source: SOURCE_ID,
      'source-layer': tileSourceLayer(level),
      paint: {
        // Nilai `fill-color` adalah ekspresi gaya; tipe resminya tidak diekspor
        // oleh maplibre-gl v6, jadi nilainya di-cast di sini (bentuknya diuji di
        // `src/lib/choropleth.test.ts`).
        'fill-color': fillColorExpression() as never,
        'fill-outline-color': '#ffffff',
        // Tembus pandang 0,72: pada 0,82 jalan dan sungai dari basemap tak lagi
        // terlihat di bawah kelas warna (diperiksa di peramban, tidak cukup dari
        // kode), sementara kelas warnanya masih terpisah jelas.
        'fill-opacity': 0.72,
      },
    });
    map.addLayer({
      id: LINE_LAYER_ID,
      type: 'line',
      source: SOURCE_ID,
      'source-layer': tileSourceLayer(level),
      paint: { 'line-color': '#94a3b8', 'line-width': 0.4 },
    });
  }, [ready, level, year]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusBounds) {
      return;
    }
    const [minX, minY, maxX, maxY] = focusBounds;
    map.fitBounds(
      [
        [minX, minY],
        [maxX, maxY],
      ],
      { padding: 48, maxZoom: 11, duration: 800 },
    );
  }, [focusBounds]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" data-testid="map-container" />
      {error ? (
        <p className="absolute inset-0 flex items-center justify-center bg-slate-100 p-6 text-center text-sm text-slate-700">
          Peta vektor butuh WebGL pada peramban ini, sehingga peta tidak dapat digambar. Panel dan
          pencarian tetap bisa dipakai. Penyebab: {error}
        </p>
      ) : null}
      {loadError ? (
        <p
          className="absolute inset-x-2 bottom-2 rounded border border-amber-300 bg-amber-50/95 px-3 py-2 text-xs text-amber-900"
          data-testid="map-load-error"
        >
          Sebagian latar peta gagal dimuat ({loadError}). Geometri wilayah tetap tergambar dan panel
          tetap bisa dipakai.
        </p>
      ) : null}
    </div>
  );
}
