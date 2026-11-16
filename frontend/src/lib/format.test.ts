import { describe, expect, it } from 'vitest';

import { formatAreaKm2, formatCount, formatDecimal, levelLabel, parentPath } from './format';

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
