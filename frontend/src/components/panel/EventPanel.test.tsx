import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { TrendData } from '../../types/geosafe';
import { EventPanel } from './EventPanel';

/** Angka nasional dari `/api/v1/analysis/national_trend` (2023 = 2.153 kejadian). */
const TREND: TrendData = {
  scope: 'national',
  years: [2022, 2023, 2024],
  hotspot_by_year: [],
  event_by_year: [
    { year: 2022, event_count: 272 },
    { year: 2023, event_count: 2153 },
    { year: 2024, event_count: 1016 },
  ],
  burned_area_by_year: [],
  coverage_by_year: {},
  units: {},
  metric_names: {},
  notes: [],
};

const READY = { status: 'ready' as const, data: TREND, error: null };

describe('EventPanel', () => {
  it('menyatakan peta memuat kejadian tercatat BNPB, bukan deteksi satelit (`SRS-F-30`)', () => {
    render(<EventPanel trend={READY} year={2023} />);

    expect(screen.getByText(/kejadian tercatat BNPB/)).toBeTruthy();
    expect(screen.getByText(/bukan deteksi satelit/)).toBeTruthy();
    expect(screen.getByText(/anomali termal dari satelit/)).toBeTruthy();
  });

  it('menampilkan jumlah kejadian nasional tahun terpilih sebagai pembanding (`SRS-F-31`)', () => {
    render(<EventPanel trend={READY} year={2023} />);

    expect(screen.getByText('Kejadian nasional 2023')).toBeTruthy();
    expect(screen.getByText('2.153')).toBeTruthy();
  });

  it('menandai angka 2026 sebagai angka berjalan', () => {
    render(<EventPanel trend={READY} year={2026} />);

    expect(screen.getByText(/angka berjalan sampai data terakhir/)).toBeTruthy();
  });

  it('menyebut kegagalan angka nasional apa adanya', () => {
    render(<EventPanel trend={{ status: 'error', data: null, error: 'gagal' }} year={2023} />);

    expect(screen.getByText(/Angka nasional gagal dimuat/)).toBeTruthy();
  });
});
