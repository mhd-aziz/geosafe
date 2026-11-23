import { describe, expect, it } from 'vitest';
import { createPropertyExpression, latest } from '@maplibre/maplibre-gl-style-spec';

import {
  COORD_LEVEL_STYLES,
  coordLevelLabel,
  coordLevelSummary,
  pointColorExpression,
  pointRadiusExpression,
  pointReadoutText,
  pointsToGeoJson,
} from './event-points';
import type { EventPoint } from '../types/geosafe';

const POINT: EventPoint = {
  point_id: '1403 107 2023 01 01 1',
  event_date: '2023-01-01',
  year: 2023,
  coord_level: 'village',
  longitude: 102.050188,
  latitude: 1.310401,
  province_code: '14',
  province_name: 'Riau',
  region_code: '1403',
  region_name: 'Bengkalis',
  district_name: 'Talang Mandau | Bukit Batu',
  village_name: 'Dompas | Tanjung Belit',
  deaths: null,
  injured: null,
  houses_damaged: 0,
  documentation_url: null,
};

describe('titik kejadian (P5)', () => {
  it('membedakan tiga tingkat ketelitian koordinat (`SRS-F-41`)', () => {
    expect(Object.keys(COORD_LEVEL_STYLES)).toEqual(['village', 'district', 'region']);
    // Titik pusat wilayah digambar lebih besar: satu koordinat mewakili banyak kejadian.
    expect(COORD_LEVEL_STYLES.region.radiusFactor).toBeGreaterThan(
      COORD_LEVEL_STYLES.district.radiusFactor,
    );
    expect(COORD_LEVEL_STYLES.district.radiusFactor).toBeGreaterThan(
      COORD_LEVEL_STYLES.village.radiusFactor,
    );
    expect(coordLevelLabel('village')).toBe('Desa/kelurahan (teliti)');
    expect(coordLevelLabel(null)).toBe('ketelitian tidak diketahui');
  });

  it('menyusun GeoJSON dengan long/lat apa adanya dan properti yang dibutuhkan klik', () => {
    const collection = pointsToGeoJson([POINT]);

    expect(collection.type).toBe('FeatureCollection');
    expect(collection.features[0].geometry.coordinates).toEqual([102.050188, 1.310401]);
    expect(collection.features[0].properties.point_id).toBe('1403 107 2023 01 01 1');
    expect(collection.features[0].properties.coord_level).toBe('village');
  });

  it('bacaan kursor memuat tanggal, wilayah, dan tingkat ketelitiannya', () => {
    expect(
      pointReadoutText({
        event_date: '2023-01-01',
        region_name: 'Bengkalis',
        coord_level: 'village',
      }),
    ).toBe('2023-01-01 · Bengkalis · Desa/kelurahan (teliti)');
  });

  it('ringkasan menulis nol untuk tingkat yang tidak terpakai, bukan menghilangkannya', () => {
    expect(coordLevelSummary({ village: 637, district: 384, region: 1132 })).toBe(
      'Desa/kelurahan (teliti): 637 · Pusat kecamatan: 384 · Pusat kabupaten/kota: 1.132',
    );
    expect(coordLevelSummary({ village: 5 })).toContain('Pusat kecamatan: 0');
  });

  it('ekspresi gaya mengikuti coord_level, bukan satu warna untuk semua titik', () => {
    expect(JSON.stringify(pointColorExpression())).toContain('coord_level');
    expect(JSON.stringify(pointColorExpression())).toContain(COORD_LEVEL_STYLES.village.color);
    expect(JSON.stringify(pointRadiusExpression())).toContain('zoom');
  });

  it('ekspresi jari-jari diterima MapLibre: zoom hanya di akar interpolate', () => {
    // Regresi 2026-11-23: interpolate di dalam `*` membuat MapLibre menolak
    // seluruh lapisan ("circle-radius: zoom expression may only be used as input
    // to a top-level step or interpolate") dan peta menampilkan galat.
    const expression = pointRadiusExpression();
    expect(expression[0]).toBe('interpolate');

    const result = createPropertyExpression(
      expression as never,
      'circle-radius',
      latest.paint_circle['circle-radius'] as never,
    );
    expect(result.result).toBe('success');

    const color = createPropertyExpression(
      pointColorExpression() as never,
      'circle-color',
      latest.paint_circle['circle-color'] as never,
    );
    expect(color.result).toBe('success');
  });
});
