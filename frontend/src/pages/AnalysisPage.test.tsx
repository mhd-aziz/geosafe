import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchComposition, fetchRanking } from '../api/geosafe';
import type { CompositionData, RankingData } from '../types/geosafe';
import { AnalysisPage } from './AnalysisPage';

vi.mock('../api/geosafe', () => ({ fetchComposition: vi.fn(), fetchRanking: vi.fn() }));

const fetchCompositionMock = vi.mocked(fetchComposition);
const fetchRankingMock = vi.mocked(fetchRanking);

/** Angka nyata 2023: total kabupaten/kota = total provinsi = 256.222 titik panas. */
const COMPOSITION: CompositionData = {
  year: 2023,
  metric: 'hotspot_count',
  metric_name: 'Jumlah titik panas',
  unit: 'titik',
  province: {
    total: 256222,
    rows: [
      { province_code: '62', province_name: 'Kalimantan Tengah', value: 33437, share_pct: 13.05 },
      { province_code: '16', province_name: 'Sumatera Selatan', value: 29058, share_pct: 11.34 },
    ],
  },
  regency: {
    total: 256222,
    rows: [
      { region_code: '9301', region_name: 'Merauke', province_name: 'Papua Selatan', value: 22474, share_pct: 8.77 },
      { region_code: '1608', region_name: 'Ogan Komering Ilir', province_name: 'Sumatera Selatan', value: 17867, share_pct: 6.97 },
    ],
  },
  coverage: {
    first_observed_on: '2023-01-01',
    last_observed_on: '2023-12-31',
    days_covered: 365,
    days_in_year: 365,
    coverage_pct: 100,
    partial: false,
  },
  notes: ['titik panas satu wilayah adalah jumlah seri arsip main + fill'],
};

const RANKING: RankingData = {
  year: 2023,
  count: 2,
  coverage: {
    first_observed_on: '2023-01-01',
    last_observed_on: '2023-12-31',
    days_covered: 365,
    days_in_year: 365,
    coverage_pct: 100,
    partial: false,
  },
  regions: [
    {
      region_code: '9301',
      region_name: 'Merauke',
      region_type: 'REGENCY',
      province_code: '93',
      province_name: 'Papua Selatan',
      hotspot_count: 22474,
      hotspot_per_1000_km2: 128.03,
      event_count: null,
    },
    {
      region_code: '1608',
      region_name: 'Ogan Komering Ilir',
      region_type: 'REGENCY',
      province_code: '16',
      province_name: 'Sumatera Selatan',
      hotspot_count: 17867,
      hotspot_per_1000_km2: 41.2,
      event_count: 3,
    },
  ],
  notes: ['kepadatan titik panas adalah kepadatan deteksi, bukan ukuran kerawanan'],
};

beforeEach(() => {
  fetchCompositionMock.mockResolvedValue(COMPOSITION);
  fetchRankingMock.mockResolvedValue(RANKING);
});

describe('AnalysisPage', () => {
  it('memuat komposisi sepuluh provinsi dan sepuluh kabupaten/kota (`A2`)', async () => {
    render(<AnalysisPage />);

    const komposisi = await screen.findByLabelText('Komposisi wilayah');
    expect(within(komposisi).getByText('Sepuluh provinsi teratas')).toBeTruthy();
    expect(within(komposisi).getByText('Sepuluh kabupaten/kota teratas')).toBeTruthy();
    expect(within(komposisi).getByText('Kalimantan Tengah')).toBeTruthy();
    expect(within(komposisi).getByText(/Merauke/)).toBeTruthy();
  });

  it('menampilkan nilai, pangsa persen, dan total pembaginya (`SRS-F-52`)', async () => {
    render(<AnalysisPage />);

    const komposisi = await screen.findByLabelText('Komposisi wilayah');
    expect(within(komposisi).getByText('22.474')).toBeTruthy();
    expect(within(komposisi).getByText('8,77%')).toBeTruthy();
    expect(within(komposisi).getByText('13,05%')).toBeTruthy();
    expect(within(komposisi).getAllByText(/256.222/).length).toBeGreaterThan(0);
  });

  it('memuat tabel peringkat kabupaten/kota (`A3`)', async () => {
    render(<AnalysisPage />);

    const peringkat = await screen.findByLabelText('Peringkat kabupaten/kota');
    expect(within(peringkat).getByText(/Peringkat kabupaten\/kota/)).toBeTruthy();
    expect(within(peringkat).getByText('128,03')).toBeTruthy();
    expect(within(peringkat).getByText(/bukan ukuran kerawanan/)).toBeTruthy();
  });

  it('mengambil ulang komposisi saat metrik diganti ke kejadian (`SRS-F-51`)', async () => {
    render(<AnalysisPage />);
    await screen.findByLabelText('Komposisi wilayah');

    fireEvent.click(
      within(screen.getByRole('group', { name: 'Metrik komposisi' })).getByRole('button', {
        name: 'Kejadian',
      }),
    );

    expect(fetchCompositionMock).toHaveBeenLastCalledWith(2026, 'event_count');
  });

  it('mengambil ulang kedua bagian saat tahun diganti', async () => {
    render(<AnalysisPage />);
    await screen.findByLabelText('Komposisi wilayah');

    fireEvent.click(screen.getByRole('button', { name: '2023' }));

    expect(fetchCompositionMock).toHaveBeenLastCalledWith(2023, 'hotspot_count');
    expect(fetchRankingMock).toHaveBeenLastCalledWith(2023);
  });

  it('menandai tahun parsial di kedua bagian, dengan batas tanggal terukurnya', async () => {
    const partial = {
      first_observed_on: '2026-01-01',
      last_observed_on: '2026-07-31',
      days_covered: 212,
      days_in_year: 365,
      coverage_pct: 58.1,
      partial: true,
    };
    fetchCompositionMock.mockResolvedValue({ ...COMPOSITION, year: 2026, coverage: partial });
    fetchRankingMock.mockResolvedValue({ ...RANKING, year: 2026, coverage: partial });

    render(<AnalysisPage />);

    const banners = await screen.findAllByTestId('coverage-partial');
    expect(banners.length).toBe(2);
    expect(banners[0].textContent).toContain('2026-07-31');
    expect(banners[0].textContent).toContain('212 dari 365 hari');
    expect(within(banners[0]).getByText(/58,10% tahun/)).toBeTruthy();
  });

  it('menyebut kegagalan memuat komposisi apa adanya', async () => {
    fetchCompositionMock.mockRejectedValue(new Error('year harus 2020–2026'));
    render(<AnalysisPage />);

    expect(await screen.findByText(/Komposisi gagal dimuat: year harus 2020–2026/)).toBeTruthy();
  });
});
