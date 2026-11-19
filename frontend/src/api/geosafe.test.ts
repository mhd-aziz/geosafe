import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  fetchLatest,
  fetchLatestSummary,
  fetchRegionPanel,
  fetchPointCoverage,
  fetchVillageProvinces,
  searchRegions,
  tileSourceLayer,
  tileUrlTemplate,
  villageRiskTileUrlTemplate,
  villageTileSourceLayer,
} from './geosafe';

/** Balasan palsu tanpa kelas `Response`, supaya uji tidak bergantung lingkungan. */
function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('tileUrlTemplate', () => {
  it('memakai layer regions untuk kabupaten/kota', () => {
    expect(tileUrlTemplate('regency', 2024)).toBe(
      '/tiles/regions/{z}/{x}/{y}.mvt?year=2024',
    );
    expect(tileSourceLayer('regency')).toBe('regions');
  });

  it('memakai layer provinces untuk provinsi', () => {
    expect(tileUrlTemplate('province', 2020)).toBe(
      '/tiles/provinces/{z}/{x}/{y}.mvt?year=2020',
    );
    expect(tileSourceLayer('province')).toBe('provinces');
  });
});

describe('searchRegions', () => {
  it('meng-encode kata kunci sebelum dikirim', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ query: 'kota bogor', limit: 20, count: 0, results: [], notes: [] }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await searchRegions('kota bogor');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/search/regions?q=kota%20bogor',
      undefined,
    );
  });
});

describe('fetchLatest', () => {
  it('mengirim jendela jam saja selama tidak ada kotak peta', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
    vi.stubGlobal('fetch', fetchMock);

    await fetchLatest(24);

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/latest?window=24', undefined);
  });

  it('menambahkan `bbox` apa adanya supaya penyempitan wilayah sampai ke API', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
    vi.stubGlobal('fetch', fetchMock);

    await fetchLatest(72, '95,-11,141,6');
    await fetchLatestSummary(72, '95,-11,141,6');

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/v1/latest?window=72&bbox=95,-11,141,6',
      undefined,
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/v1/latest/summary?window=72&bbox=95,-11,141,6',
      undefined,
    );
  });
});

describe('fetchRegionPanel', () => {
  it('meneruskan pesan galat dari API beserta kode statusnya', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ detail: 'wilayah 9999 tidak ada' }, 404)),
    );

    await expect(fetchRegionPanel('9999')).rejects.toThrow('wilayah 9999 tidak ada');
  });
});

describe('villageRiskTileUrlTemplate', () => {
  it('membawa kode provinsi dan nama layer desa', () => {
    // `SRS-F-38`: lapisan ini dimuat per provinsi, jadi kodenya bagian dari URL —
    // bukan disaring di klien.
    expect(villageRiskTileUrlTemplate('33')).toBe(
      '/tiles/risk/villages/{z}/{x}/{y}.mvt?province=33',
    );
    expect(villageTileSourceLayer()).toBe('risk_villages');
  });
});

describe('fetchVillageProvinces', () => {
  it('memanggil endpoint daftar provinsi sekali tanpa parameter', async () => {
    const body = {
      count: 1,
      min_zoom: 8,
      provinces: [{ province_code: '33', province_name: 'Jawa Tengah', bbox: [108.5, -8.2, 111.7, -5.7] }],
      class_counts: { rendah: 8_881 },
      village_total: 83_530,
      villages_without_class: 215,
      villages_without_province: 812,
      notes: [],
    };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(body));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchVillageProvinces()).resolves.toEqual(body);
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/provinces', undefined);
  });
});

describe('penyaring kepercayaan (SRS-F-15)', () => {
  it('menambahkan confidence ke URL tile kabupaten/kota saat dipilih', () => {
    expect(tileUrlTemplate('regency', 2023, 'h')).toBe(
      '/tiles/regions/{z}/{x}/{y}.mvt?year=2023&confidence=h',
    );
    // Tanpa pilihan, URL tidak berubah: seluruh kelas.
    expect(tileUrlTemplate('regency', 2023)).toBe('/tiles/regions/{z}/{x}/{y}.mvt?year=2023');
  });

  it('meneruskan kelas ke endpoint penempatan supaya angkanya angka tampilan aktif', async () => {
    // Parameternya ditulis supaya `mock.calls[0][0]` bertipe (tuple kosong kalau tidak).
    const fetchMock = vi.fn(async (_input: string) =>
      jsonResponse({ year: 2023, confidence: 'h' }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await fetchPointCoverage(2023, 'h');

    expect(fetchMock.mock.calls[0][0]).toContain('/api/v1/point_coverage?year=2023&confidence=h');
  });
});
