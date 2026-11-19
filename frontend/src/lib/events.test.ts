import { describe, expect, it } from 'vitest';

import {
  EVENT_CLASSES,
  NO_EVENT_LABEL,
  eventClassOf,
  eventFillColorExpression,
  eventLegendEntries,
} from './events';

describe('kelas kejadian (P3)', () => {
  it('menempatkan nilai pada kelas yang benar dan nol bukan kelas', () => {
    expect(eventClassOf(0)).toBeNull();
    expect(eventClassOf(1)?.label).toBe('1');
    expect(eventClassOf(5)?.label).toBe('2 – 5');
    expect(eventClassOf(6)?.label).toBe('6 – 20');
    expect(eventClassOf(21)?.label).toBe('21 – 50');
    // Kota Banjarbaru 2023 = 79 kejadian: kelas teratas.
    expect(eventClassOf(79)?.label).toBe('lebih dari 50');
  });

  it('legenda memuat semua kelas lalu penanda tanpa kejadian', () => {
    const entries = eventLegendEntries();

    expect(entries).toHaveLength(EVENT_CLASSES.length + 1);
    expect(entries.at(-1)?.label).toBe(NO_EVENT_LABEL);
  });

  it('ekspresi warna memisahkan has_fact 0 dari kelas angka', () => {
    const expression = eventFillColorExpression() as unknown as (string | number)[];

    expect(expression[0]).toBe('case');
    expect(JSON.stringify(expression)).toContain('has_fact');
    expect(JSON.stringify(expression)).toContain('event_count');
    // Warna kelas teratas ikut jadi stop terakhir.
    expect(JSON.stringify(expression)).toContain(EVENT_CLASSES.at(-1)?.color);
  });
});
