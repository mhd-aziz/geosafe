import { describe, expect, it } from 'vitest';

import { formatAreaKm2, bboxParam, formatCount, formatDecimal, levelLabel, parentPath } from './format';

describe('bboxParam', () => {
  it('menulis empat batas berurutan min_lon,min_lat,max_lon,max_lat', () => {
    // Urutan ini yang diterima API; tertukar berarti 422 atau kotak yang salah.
    expect(bboxParam([95, -11, 141, 6])).toBe('95,-11,141,6');
  });

  it('membulatkan ke empat desimal supaya URL tidak berubah setiap piksel', () => {
    expect(bboxParam([95.123456789, -10.987654321, 140.99999, 5.500000049])).toBe(
      '95.1235,-10.9877,141,5.5',
    );
  });

  it('memotong kotak peta ke batas wilayah Indonesia (`API-P2` bagian 1)', () => {
    // Zoom nasional: peta menampilkan jauh lebih luas daripada Indonesia, dan API
    // menolak bbox di luar 94,5…141,5 / -11,5…6,5 — kasus yang persis memicu
    // `truncated`, jadi tanpa potongan ini tombolnya selalu berakhir 422.
    expect(bboxParam([79.1695, -24.064, 156.8305, 19.4199])).toBe('94.5,-11.5,141.5,6.5');
  });

  it('mengembalikan null bila kotak peta seluruhnya di luar Indonesia', () => {
    expect(bboxParam([0, 0, 20, 20])).toBeNull();
    expect(bboxParam([100, 30, 120, 40])).toBeNull();
  });
});

describe('formatCount', () => {
  it('memakai pemisah ribuan gaya Indonesia', () => {
    expect(formatCount(253127)).toBe('253.127');
    expect(formatCount(0)).toBe('0');
  });

  it('menampilkan nilai kosong sebagai tanda pisah, bukan nol', () => {
    expect(formatCount(null)).toBe('—');
    expect(formatCount(undefined)).toBe('—');
  });
});

describe('formatDecimal', () => {
  it('memakai koma sebagai pemisah desimal', () => {
    expect(formatDecimal(170481.94)).toBe('170.481,94');
    expect(formatDecimal(null)).toBe('—');
  });
});

describe('formatAreaKm2', () => {
  it('menyertakan satuan', () => {
    expect(formatAreaKm2(45986.5)).toBe('45.986,50 km²');
    expect(formatAreaKm2(null)).toBe('—');
  });
});

describe('levelLabel', () => {
  it('membedakan kabupaten dan kota, dan menerjemahkan tingkat lain', () => {
    expect(levelLabel('regency', 'REGENCY')).toBe('Kabupaten');
    expect(levelLabel('regency', 'CITY')).toBe('Kota');
    expect(levelLabel('district', null)).toBe('Kecamatan');
    expect(levelLabel('village', null)).toBe('Desa/Kelurahan');
    expect(levelLabel('province', null)).toBe('Provinsi');
  });
});

describe('parentPath', () => {
  it('menyusun jejak wilayah induk dari yang terdekat', () => {
    expect(parentPath('Jawa Barat', 'Bogor')).toBe('Bogor · Jawa Barat');
    expect(parentPath('Jawa Barat', null)).toBe('Jawa Barat');
    expect(parentPath(null, null)).toBe('');
  });

  it('tidak mengulang nama yang sama untuk kabupaten/kota', () => {
    // Kabupaten/kota: wilayah induknya memang provinsi itu sendiri.
    expect(parentPath('Papua Selatan', 'Papua Selatan')).toBe('Papua Selatan');
  });
});
