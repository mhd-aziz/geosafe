import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { fetchSources } from './api/geosafe';
import { App } from './App';

// Peta butuh WebGL dan tile jaringan; yang diuji di sini tata letak halaman,
// keterangan sumber, dan kendali tahun/tingkat — bukan penggambaran peta.
vi.mock('./components/map/MapView', () => ({
  MapView: () => <div data-testid="map-stub" />,
}));

vi.mock('./api/geosafe', () => ({
  fetchSources: vi.fn(),
  fetchRegionPanel: vi.fn(),
  searchRegions: vi.fn(),
}));

const fetchSourcesMock = vi.mocked(fetchSources);

describe('App', () => {
  it('menampilkan judul, peta, dan penyaring tahun', async () => {
    fetchSourcesMock.mockResolvedValue({ count: 1, sources: [] });
    render(<App />);

    expect(screen.getByRole('heading', { name: /Peta Titik Panas Karhutla/ })).toBeTruthy();
    expect(screen.getByTestId('map-stub')).toBeTruthy();
    expect(screen.getByLabelText('Tahun')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Kabupaten/Kota' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Provinsi' })).toBeTruthy();
    expect(screen.getByLabelText('Cari wilayah')).toBeTruthy();
    // prinsip yang tidak boleh hilang dari halaman: titik panas bukan kebakaran
    expect(screen.getByText(/Titik panas bukan kebakaran/)).toBeTruthy();
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
    render(<App />);

    expect(await screen.findByText(/Titik panas VIIRS\/MODIS/)).toBeTruthy();
    expect(screen.getByText(/Data sampai 2026-11-15, diakses 2026-11-16/)).toBeTruthy();
    expect(screen.getByText(/tidak sebanding dan tidak digambar/)).toBeTruthy();
    expect(screen.getAllByText('nrt').length).toBeGreaterThan(0);
  });

  it('tetap menampilkan halaman saat keterangan sumber gagal dimuat', async () => {
    fetchSourcesMock.mockRejectedValue(new Error('permintaan gagal (500)'));
    render(<App />);

    expect(await screen.findByText(/Keterangan sumber belum tersedia/)).toBeTruthy();
    expect(screen.getByTestId('map-stub')).toBeTruthy();
  });
});
