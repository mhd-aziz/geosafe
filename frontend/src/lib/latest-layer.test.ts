import { describe, expect, it } from 'vitest';

import { LATEST_CLASS_COLORS, latestCircleColorExpression, pointsToGeoJson } from './latest-layer';
import type { LatestPoint } from '../types/geosafe';

function titik(point: Partial<LatestPoint> = {}): LatestPoint {
  return {
    latitude: -9.03452,
    longitude: 140.99622,
    observed_at: '2026-11-17T04:33:00Z',
    confidence: 'n',
    confidence_class: 'nominal',
    satellite: 'VIIRS_NOAA20_NRT',
    instrument: 'VIIRS',
    brightness: 333.19,
    frp: 46.43,
    region_code: '9413',
    ...point,
  };
}

describe('pointsToGeoJson', () => {
  it('menulis koordinat dengan urutan bujur lalu lintang, bukan sebaliknya', () => {
    const geojson = pointsToGeoJson([titik()]);

    // Kebalikan urutan tidak memunculkan galat apa pun; titiknya hanya muncul di
    // tempat yang salah, jadi urutan ini yang diuji.
    expect(geojson.features[0].geometry.coordinates).toEqual([140.99622, -9.03452]);
    expect(geojson.features[0].geometry.type).toBe('Point');
    expect(geojson.type).toBe('FeatureCollection');
  });

  it('membawa medan yang dipakai pewarnaan dan penyaringan titik', () => {
    const geojson = pointsToGeoJson([titik({ confidence_class: null, region_code: null })]);

    expect(geojson.features[0].properties).toEqual({
      observed_at: '2026-11-17T04:33:00Z',
      confidence_class: null,
      satellite: 'VIIRS_NOAA20_NRT',
      region_code: null,
    });
  });

  it('mengembalikan koleksi kosong untuk daftar titik kosong', () => {
    expect(pointsToGeoJson([])).toEqual({ type: 'FeatureCollection', features: [] });
  });
});

describe('latestCircleColorExpression', () => {
  it('memetakan tiga kelas ke warna dan menyisakan abu-abu untuk kelas tak dikenal', () => {
    const expression = latestCircleColorExpression() as unknown[];

    expect(expression[0]).toBe('match');
    expect(expression).toContain('high');
    expect(expression).toContain(LATEST_CLASS_COLORS.high);
    expect(expression).toContain(LATEST_CLASS_COLORS.nominal);
    expect(expression).toContain(LATEST_CLASS_COLORS.low);
    // Kelas `null` tidak boleh dibaca sebagai keyakinan rendah (kontrak bagian 3).
    expect(expression[expression.length - 1]).toBe(LATEST_CLASS_COLORS.unknown);
  });
});
