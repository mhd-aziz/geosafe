/** Lapisan titik panas terkini di peta: titik API → GeoJSON + warna menurut kelas.
 *
 * Titik terkini digambar sebagai titik, bukan poligon: wilayahnya (join
 * `region_code`) dipakai panel, sedangkan peta perlu menunjukkan sebaran
 * deteksinya. Warna memakai `confidence_class` supaya angka asal yang berbeda
 * skala (VIIRS huruf, MODIS 0–100) tetap terbaca sebagai satu kelas.
 */

import type { LatestPoint } from '../types/geosafe';

/** Warna per kelas keyakinan; abu-abu untuk kelas yang tidak diketahui.
 *
 * Kelas `null` **bukan** kelas rendah: kontrak `API-P2.md` bagian 3 menyatakan
 * nilai kosong/tak dikenal tidak boleh dibaca sebagai keyakinan rendah, jadi
 * warnanya pun dipisah.
 */
export const LATEST_CLASS_COLORS = {
  high: '#b91c1c',
  nominal: '#ea580c',
  low: '#facc15',
  unknown: '#64748b',
} as const;

export interface LatestFeatureCollection {
  type: 'FeatureCollection';
  features: {
    type: 'Feature';
    geometry: { type: 'Point'; coordinates: [number, number] };
    properties: {
      observed_at: string;
      confidence_class: string | null;
      satellite: string;
      region_code: string | null;
    };
  }[];
}

/** Titik API → FeatureCollection.
 *
 * Urutan koordinat GeoJSON adalah `[bujur, lintang]` (kebalikan pasangan
 * `latitude, longitude` di API) — salah urut menaruh Indonesia di Somalia tanpa
 * galat apa pun, karena itu urutannya diuji.
 */
export function pointsToGeoJson(points: LatestPoint[]): LatestFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: points.map((point) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [point.longitude, point.latitude] },
      properties: {
        observed_at: point.observed_at,
        confidence_class: point.confidence_class,
        satellite: point.satellite,
        region_code: point.region_code,
      },
    })),
  };
}

/** Ekspresi `circle-color` MapLibre untuk kelas keyakinan titik terkini. */
export function latestCircleColorExpression(): unknown {
  return [
    'match',
    ['get', 'confidence_class'],
    'high',
    LATEST_CLASS_COLORS.high,
    'nominal',
    LATEST_CLASS_COLORS.nominal,
    'low',
    LATEST_CLASS_COLORS.low,
    LATEST_CLASS_COLORS.unknown,
  ];
}
