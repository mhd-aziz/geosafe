import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchNationalTrend, fetchSources } from '../api/geosafe';
import type { TrendData } from '../types/geosafe';
import { TrendPage } from './TrendPage';

vi.mock('../api/geosafe', () => ({ fetchNationalTrend: vi.fn(), fetchSources: vi.fn() }));

const fetchTrendMock = vi.mocked(fetchNationalTrend);
const fetchSourcesMock = vi.mocked(fetchSources);

beforeEach(() => {
  fetchSourcesMock.mockResolvedValue({
    count: 1,
    sources: [
      {
        source_code: 'FIRMS',
        source_name: 'Titik panas VIIRS/MODIS (arsip + NRT)',
        institution: 'NASA FIRMS',
        source_url: 'https://firms.modaps.eosdis.nasa.gov/',
        accessed_on: '2026-11-18',
        data_until: '2026-07-31',
        row_count: 918319,
      },
    ],
  });
});

/** Angka nyata dari basis data setelah bangun ulang 2026-11-19: tabel tahunan
 * tidak memuat seri `nrt` (`nrt` selalu `null`). */
const TREND: TrendData = {
  scope: 'national',
  years: [2020, 2021, 2022, 2023, 2024, 2025, 2026],
  hotspot_by_year: [
    { year: 2020, series: { main: 91401 }, archive_total: 91401, nrt: null },
    { year: 2023, series: { main: 253345, fill: 2877 }, archive_total: 256222, nrt: null },
    { year: 2026, series: { main: 54084, fill: 7093 }, archive_total: 61177, nrt: null },
  ],
  event_by_year: [
    { year: 2020, event_count: 618 },
    { year: 2023, event_count: 2153 },
    { year: 2026, event_count: 1110 },
  ],
  burned_area_by_year: [
    { year: 2020, burned_area_ha: 170481.94 },
    { year: 2023, burned_area_ha: 1110064.36 },
  ],
  units: { hotspot_count: 'titik', event_count: 'kejadian', burned_area_ha: 'hektar' },
  metric_names: { hotspot_count: 'Jumlah titik panas' },
  notes: [
    'titik panas dan kejadian memakai alat ukur berbeda: … tidak boleh dijumlahkan dan digambar pada dua sumbu terpisah',
    'luas terbakar nasional (GWIS) hanya konteks, bukan seri ketiga data penelitian',
  ],
};

describe('TrendPage', () => {
  it('menggambar dua seri pada dua sumbu terpisah', async () => {
    fetchTrendMock.mockResolvedValue(TREND);
    render(<TrendPage />);

    const grafik = await screen.findByRole('img', {
      name: /jumlah titik panas \(sumbu kiri\) dan jumlah kejadian \(sumbu kanan\) pada dua sumbu terpisah/,
    });
    expect(grafik).toBeTruthy();

    expect(screen.getByText(/Titik panas — seri arsip \(main \+ fill\), sumbu kiri/)).toBeTruthy();
    expect(screen.getByText(/Kejadian karhutla \(BNPB\), sumbu kanan/)).toBeTruthy();
  });

  it('tidak lagi menampilkan kolom nrt karena tabel tahunan tidak memuatnya', async () => {
    fetchTrendMock.mockResolvedValue(TREND);
    render(<TrendPage />);

    const tabel = await screen.findByRole('table');
    expect(within(tabel).queryByText('nrt')).toBeNull();
    expect(within(tabel).queryByText(/600\.323/)).toBeNull();
    // keterangan menyebut di mana NRT hidup sekarang, bukan menyembunyikannya
    expect(screen.getByText(/hanya hidup di lapisan titik panas terkini/)).toBeTruthy();
  });

  it('menampilkan angka per tahun apa adanya', async () => {
    fetchTrendMock.mockResolvedValue(TREND);
    render(<TrendPage />);

    // dibatasi ke tabel: angka yang sama muncul juga sebagai label sumbu grafik
    const tabel = within(await screen.findByRole('table'));
    expect(tabel.getByText('253.345')).toBeTruthy(); // main 2023
    expect(tabel.getByText('2.877')).toBeTruthy(); // fill 2023
    expect(tabel.getByText('256.222')).toBeTruthy(); // arsip 2023 (main + fill)
    expect(tabel.getByText('2.153')).toBeTruthy(); // kejadian 2023
  });

  it('menyebut luas terbakar sebagai konteks yang berhenti di 2025', async () => {
    fetchTrendMock.mockResolvedValue(TREND);
    render(<TrendPage />);

    expect(
      await screen.findByText(/Hanya tersedia sampai 2025 dan hanya tingkat nasional/),
    ).toBeTruthy();
    expect(screen.getByText(/1.110.064,36 ha/)).toBeTruthy();
  });

  it('menampilkan catatan wajib dari API', async () => {
    fetchTrendMock.mockResolvedValue(TREND);
    render(<TrendPage />);

    expect(await screen.findByText(/tidak boleh dijumlahkan dan digambar pada dua sumbu/)).toBeTruthy();
  });

  it('menyebut tahun terakhir belum penuh karena data berhenti di tengah tahun', async () => {
    fetchTrendMock.mockResolvedValue(TREND);
    render(<TrendPage />);

    expect(
      await screen.findByText(/Tahun 2026 belum penuh: data titik panas berhenti pada 2026-07-31/),
    ).toBeTruthy();
  });

  it('menyebut kegagalan memuat tren apa adanya', async () => {
    fetchTrendMock.mockRejectedValue(new Error('permintaan gagal (500)'));
    render(<TrendPage />);

    expect(await screen.findByText(/permintaan gagal \(500\)/)).toBeTruthy();
  });
});
