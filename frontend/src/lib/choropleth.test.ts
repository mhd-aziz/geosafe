import { describe, expect, it } from 'vitest';

import {
  HOTSPOT_CLASSES,
  NO_FACT_COLOR,
  fillColorExpression,
  hotspotClassOf,
  legendEntries,
} from './choropleth';

describe('hotspotClassOf', () => {
  it('menempatkan nilai pada kelas dengan batas bawah inklusif', () => {
    expect(hotspotClassOf(0).label).toBe('0');
    expect(hotspotClassOf(1).label).toBe('1 – 25');
    expect(hotspotClassOf(25).label).toBe('1 – 25');
    expect(hotspotClassOf(26).label).toBe('26 – 100');
    expect(hotspotClassOf(101).label).toBe('101 – 500');
    expect(hotspotClassOf(501).label).toBe('501 – 2.000');
    expect(hotspotClassOf(2001).label).toBe('lebih dari 2.000');
  });
});

describe('legendEntries', () => {
  it('menyebut angka untuk setiap kelas, bukan hanya gradasi warna', () => {
    const entries = legendEntries();

    expect(entries).toHaveLength(HOTSPOT_CLASSES.length + 1);
    expect(entries.map((entry) => entry.label)).toContain('101 – 500');
    expect(entries.at(-1)).toEqual({
      label: 'tanpa baris fakta (jangan dibaca sebagai 0)',
      color: NO_FACT_COLOR,
    });
  });
});

describe('fillColorExpression', () => {
  it('memisahkan wilayah tanpa baris fakta dari kelas angka', () => {
    const expression = fillColorExpression();

    // Kumpulkan seluruh nilai string di dalam ekspresi bertingkat.
    const strings: string[] = [];
    const walk = (part: unknown): void => {
      if (typeof part === 'string') {
        strings.push(part);
      } else if (Array.isArray(part)) {
        part.forEach(walk);
      }
    };
    walk(expression);

    const colors = strings.filter((part) => part.startsWith('#'));
    expect(expression[0]).toBe('case');
    expect(colors).toContain(NO_FACT_COLOR);
    // satu warna per kelas angka, ditambah satu warna untuk has_fact = 0
    expect(new Set(colors).size).toBe(HOTSPOT_CLASSES.length + 1);
    expect(strings).toContain('has_fact');
  });
});
