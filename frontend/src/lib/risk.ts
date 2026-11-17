/** Warna dan legenda lapisan kerawanan (`P4`).
 *
 * Berbeda dari kelas titik panas (`lib/choropleth.ts`): yang diwarnai di sini
 * bukan angka deteksi, melainkan **kelas kerawanan** hasil skor susunan
 * penelitian (`rendah`, `sedang`, `tinggi`). Nilainya datang sebagai teks dari
 * basis data (`value_text`), jadi ekspresinya mencocokkan teks — bukan angka.
 *
 * Warna sengaja urut kekuningan → cokelat (ColorBrewer YlOrBr) supaya berbeda
 * dari tangga oranye–merah kelas titik panas: dua lapisan itu tidak pernah
 * tampil bersamaan, tetapi legenda keduanya dibaca di tempat yang sama.
 */

import { formatCount } from './format';

export interface RiskClass {
  /** Nilai kelas apa adanya dari basis data. */
  value: 'rendah' | 'sedang' | 'tinggi';
  label: string;
  color: string;
}

export const RISK_CLASSES: RiskClass[] = [
  { value: 'rendah', label: 'Rendah', color: '#fee391' },
  { value: 'sedang', label: 'Sedang', color: '#fe9929' },
  { value: 'tinggi', label: 'Tinggi', color: '#993404' },
];

/** Wilayah tanpa baris skor: abu-abu, **bukan** kelas rendah.
 *
 * Ini arti yang berbeda dari `has_fact = 0` pada lapisan titik panas: di sana
 * "nol deteksi yang terukur", di sini "skor belum dihitung".
 */
export const NO_SCORE_COLOR = '#d8dee9';

export const NO_SCORE_LABEL = 'skor belum ada (bukan kerawanan rendah)';

/** Skema bobot yang dipakai saat lapisan kerawanan pertama kali dibuka. */
export const DEFAULT_RISK_SCHEME = 'a';

/** Nama layer di dalam tile kerawanan (dibuat endpoint `P4`). */
export const RISK_SOURCE_LAYER = 'risk';

/** Entri legenda kerawanan: tiga kelas ditutup penanda tanpa skor. */
export function riskLegendEntries(): { label: string; color: string }[] {
  return [
    ...RISK_CLASSES.map(({ label, color }) => ({ label, color })),
    { label: NO_SCORE_LABEL, color: NO_SCORE_COLOR },
  ];
}

/** Ekspresi gaya MapLibre untuk layer `fill` kerawanan.
 *
 * Tipe resmi `ExpressionSpecification` tidak diekspor maplibre-gl v6, jadi
 * bentuknya ditulis sendiri seperti di `lib/choropleth.ts`.
 */
export function riskFillColorExpression(): readonly unknown[] {
  const match: (string | readonly unknown[])[] = ['match', ['get', 'risk_class']];
  for (const riskClass of RISK_CLASSES) {
    match.push(riskClass.value, riskClass.color);
  }
  match.push(NO_SCORE_COLOR);

  return [
    'case',
    ['==', ['coalesce', ['get', 'has_score'], 0], 0],
    NO_SCORE_COLOR,
    match,
  ];
}

/** Nama kelas untuk dibaca manusia; nilai tak dikenal dikembalikan apa adanya. */
export function riskClassLabel(value: string | null | undefined): string {
  if (!value) {
    return 'kelas tidak diketahui';
  }
  return RISK_CLASSES.find((riskClass) => riskClass.value === value)?.label ?? value;
}

/* ── Kelas kerawanan desa/kelurahan (`SRS-F-38`, `SRS-F-39`) ─────────────────
 *
 * Bukan tangga yang sama dengan kabupaten/kota. Di tingkat desa ada kelas
 * keempat, `tidak_ada_deteksi`: desa tanpa satu pun deteksi titik panas. Kelas
 * itu **bukan** kerawanan rendah — nol deteksi bisa berarti tidak terdeteksi
 * satelit (`SRS-F-39`) — jadi warnanya sengaja di luar tangga kuning–cokelat dan
 * diberi label apa adanya.
 */

export interface VillageRiskClass {
  /** Nilai kelas apa adanya dari basis data. */
  value: 'rendah' | 'sedang' | 'tinggi' | 'tidak_ada_deteksi';
  label: string;
  color: string;
}

/** Urut dari paling rawan ke paling tidak, lalu kelas tanpa deteksi. */
export const VILLAGE_RISK_CLASSES: VillageRiskClass[] = [
  { value: 'tinggi', label: 'Tinggi', color: '#993404' },
  { value: 'sedang', label: 'Sedang', color: '#fe9929' },
  { value: 'rendah', label: 'Rendah', color: '#fee391' },
  { value: 'tidak_ada_deteksi', label: 'Tidak ada deteksi (bukan rendah)', color: '#bdd7ee' },
];

/** Desa yang belum punya baris kelas sama sekali: abu-abu, sama seperti wilayah
 *  tanpa skor di tingkat kabupaten/kota. */
export const NO_VILLAGE_CLASS_LABEL = 'kelas belum ada (bukan kerawanan rendah)';

/** Nama layer desa di dalam tile MVT. */
export const VILLAGE_SOURCE_LAYER = 'risk_villages';

/** Entri legenda desa; jumlah desa ikut bila angkanya sudah ada dari API. */
export function villageLegendEntries(
  classCounts: Record<string, number> = {},
): { label: string; color: string }[] {
  return [
    ...VILLAGE_RISK_CLASSES.map(({ value, label, color }) => ({
      label:
        classCounts[value] === undefined
          ? label
          : `${label} · ${formatCount(classCounts[value])} desa`,
      color,
    })),
    { label: NO_VILLAGE_CLASS_LABEL, color: NO_SCORE_COLOR },
  ];
}

/** Ekspresi gaya MapLibre untuk layer `fill` desa.
 *
 * Bentuknya sama dengan tingkat kabupaten/kota: penjaga `has_score = 0` lebih
 * dulu (kelas belum ada ≠ kelas apa pun), baru pencocokan teks `risk_class`.
 */
export function villageRiskFillColorExpression(): readonly unknown[] {
  const match: (string | readonly unknown[])[] = ['match', ['get', 'risk_class']];
  for (const villageClass of VILLAGE_RISK_CLASSES) {
    match.push(villageClass.value, villageClass.color);
  }
  match.push(NO_SCORE_COLOR);

  return [
    'case',
    ['==', ['coalesce', ['get', 'has_score'], 0], 0],
    NO_SCORE_COLOR,
    match,
  ];
}

/** Nama kelas desa untuk dibaca manusia; nilai tak dikenal dikembalikan apa adanya. */
export function villageRiskClassLabel(value: string | null | undefined): string {
  if (!value) {
    return 'kelas tidak diketahui';
  }
  return VILLAGE_RISK_CLASSES.find((villageClass) => villageClass.value === value)?.label ?? value;
}
