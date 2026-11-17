import { describe, expect, it } from 'vitest';

import { readoutText, thematicSpec } from './thematic-layer';

describe('thematicSpec', () => {
  it('memisahkan layer titik panas dan kerawanan supaya tidak bertumpuk', () => {
    const hotspot = thematicSpec('hotspot', 'regency', 2026, 'a');
    const risk = thematicSpec('risk', 'regency', 2026, 'a');

    expect(hotspot.url).toBe('/tiles/regions/{z}/{x}/{y}.mvt?year=2026');
    expect(hotspot.sourceLayer).toBe('regions');
    expect(risk.url).toBe('/tiles/risk/{z}/{x}/{y}.mvt?scheme=a');
    expect(risk.sourceLayer).toBe('risk');

    // Semua nama sumber/layer berbeda: kalau sama, perpindahan lapisan bisa
    // meninggalkan poligon lama di bawah poligon baru tanpa galat apa pun.
    const ids = [hotspot, risk].flatMap((spec) => [spec.sourceId, spec.fillLayerId, spec.lineLayerId]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('membawa skema pada URL kerawanan dan tahun pada URL titik panas', () => {
    expect(thematicSpec('risk', 'regency', 2026, 'c').url).toContain('scheme=c');
    expect(thematicSpec('hotspot', 'province', 2021, 'a').url).toBe(
      '/tiles/provinces/{z}/{x}/{y}.mvt?year=2021',
    );
    expect(thematicSpec('hotspot', 'province', 2021, 'a').sourceLayer).toBe('provinces');
  });
});

describe('readoutText', () => {
  it('menampilkan skor dan kelas kerawanan, bukan hanya namanya', () => {
    const text = readoutText('risk', 'regency', 2026, {
      region_name: 'Kutai Timur',
      risk_score: 97.77,
      risk_class: 'tinggi',
      has_score: 1,
    });

    expect(text).toBe('Kutai Timur · skor 97,77 · Tinggi');
  });

  it('menyebut kelas yang tidak dikenal apa adanya', () => {
    expect(
      readoutText('risk', 'regency', 2026, {
        region_name: 'Contoh',
        risk_score: 50,
        risk_class: 'sangat tinggi',
        has_score: 1,
      }),
    ).toBe('Contoh · skor 50,00 · sangat tinggi');
  });

  it('membedakan wilayah tanpa skor dari kerawanan rendah', () => {
    expect(
      readoutText('risk', 'regency', 2026, { region_name: 'Contoh', has_score: 0 }),
    ).toBe('Contoh · skor kerawanan belum ada');
  });

  it('memakai nama provinsi dan menyebut tahun pada lapisan titik panas', () => {
    expect(
      readoutText('hotspot', 'province', 2023, {
        province_name: 'PAPUA SELATAN',
        hotspot_count: 1204,
        has_fact: 1,
      }),
    ).toBe('PAPUA SELATAN · 1.204 titik panas 2023');
  });

  it('menyatakan wilayah tanpa baris fakta, bukan angka nol', () => {
    expect(
      readoutText('hotspot', 'regency', 2020, { region_name: 'Contoh', has_fact: 0 }),
    ).toBe('Contoh · belum ada baris fakta 2020');
  });
});
