/** Kelas warna choropleth titik panas beserta legenda berangka.
 *
 * Kelasnya tetap (bukan dihitung dari sebaran tahun terpilih) supaya warna satu
 * wilayah bisa dibandingkan antar tahun tanpa berubah arti, dan supaya legenda
 * bisa menyebut angka setiap kelas (`SRS-F-18`). Batas kelas sengaja jarang
 * diubah; kalau diubah, sebutkan di catatan rilis karena warna peta bergeser.
 */

export interface HotspotClass {
  /** Label kelas dengan angka, dipakai langsung di legenda. */
  label: string;
  /** Batas bawah kelas (inklusif). */
  min: number;
  color: string;
}

export const HOTSPOT_CLASSES: HotspotClass[] = [
  { label: '0', min: 0, color: '#fff5eb' },
  { label: '1 – 25', min: 1, color: '#fdd49e' },
  { label: '26 – 100', min: 26, color: '#fdbb84' },
  { label: '101 – 500', min: 101, color: '#fc8d59' },
  { label: '501 – 2.000', min: 501, color: '#e34a33' },
  { label: 'lebih dari 2.000', min: 2001, color: '#b30000' },
];

/** Wilayah tanpa baris fakta pada tahun terpilih: abu-abu, bukan kelas rendah. */
export const NO_FACT_COLOR = '#d8dee9';

export const NO_FACT_LABEL = 'tanpa baris fakta (jangan dibaca sebagai 0)';

/** Kelas yang memuat sebuah nilai; dipakai legenda aktif dan pengujian. */
export function hotspotClassOf(value: number): HotspotClass {
  let matched = HOTSPOT_CLASSES[0];
  for (const hotspotClass of HOTSPOT_CLASSES) {
    if (value >= hotspotClass.min) {
      matched = hotspotClass;
    }
  }
  return matched;
}

/** Entri legenda: setiap kelas beserta angkanya, ditutup penanda tanpa fakta. */
export function legendEntries(): { label: string; color: string }[] {
  return [
    ...HOTSPOT_CLASSES.map(({ label, color }) => ({ label, color })),
    { label: NO_FACT_LABEL, color: NO_FACT_COLOR },
  ];
}

/** Ekspresi gaya MapLibre (array bertingkat).
 *
 * Tipe resmi `ExpressionSpecification` tidak diekspor oleh `maplibre-gl` v6,
 * jadi bentuknya ditulis sendiri di sini; nilainya hanya dipakai sebagai nilai
 * `paint` pada layer.
 */
export type StyleExpression = readonly (string | number | StyleExpression)[];

/** Ekspresi warna untuk layer `fill`: `has_fact = 0` dipisah dari kelas angka. */
export function fillColorExpression(): StyleExpression {
  const stops: (number | string)[] = [];
  for (const hotspotClass of HOTSPOT_CLASSES.slice(1)) {
    stops.push(hotspotClass.min, hotspotClass.color);
  }

  const expression: StyleExpression = [
    'case',
    ['==', ['coalesce', ['get', 'has_fact'], 0], 0],
    NO_FACT_COLOR,
    [
      'step',
      ['coalesce', ['get', 'hotspot_count'], 0],
      HOTSPOT_CLASSES[0].color,
      ...stops,
    ],
  ];

  return expression;
}
