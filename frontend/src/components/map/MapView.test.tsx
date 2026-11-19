import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/** MapLibre tiruan: mencatat sumber dan layer yang dipasang, tanpa WebGL.
 *
 * Yang diuji di sini justru bagian yang tidak terlihat di uji jsdom biasa: URL
 * sumber, zoom minimum, dan nama layer — inilah yang menentukan tile mana yang
 * diminta peramban ke API. `vi.hoisted` dipakai karena `vi.mock` diangkat ke
 * puncak berkas sebelum kelasnya sempat didefinisikan.
 */
const { mapState, FakeMap } = vi.hoisted(() => {
  const mapState = {
    sources: new Map<string, unknown>(),
    layers: new Map<string, { id: string }>(),
    listeners: new Map<string, () => void>(),
    fitBounds: [] as unknown[],
    minZoom: [] as number[],
    removed: [] as string[],
    /** Hasil `queryRenderedFeatures` tiruan; dikosongkan sebelum setiap uji. */
    queryRows: [] as { properties: Record<string, unknown> }[],
  };

  class FakeMap {
    getCanvas() {
      return { style: {}, addEventListener: () => {} } as unknown as HTMLCanvasElement;
    }
    on(event: string, handler: () => void) {
      mapState.listeners.set(event, handler);
    }
    getLayer(id: string) {
      return mapState.layers.get(id) ? {} : undefined;
    }
    getSource(id: string) {
      return mapState.sources.get(id);
    }
    addSource(id: string, spec: unknown) {
      mapState.sources.set(id, spec);
    }
    removeSource(id: string) {
      mapState.sources.delete(id);
      mapState.removed.push(`source:${id}`);
    }
    addLayer(layer: { id: string }) {
      mapState.layers.set(layer.id, layer);
    }
    removeLayer(id: string) {
      mapState.layers.delete(id);
      mapState.removed.push(`layer:${id}`);
    }
    queryRenderedFeatures() {
      return mapState.queryRows;
    }
    getBounds() {
      // Kotak peta tiruan: seluruh Indonesia.
      return {
        getWest: () => 95,
        getSouth: () => -11,
        getEast: () => 141,
        getNorth: () => 6,
      };
    }
    fitBounds(bounds: unknown, options?: unknown) {
      mapState.fitBounds.push(options);
      void bounds;
    }
    setMinZoom(zoom: number) {
      mapState.minZoom.push(zoom);
    }
    remove() {}
  }

  return { mapState, FakeMap };
});

vi.mock('maplibre-gl', () => ({
  Map: FakeMap,
  setWorkerUrl: vi.fn(),
  addProtocol: vi.fn(),
}));

vi.mock('pmtiles', () => ({
  Protocol: class {
    tile = vi.fn();
  },
}));

vi.mock('maplibre-gl/dist/maplibre-gl-worker.mjs?url', () => ({ default: '/worker.mjs' }));

vi.mock('../../lib/map-style', () => ({ basemapStyle: () => ({}) }));

import { MapView } from './MapView';

const baseProps = {
  riskScheme: 'a' as const,
  year: 2026,
  level: 'regency' as const,
  focusBounds: null,
  latestPoints: null,
  onSelectRegion: vi.fn(),
};

/** Pasang peta lalu jalankan kejadian `load`, sama seperti peramban sungguhan.
 *
 * `act` wajib: `load` menaikkan keadaan `ready`, dan tanpa itu efek pemasangan
 * layer belum sempat berjalan saat pemeriksaan dilakukan.
 */
function mount(props: Parameters<typeof MapView>[0]) {
  const view = render(<MapView {...props} />);
  act(() => {
    mapState.listeners.get('load')?.();
  });
  return view;
}

beforeEach(() => {
  mapState.sources.clear();
  mapState.layers.clear();
  mapState.listeners.clear();
  mapState.fitBounds.length = 0;
  mapState.minZoom.length = 0;
  mapState.removed.length = 0;
  mapState.queryRows.length = 0;
});

describe('MapView kotak peta', () => {
  it('melaporkan kotak peta saat gaya siap dan setiap gerakan selesai', () => {
    const onViewportChange = vi.fn();
    mount({ ...baseProps, layer: 'hotspot', provinceCode: null, onViewportChange });

    // Laporan awal wajib: kendali "Batasi ke area tampak" butuh kotak sebelum
    // pengguna menggeser peta sama sekali.
    expect(onViewportChange).toHaveBeenCalledWith([95, -11, 141, 6]);

    act(() => {
      mapState.listeners.get('moveend')?.();
    });

    expect(onViewportChange).toHaveBeenCalledTimes(2);
  });

  it('tidak memasang pelapor kotak peta saat pemanggil tidak memintanya', () => {
    expect(() =>
      mount({ ...baseProps, layer: 'hotspot', provinceCode: null }),
    ).not.toThrow();
    expect(mapState.listeners.has('moveend')).toBe(true);
  });
});

