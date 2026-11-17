import { describe, expect, it } from 'vitest';

import {
  NO_SCORE_COLOR,
  RISK_CLASSES,
  riskFillColorExpression,
  riskLegendEntries,
} from './risk';

describe('riskLegendEntries', () => {
  it('menyebut tiga kelas ditutup penanda skor belum ada', () => {
    const entries = riskLegendEntries();

    expect(entries.map((entry) => entry.label)).toEqual([
      'Rendah',
      'Sedang',
      'Tinggi',
      'skor belum ada (bukan kerawanan rendah)',
    ]);
    expect(entries.at(-1)?.color).toBe(NO_SCORE_COLOR);
  });
});

describe('riskFillColorExpression', () => {
  it('mencocokkan teks kelas dan memisahkan wilayah tanpa skor', () => {
    const expression = riskFillColorExpression();

    const strings: string[] = [];
    const walk = (part: unknown): void => {
      if (typeof part === 'string') {
        strings.push(part);
      } else if (Array.isArray(part)) {
        part.forEach(walk);
      }
    };
    walk(expression);

    expect(expression[0]).toBe('case');
    expect(strings).toContain('has_score');
    expect(strings).toContain('risk_class');
    for (const riskClass of RISK_CLASSES) {
      expect(strings).toContain(riskClass.value);
      expect(strings).toContain(riskClass.color);
    }
    // abu-abu muncul dua kali: sebagai penjaga has_score = 0 dan sebagai cabang
    // terakhir `match` — keduanya harus ada supaya tidak ada poligon tanpa warna.
    expect(strings.filter((part) => part === NO_SCORE_COLOR).length).toBeGreaterThanOrEqual(2);
  });
});
