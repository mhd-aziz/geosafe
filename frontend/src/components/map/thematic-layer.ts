import { riskTileUrlTemplate, tileSourceLayer, tileUrlTemplate } from '../../api/geosafe';
import { formatCount, formatDecimal } from '../../lib/format';
import { RISK_SOURCE_LAYER, riskClassLabel } from '../../lib/risk';
import type { MapLayer, MapLevel, RiskSchemeCode } from '../../types/geosafe';

/** Sumber dan layer tematik yang dipasang untuk satu keadaan peta.
 *
 * Dipisah dari komponen supaya bisa diuji tanpa WebGL: yang mudah salah di sini
 * adalah lapisan lama tidak lepas saat lapisan berganti (dua poligon bertumpuk
 * dengan arti warna berbeda), dan itu tidak terlihat di uji jsdom mana pun.
 */
export interface ThematicSpec {
  sourceId: string;
  url: string;
  sourceLayer: string;
  fillLayerId: string;
  lineLayerId: string;
}

const HOTSPOT_IDS = {
  sourceId: 'hotspot',
  fillLayerId: 'hotspot-fill',
  lineLayerId: 'hotspot-line',
} as const;

const RISK_IDS = {
  sourceId: 'risk',
  fillLayerId: 'risk-fill',
  lineLayerId: 'risk-line',
} as const;

export function thematicSpec(
  layer: MapLayer,
  level: MapLevel,
  year: number,
  scheme: RiskSchemeCode,
): ThematicSpec {
  if (layer === 'risk') {
    return {
      ...RISK_IDS,
      url: riskTileUrlTemplate(scheme),
      sourceLayer: RISK_SOURCE_LAYER,
    };
  }

  return {
    ...HOTSPOT_IDS,
    url: tileUrlTemplate(level, year),
    sourceLayer: tileSourceLayer(level),
  };
}

/** Semua layer/sumber tematik yang mungkin terpasang; dipakai untuk membersihkan. */
export const THEMATIC_IDS = [HOTSPOT_IDS, RISK_IDS];

/** Teks bacaan saat kursor berhenti di atas satu wilayah.
 *
 * Angka skor kerawanan ditampilkan di sini karena peta hanya mewarnai kelasnya:
 * tanpa bacaan ini angka skornya tidak bisa dibaca di antarmuka mana pun.
 */
export function readoutText(
  layer: MapLayer,
  level: MapLevel,
  year: number,
  properties: Record<string, unknown>,
): string {
  const nameProperty = layer === 'risk' || level === 'regency' ? 'region_name' : 'province_name';
  const name = String(properties[nameProperty] ?? 'wilayah');

  if (layer === 'risk') {
    if (Number(properties.has_score ?? 0) === 0) {
      return `${name} · skor kerawanan belum ada`;
    }
    return `${name} · skor ${formatDecimal(Number(properties.risk_score))} · ${riskClassLabel(
      properties.risk_class === null || properties.risk_class === undefined
        ? null
        : String(properties.risk_class),
    )}`;
  }

  if (Number(properties.has_fact ?? 0) === 0) {
    return `${name} · belum ada baris fakta ${year}`;
  }
  return `${name} · ${formatCount(Number(properties.hotspot_count))} titik panas ${year}`;
}