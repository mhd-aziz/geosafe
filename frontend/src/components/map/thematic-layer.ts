import {
  eventTileSourceLayer,
  eventTileUrlTemplate,
  riskTileUrlTemplate,
  tileSourceLayer,
  tileUrlTemplate,
  villageRiskTileUrlTemplate,
} from '../../api/geosafe';
import { formatCount, formatDecimal } from '../../lib/format';
import {
  RISK_SOURCE_LAYER,
  VILLAGE_SOURCE_LAYER,
  riskClassLabel,
  villageRiskClassLabel,
} from '../../lib/risk';
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
  /** Zoom terkecil yang dilayani sumbernya; lapisan desa mulai dari z=8. */
  minzoom: number;
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

const EVENTS_IDS = {
  sourceId: 'events',
  fillLayerId: 'events-fill',
  lineLayerId: 'events-line',
} as const;

const VILLAGE_IDS = {
  sourceId: 'village-risk',
  fillLayerId: 'village-risk-fill',
  lineLayerId: 'village-risk-line',
} as const;

/** Zoom terkecil lapisan desa; di bawah ini API menjawab `422`, jadi sumbernya
 *  tidak boleh meminta tile yang lebih rendah (`SRS-F-38`). */
export const VILLAGE_MIN_ZOOM = 8;

/** Spesifikasi lapisan aktif, atau `null` bila belum bisa dipasang.
 *
 * Lapisan desa wajib punya provinsi terpilih: ia dimuat per provinsi, dan tanpa
 * kode provinsi tidak ada tile yang sah untuk diminta.
 */
export function thematicSpec(
  layer: MapLayer,
  level: MapLevel,
  year: number,
  scheme: RiskSchemeCode,
  provinceCode: string | null = null,
): ThematicSpec | null {
  if (layer === 'risk_village') {
    if (!provinceCode) {
      return null;
    }
    return {
      ...VILLAGE_IDS,
      url: villageRiskTileUrlTemplate(provinceCode),
      sourceLayer: VILLAGE_SOURCE_LAYER,
      minzoom: VILLAGE_MIN_ZOOM,
    };
  }

  if (layer === 'risk') {
    return {
      ...RISK_IDS,
      url: riskTileUrlTemplate(scheme),
      sourceLayer: RISK_SOURCE_LAYER,
      minzoom: 0,
    };
  }

  // Lapisan kejadian (`P3`) dan titik kejadian (`P5`) hanya ada di tingkat
  // kabupaten/kota, dan tahunnya ikut di URL.
  if (layer === 'events') {
    return {
      ...EVENTS_IDS,
      url: eventTileUrlTemplate(year),
      sourceLayer: eventTileSourceLayer(),
      minzoom: 0,
    };
  }

  // Titik kejadian (`P5`) bukan tile: sumbernya GeoJSON yang dipasang MapView
  // sendiri, jadi tidak ada spesifikasi sumber vektor di sini.
  if (layer === 'event_points') {
    return null;
  }

  return {
    ...HOTSPOT_IDS,
    url: tileUrlTemplate(level, year),
    sourceLayer: tileSourceLayer(level),
    minzoom: 0,
  };
}

/** Semua layer/sumber tematik yang mungkin terpasang; dipakai untuk membersihkan. */
export const THEMATIC_IDS = [HOTSPOT_IDS, RISK_IDS, EVENTS_IDS, VILLAGE_IDS];

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
  if (layer === 'risk_village') {
    const villageName = String(properties.village_name ?? 'desa');
    const district = properties.district_name ? ` (${String(properties.district_name)})` : '';
    if (Number(properties.has_score ?? 0) === 0) {
      return `${villageName}${district} · kelas kerawanan belum ada`;
    }
    return `${villageName}${district} · ${villageRiskClassLabel(
      properties.risk_class === null || properties.risk_class === undefined
        ? null
        : String(properties.risk_class),
    )}`;
  }

  const nameProperty = layer === 'risk' || level === 'regency' ? 'region_name' : 'province_name';
  const name = String(properties[nameProperty] ?? 'wilayah');

  // Lapisan kejadian (`P3`): abu-abu di sini berarti tidak ada kejadian tercatat
  // pada tahun itu — bukan angka yang belum dimuat seperti pada titik panas.
  if (layer === 'events') {
    if (Number(properties.has_fact ?? 0) === 0) {
      return `${name} · tidak ada kejadian tercatat ${year}`;
    }
    return `${name} · ${formatCount(Number(properties.event_count))} kejadian tercatat BNPB ${year}`;
  }

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
  const count = `${formatCount(Number(properties.hotspot_count))} titik panas ${year}`;
  // Kepadatan hanya ada di tile kabupaten/kota (`regions.area_km2`); tile provinsi
  // tidak punya luas wilayah, jadi bacaannya berhenti di jumlah titik panas.
  const density = properties.hotspot_per_1000_km2;
  if (density === null || density === undefined) {
    return `${name} · ${count}`;
  }
  return `${name} · ${count} · ${formatDecimal(Number(density))} per 1.000 km²`;
}