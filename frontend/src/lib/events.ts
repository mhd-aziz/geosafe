/** Kelas warna choropleth **kejadian tercatat BNPB** (`P3`, `SRS-F-28`).
 *
 * Warna sengaja beda keluarga dari lapisan titik panas: yang diwarnai di sini
 * peristiwa yang tercatat, bukan deteksi satelit (`SRS-F-30`). Kelasnya tetap
 * supaya warna satu wilayah bisa dibandingkan antar tahun.
 */

export interface EventClass {
  /** Label kelas dengan angka, dipakai langsung di legenda. */
  label: string;
  /** Batas bawah kelas (inklusif), mulai dari 1 — nol punya warna sendiri. */
  min: number;
  color: string;
}

export const EVENT_CLASSES: EventClass[] = [
  { label: '1', min: 1, color: '#ece2f0' },
  { label: '2 – 5', min: 2, color: '#d0bbdd' },
  { label: '6 – 20', min: 6, color: '#a97fbf' },
  { label: '21 – 50', min: 21, color: '#7d4a99' },
  { label: 'lebih dari 50', min: 51, color: '#4a1e63' },
];

/** Wilayah tanpa baris kejadian pada tahun terpilih.
 *
 * Di lapisan ini abu-abu berarti **tidak ada kejadian tercatat** pada tahun itu,
 * bukan "angkanya belum dimuat": BNPB hanya mencatat kejadian yang terjadi, dan
 * baris nasional sama dengan jumlah baris kabupaten/kota setiap tahun.
 */
export const NO_EVENT_COLOR = '#e5e7eb';

export const NO_EVENT_LABEL = 'tidak ada kejadian tercatat';

/** Kelas yang memuat sebuah nilai; dipakai legenda aktif dan pengujian. */
export function eventClassOf(value: number): EventClass | null {
  if (value < 1) {
    return null;
  }
  let matched = EVENT_CLASSES[0];
  for (const eventClass of EVENT_CLASSES) {
    if (value >= eventClass.min) {
      matched = eventClass;
    }
  }
  return matched;
}

/** Entri legenda: setiap kelas kejadian, ditutup penanda tanpa kejadian. */
export function eventLegendEntries(): { label: string; color: string }[] {
  return [
    ...EVENT_CLASSES.map(({ label, color }) => ({ label, color })),
    { label: NO_EVENT_LABEL, color: NO_EVENT_COLOR },
  ];
}

/** Ekspresi gaya MapLibre untuk layer `fill` lapisan kejadian.
 *
 * `has_fact = 0` (tidak ada baris) dipisah dari kelas angka; di lapisan ini ia
 * berarti tidak ada kejadian tercatat, bukan nol yang belum dimuat.
 */
export type StyleExpression = readonly (string | number | StyleExpression)[];

export function eventFillColorExpression(): StyleExpression {
  const stops: (number | string)[] = [];
  for (const eventClass of EVENT_CLASSES.slice(1)) {
    stops.push(eventClass.min, eventClass.color);
  }

  return [
    'case',
    ['==', ['coalesce', ['get', 'has_fact'], 0], 0],
    NO_EVENT_COLOR,
    [
      'step',
      ['coalesce', ['get', 'event_count'], 0],
      EVENT_CLASSES[0].color,
      ...stops,
    ],
  ];
}
