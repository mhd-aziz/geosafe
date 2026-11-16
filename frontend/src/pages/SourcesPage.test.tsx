import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { fetchDownloads, fetchPointCoverage, fetchSources } from '../api/geosafe';
import { SourcesPage } from './SourcesPage';

vi.mock('../api/geosafe', () => ({
  fetchSources: vi.fn(),
  fetchPointCoverage: vi.fn(),
  fetchDownloads: vi.fn(),
  downloadFileUrl: (name: string) => `/api/v1/downloads/${name}`,
}));

const fetchSourcesMock = vi.mocked(fetchSources);
const fetchCoverageMock = vi.mocked(fetchPointCoverage);
const fetchDownloadsMock = vi.mocked(fetchDownloads);

function mockAll() {
  fetchSourcesMock.mockResolvedValue({
    count: 1,
    sources: [
      {
        source_code: 'FIRMS',
        source_name: 'Titik panas VIIRS/MODIS (arsip + NRT)',
        institution: 'NASA FIRMS',
        source_url: 'https://firms.modaps.eosdis.nasa.gov/',
        accessed_on: '2026-11-16',
        data_until: '2026-11-12',
        row_count: 1452263,
      },
    ],
  });
  fetchCoverageMock.mockResolvedValue({
    year: null,
    totals: {
      point_count: 1452263,
      placed_count: 1345463,
      outside_count: 106800,
      outside_share_percent: 7.35,
    },
    by_year: [
      { year: 2023, point_count: 273291, placed_count: 255520, outside_count: 17771, series: {} },
    ],
    notes: ['penempatan dihitung terhadap geometri wilayah yang terpasang di basis data ini'],
  });
  fetchDownloadsMock.mockResolvedValue({
    count: 1,
    folder: 'tabel',
    files: [{ file_name: 'panel_kabupaten_kota.csv', size_bytes: 63880 }],
    notes: [],
  });
}

describe('SourcesPage', () => {
  it('mendaftar sumber data beserta institusi, tanggal akses, dan jumlah baris', async () => {
    mockAll();
    render(<SourcesPage />);

    expect(await screen.findByText('Titik panas VIIRS/MODIS (arsip + NRT)')).toBeTruthy();
    expect(screen.getByText('NASA FIRMS')).toBeTruthy();
    expect(screen.getByText('2026-11-16')).toBeTruthy();
    expect(screen.getByText('1.452.263')).toBeTruthy();
  });

  it('menyatakan jumlah titik panas di luar poligon wilayah', async () => {
    mockAll();
    render(<SourcesPage />);

    expect(await screen.findByText(/106.800 dari 1.452.263 titik panas/)).toBeTruthy();
    expect(screen.getByText(/7,35 %/)).toBeTruthy();
    expect(screen.getByText(/tidak dihapus dan tidak dihitung nol/)).toBeTruthy();
  });

  it('menampilkan tujuh celah data permanen', async () => {
    mockAll();
    render(<SourcesPage />);

    expect(
      await screen.findByText(/Kelas kerawanan desa resmi untuk karhutla tidak ada/),
    ).toBeTruthy();
    const celah = screen.getByRole('heading', { name: /Tujuh celah data/ });
    expect(celah).toBeTruthy();
    const daftar = celah.parentElement?.querySelectorAll('li') ?? [];
    expect(daftar.length).toBe(7);
  });

  it('menyediakan tautan unduh untuk setiap tabel siap pakai', async () => {
    mockAll();
    render(<SourcesPage />);

    const tautan = await screen.findByRole('link', { name: 'panel_kabupaten_kota.csv' });
    expect(tautan.getAttribute('href')).toBe('/api/v1/downloads/panel_kabupaten_kota.csv');
    expect(screen.getByText('62,4 kB')).toBeTruthy();
  });

  it('membedakan istilah titik panas, karhutla, kerawanan, dan IRBI', async () => {
    mockAll();
    render(<SourcesPage />);

    expect(await screen.findByText('titik panas (hotspot)')).toBeTruthy();
    expect(screen.getByText('kebakaran hutan dan lahan (karhutla)')).toBeTruthy();
    expect(screen.getByText('IRBI (Indeks Risiko Bencana Indonesia)')).toBeTruthy();
    expect(screen.getAllByText('kerawanan').length).toBeGreaterThan(0);
    expect(screen.getByText(/penilaian seberapa mudah suatu wilayah terbakar/)).toBeTruthy();
    expect(screen.getByText(/disusun proyek ini dari kombinasi titik panas/)).toBeTruthy();
  });

  it('menyebut sebab selisih angka antar tingkat wilayah', async () => {
    mockAll();
    render(<SourcesPage />);

    expect(await screen.findByText(/Selisih angka nasional, provinsi, dan kabupaten\/kota/)).toBeTruthy();
  });

  it('menyebut kegagalan memuat sumber apa adanya', async () => {
    mockAll();
    fetchSourcesMock.mockRejectedValue(new Error('permintaan gagal (500)'));
    render(<SourcesPage />);

    expect(await screen.findByText(/permintaan gagal \(500\)/)).toBeTruthy();
  });
});