describe('MapView lapisan desa', () => {
  it('meminta tile desa satu provinsi dengan zoom minimum 8', () => {
    mount({ ...baseProps, layer: 'risk_village', provinceCode: '33' });

    expect(mapState.sources.get('village-risk')).toEqual({
      type: 'vector',
      tiles: ['/tiles/risk/villages/{z}/{x}/{y}.mvt?province=33'],
      minzoom: 8,
      maxzoom: 14,
    });
    expect(mapState.layers.has('village-risk-fill')).toBe(true);
    expect(mapState.layers.has('village-risk-line')).toBe(true);
  });

  it('tidak memasang sumber apa pun sebelum provinsi dipilih', () => {
    mount({ ...baseProps, layer: 'risk_village', provinceCode: null });

    expect(mapState.sources.size).toBe(0);
    expect(mapState.layers.size).toBe(0);
  });

  it('melepas lapisan desa saat kembali ke lapisan titik panas', () => {
    const view = mount({ ...baseProps, layer: 'risk_village', provinceCode: '33' });

    view.rerender(<MapView {...baseProps} layer="hotspot" provinceCode="33" />);

    expect(mapState.sources.has('village-risk')).toBe(false);
    expect(mapState.layers.has('village-risk-fill')).toBe(false);
    expect(mapState.removed).toContain('layer:village-risk-fill');
    expect(mapState.sources.get('hotspot')).toEqual({
      type: 'vector',
      tiles: ['/tiles/regions/{z}/{x}/{y}.mvt?year=2026'],
      minzoom: 0,
      maxzoom: 14,
    });
  });

  it('mengganti provinsi tanpa meninggalkan sumber yang bertumpuk', () => {
    const view = mount({ ...baseProps, layer: 'risk_village', provinceCode: '33' });

    view.rerender(<MapView {...baseProps} layer="risk_village" provinceCode="35" />);

    expect(mapState.sources.get('village-risk')).toMatchObject({
      tiles: ['/tiles/risk/villages/{z}/{x}/{y}.mvt?province=35'],
    });
    expect(mapState.layers.size).toBe(2); // fill + line, tidak berganda
  });

  it('menaikkan zoom minimum peta selama lapisan desa aktif', () => {
    // MapLibre tidak meminta satu tile pun bila zoom peta yang dibulatkan ke bawah
    // lebih kecil daripada `minzoom` sumbernya, jadi zoom peta sendiri yang harus
    // dijaga — bukan hanya sumbernya (ditemukan di peramban 2026-11-17).
    const view = mount({ ...baseProps, layer: 'risk_village', provinceCode: '33' });

    expect(mapState.minZoom).toEqual([8]);

    view.rerender(<MapView {...baseProps} layer="hotspot" provinceCode="33" />);

    expect(mapState.minZoom).toEqual([8, 0]);
  });

  it('memperbesar ke kotak wilayah provinsi dengan zoom minimum lapisan desa', () => {
    mount({
      ...baseProps,
      layer: 'risk_village',
      provinceCode: '33',
      focusBounds: [108.56, -8.21, 111.69, -5.73],
    });

    expect(mapState.fitBounds).toEqual([
      { padding: 48, maxZoom: 11, minZoom: 8, duration: 800 },
    ]);
  });

  it('membuka panel desa saat poligon desa diklik (`W4`)', () => {
    const onSelectRegion = vi.fn();
    mapState.queryRows.push({ properties: { village_code: '6271012003', village_name: 'Bukit Tunggal' } });
    mount({ ...baseProps, layer: 'risk_village', provinceCode: '62', onSelectRegion });

    act(() => {
      const click = mapState.listeners.get('click') as unknown as (event: unknown) => void;
      click({ point: { x: 10, y: 10 } });
    });

    // Kode desa yang dibuka, bukan kabupaten/kota induknya: panelnya `W4`.
    expect(onSelectRegion).toHaveBeenCalledWith({
      code: '6271012003',
      name: 'Bukit Tunggal',
      level: 'village',
    });
  });

  it('tidak membuka panel saat klik desa tidak mengenai poligon', () => {
    const onSelectRegion = vi.fn();
    mount({ ...baseProps, layer: 'risk_village', provinceCode: '62', onSelectRegion });

    act(() => {
      const click = mapState.listeners.get('click') as unknown as (event: unknown) => void;
      click({ point: { x: 10, y: 10 } });
    });

    expect(onSelectRegion).not.toHaveBeenCalled();
  });
});
