import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { fetchDownloads, fetchPointCoverage, fetchSources } from './api/geosafe';
import { App } from './App';

// Peta butuh WebGL dan tile jaringan; yang diuji di sini tata letak halaman,
// navigasi, keterangan sumber, dan kendali tahun/tingkat — bukan penggambaran peta.
vi.mock('./components/map/MapView', () => ({
  MapView: () => <div data-testid="map-stub" />,
}));

vi.mock('./api/geosafe', () => ({
  fetchSources: vi.fn(),
  fetchRegionPanel: vi.fn(),
  searchRegions: vi.fn(),
  fetchPointCoverage: vi.fn(),
  fetchDownloads: vi.fn(),
  fetchNationalTrend: vi.fn(),
  downloadFileUrl: (name: string) => `/api/v1/downloads/${name}`,
}));

const fetchSourcesMock = vi.mocked(fetchSources);
const fetchPointCoverageMock = vi.mocked(fetchPointCoverage);
const fetchDownloadsMock = vi.mocked(fetchDownloads);

function renderApp(path = '/') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

function mockEmptyTransparency() {
  fetchPointCoverageMock.mockResolvedValue({
    year: null,
    totals: { point_count: 0, placed_count: 0, outside_count: 0, outside_share_percent: null },
    by_year: [],
    notes: [],
  });
  fetchDownloadsMock.mockResolvedValue({ count: 0, folder: 'tabel', files: [], notes: [] });
}

describe('App', () => {
  it('menampilkan judul, peta, dan penyaring tahun', async () => {
    fetchSourcesMock.mockResolvedValue({ count: 1, sources: [] });
    renderApp();

    expect(screen.getByRole('heading', { name: /Peta Titik Panas Karhutla/ })).toBeTruthy();
    expect(screen.getByTestId('map-stub')).toBeTruthy();
    expect(screen.getByLabelText('Tahun')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Kabupaten/Kota' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Provinsi' })).toBeTruthy();
    expect(screen.getByLabelText('Cari wilayah')).toBeTruthy();
    // prinsip yang tidak boleh hilang dari halaman: titik panas bukan kebakaran
    expect(screen.getByText(/Titik panas bukan kebakaran/)).toBeTruthy();
  });

  it('memuat navigasi tiga halaman', async () => {
    fetchSourcesMock.mockResolvedValue({ count: 1, sources: [] });
    renderApp();

    const nav = screen.getByRole('navigation', { name: 'Navigasi halaman' });
    expect(nav.textContent).toContain('Peta');
    expect(nav.textContent).toContain('Tren nasional');
    expect(nav.textContent).toContain('Sumber & Batas Data');
  });

  it('memuat halaman Sumber & Batas Data lewat rute /sumber', async () => {
    fetchSourcesMock.mockResolvedValue({ count: 1, sources: [] });
    mockEmptyTransparency();
    renderApp('/sumber');

    expect(await screen.findByRole('heading', { name: 'Sumber & Batas Data' })).toBeTruthy();
    // tujuh celah data wajib tampil, bukan hanya di laporan
    expect(screen.getByText(/Korban dan kerusakan karhutla praktis kosong/)).toBeTruthy();
    expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(7);
  });

  it('menyebut halaman tidak dikenal alih-alih halaman kosong', async () => {
    fetchSourcesMock.mockResolvedValue({ count: 1, sources: [] });
    renderApp('/tidak-ada');

    expect(await screen.findByText(/Halaman tidak ditemukan/)).toBeTruthy();
  });

  it('menyebut sumber titik panas dan tanggal pembaruan datanya', async () => {
    fetchSourcesMock.mockResolvedValue({
      count: 1,
      sources: [
        {
          source_code: 'FIRMS',
          source_name: 'Titik panas VIIRS/MODIS (arsip + NRT)',
          institution: 'NASA FIRMS',
          source_url: 'https://firms.modaps.eosdis.nasa.gov/',
          accessed_on: '2026-11-16',
          data_until: '2026-11-15',
          row_count: 1452263,
        },
      ],
    });
    renderApp();

    expect(await screen.findByText(/Titik panas VIIRS\/MODIS/)).toBeTruthy();
    expect(screen.getByText(/Data sampai 2026-11-15, diakses 2026-11-16/)).toBeTruthy();
    expect(screen.getByText(/tidak sebanding dan tidak digambar/)).toBeTruthy();
    expect(screen.getAllByText('nrt').length).toBeGreaterThan(0);
  });

  it('tetap menampilkan halaman saat keterangan sumber gagal dimuat', async () => {
    fetchSourcesMock.mockRejectedValue(new Error('permintaan gagal (500)'));
    renderApp();

    expect(await screen.findByText(/Keterangan sumber belum tersedia/)).toBeTruthy();
    expect(screen.getByTestId('map-stub')).toBeTruthy();
  });
});
