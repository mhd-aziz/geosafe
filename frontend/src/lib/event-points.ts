/** Titik kejadian karhutla (`P5`): gaya, GeoJSON, dan bacaan kursornya.
 *
 * Ketelitian koordinat berbeda-beda (`SRS-F-41`) dan itu terlihat di peta: warna
 * dan ukuran titik mengikuti `coord_level`, karena ribuan kejadian berbagi satu
 * titik pusat wilayah. Tanpa pembedaan itu, peta menyatakan presisi yang datanya
 * tidak punya.
 */

import { formatCount } from './format';
import type { CoordLevel, EventPoint } from '../types/geosafe';

export interface CoordLevelStyle {
  label: string;
  /** Warna titik; dipakai legenda dan ekspresi gaya. */
  color: string;
  /** Pengali jari-jari: titik pusat wilayah digambar lebih besar supaya terlihat
   *  bahwa satu titik mewakili banyak kejadian. */
  radiusFactor: number;
}

export const COORD_LEVEL_STYLES: Record<CoordLevel, CoordLevelStyle> = {
  village: { label: 'Desa/kelurahan (teliti)', color: '#1d4ed8', radiusFactor: 1 },
  district: { label: 'Pusat kecamatan', color: '#b45309', radiusFactor: 1.5 },
  region: { label: 'Pusat kabupaten/kota', color: '#7f1d1d', radiusFactor: 2 },
};

/** Urutan tetap untuk legenda; `null` (tingkat tidak dikenal) tidak diklaim. */
export const COORD_LEVEL_ORDER: CoordLevel[] = ['village', 'district', 'region'];

export function coordLevelLabel(level: string | null | undefined): string {
  if (level === 'village' || level === 'district' || level === 'region') {
    return COORD_LEVEL_STYLES[level].label;
  }
  return 'ketelitian tidak diketahui';
}

export type StyleExpression = readonly (string | number | StyleExpression)[];

/** Ekspresi warna `circle-color` menurut `coord_level`. */
export function pointColorExpression(): StyleExpression {
  return [
    'match',
    ['get', 'coord_level'],
    'village',
    COORD_LEVEL_STYLES.village.color,
    'district',
    COORD_LEVEL_STYLES.district.color,
    'region',
    COORD_LEVEL_STYLES.region.color,
    '#475569',
  ];
}

/** Ekspresi jari-jari: dasar menurut zoom, dikali faktor tingkat ketelitian. */
export function pointRadiusExpression(): StyleExpression {
  return [
    '*',
    ['interpolate', ['linear'], ['zoom'], 3, 2.4, 9, 6],
    [
      'match',
      ['get', 'coord_level'],
      'village',
      COORD_LEVEL_STYLES.village.radiusFactor,
      'district',
      COORD_LEVEL_STYLES.district.radiusFactor,
      'region',
      COORD_LEVEL_STYLES.region.radiusFactor,
      1,
    ],
  ];
}

/** FeatureCollection untuk sumber GeoJSON MapLibre. */
export function pointsToGeoJson(points: EventPoint[]): {
  type: 'FeatureCollection';
  features: {
    type: 'Feature';
    geometry: { type: 'Point'; coordinates: [number, number] };
    properties: Record<string, unknown>;
  }[];
} {
  return {
    type: 'FeatureCollection',
    features: points.map((point) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [point.longitude, point.latitude] as [number, number],
      },
      properties: {
        point_id: point.point_id,
        coord_level: point.coord_level,
        event_date: point.event_date,
        region_name: point.region_name,
        province_name: point.province_name,
      },
    })),
  };
}

/** Bacaan kursor untuk satu titik kejadian: tanggal, ketelitian, dan wilayahnya. */
export function pointReadoutText(properties: Record<string, unknown>): string {
  const date = properties.event_date ? String(properties.event_date) : 'tanggal tidak ada';
  const place = String(properties.region_name ?? 'wilayah tidak diketahui');
  return `${date} · ${place} · ${coordLevelLabel(
    properties.coord_level === null || properties.coord_level === undefined
      ? null
      : String(properties.coord_level),
  )}`;
}

/** Ringkasan jumlah titik per tingkat ketelitian untuk panel; `0` tetap ditulis. */
export function coordLevelSummary(counts: Record<string, number>): string {
  return COORD_LEVEL_ORDER.map(
    (level) => `${COORD_LEVEL_STYLES[level].label}: ${formatCount(counts[level] ?? 0)}`,
  ).join(' · ');
}
