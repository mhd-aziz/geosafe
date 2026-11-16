import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchRegionPanel, searchRegions, tileSourceLayer, tileUrlTemplate } from './geosafe';

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

describe('fetchRegionPanel', () => {
  it('meneruskan pesan galat dari API beserta kode statusnya', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ detail: 'wilayah 9999 tidak ada' }, 404)),
    );

    await expect(fetchRegionPanel('9999')).rejects.toThrow('wilayah 9999 tidak ada');
  });
});
