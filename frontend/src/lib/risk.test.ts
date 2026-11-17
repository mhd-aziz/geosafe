import { describe, expect, it } from 'vitest';

import {
  NO_SCORE_COLOR,
  NO_VILLAGE_CLASS_LABEL,
  RISK_CLASSES,
  VILLAGE_RISK_CLASSES,
  VILLAGE_SOURCE_LAYER,
  riskClassLabel,
  riskFillColorExpression,
  riskLegendEntries,
  villageLegendEntries,
  villageRiskClassLabel,
  villageRiskFillColorExpression,
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

describe('kelas kerawanan desa', () => {
  it('memakai empat kelas dengan warna masing-masing, di luar tangga kabupaten/kota', () => {
    // Matriks, bukan keanggotaan daftar: menukar warna antar kelas tetap lolos
    // kalau yang diperiksa hanya "warna ada di daftar".
    const pairs = VILLAGE_RISK_CLASSES.map((item) => [item.value, item.color]);
    expect(pairs).toEqual([
      ['tinggi', '#993404'],
      ['sedang', '#fe9929'],
      ['rendah', '#fee391'],
      ['tidak_ada_deteksi', '#bdd7ee'],
    ]);
    // Kelas tanpa deteksi tidak boleh memakai warna kelas rendah, supaya peta
    // tidak membacanya sebagai kerawanan rendah (`SRS-F-39`).
    const rendah = VILLAGE_RISK_CLASSES.find((item) => item.value === 'rendah');
    const tanpaDeteksi = VILLAGE_RISK_CLASSES.find((item) => item.value === 'tidak_ada_deteksi');
    expect(tanpaDeteksi?.color).not.toBe(rendah?.color);
    expect(tanpaDeteksi?.label).toContain('bukan rendah');
    expect(VILLAGE_SOURCE_LAYER).toBe('risk_villages');
  });

  it('menyebut kelas desa tak dikenal apa adanya', () => {
    expect(villageRiskClassLabel('tidak_ada_deteksi')).toBe('Tidak ada deteksi (bukan rendah)');
    expect(villageRiskClassLabel('sangat tinggi')).toBe('sangat tinggi');
    expect(villageRiskClassLabel(null)).toBe('kelas tidak diketahui');
  });

  it('memuat jumlah desa pada legenda bila angkanya tersedia', () => {
    const entries = villageLegendEntries({
      rendah: 8_881,
      sedang: 24_293,
      tinggi: 6_388,
      tidak_ada_deteksi: 43_753,
    });

    expect(entries).toHaveLength(5);
    expect(entries[0].label).toBe('Tinggi · 6.388 desa');
    expect(entries[3].label).toBe('Tidak ada deteksi (bukan rendah) · 43.753 desa');
    expect(entries[4]).toEqual({ label: NO_VILLAGE_CLASS_LABEL, color: NO_SCORE_COLOR });
  });

  it('memisahkan desa tanpa kelas dari kelas apa pun di ekspresi warna', () => {
    const expression = villageRiskFillColorExpression();
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
    for (const villageClass of VILLAGE_RISK_CLASSES) {
      expect(strings).toContain(villageClass.value);
      expect(strings).toContain(villageClass.color);
    }
    expect(strings.filter((part) => part === NO_SCORE_COLOR).length).toBeGreaterThanOrEqual(2);
  });
});
