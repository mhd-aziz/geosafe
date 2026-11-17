import { describe, expect, it } from 'vitest';

import {
  NO_SCORE_COLOR,
  RISK_CLASSES,
  riskClassLabel,
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

describe('pasangan kelas dan warna', () => {
  // Ditulis sebagai matriks, bukan keanggotaan daftar: menukar dua warna antar
  // kelas tetap lolos kalau yang diperiksa hanya "warna ada di daftar".
  it.each([
    ['rendah', '#fee391'],
    ['sedang', '#fe9929'],
    ['tinggi', '#993404'],
  ])('kelas %s memakai warna %s', (value, color) => {
    const riskClass = RISK_CLASSES.find((item) => item.value === value);

    expect(riskClass?.color).toBe(color);
    expect(riskClass?.label).toBe(value.charAt(0).toUpperCase() + value.slice(1));
  });

  it('menyebut kelas tak dikenal tanpa menebak', () => {
    expect(riskClassLabel('sangat tinggi')).toBe('sangat tinggi');
    expect(riskClassLabel(null)).toBe('kelas tidak diketahui');
    expect(riskClassLabel('tinggi')).toBe('Tinggi');
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
