import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { searchRegions } from '../../api/geosafe';
import type { SearchResponse } from '../../types/geosafe';
import { SearchBox } from './SearchBox';

vi.mock('../../api/geosafe', () => ({ searchRegions: vi.fn() }));

const searchRegionsMock = vi.mocked(searchRegions);

/** Dua wilayah bernama kembar dalam satu provinsi (`SRS-F-69`). */
const TWIN_RESPONSE: SearchResponse = {
  query: 'bogor',
  limit: 20,
  count: 2,
  results: [
    {
      level: 'regency',
      code: '3201',
      name: 'Bogor',
      region_type: 'REGENCY',
      parent_code: '32',
      parent_name: 'Jawa Barat',
      province_code: '32',
      province_name: 'Jawa Barat',
      latitude: -6.5,
      longitude: 106.8,
      has_geometry: 1,
      bbox: [106.1, -7.1, 107.5, -6.0],
    },
    {
      level: 'regency',
      code: '3271',
      name: 'Kota Bogor',
      region_type: 'CITY',
      parent_code: '32',
      parent_name: 'Jawa Barat',
      province_code: '32',
      province_name: 'Jawa Barat',
      latitude: -6.6,
      longitude: 106.8,
      has_geometry: 1,
      bbox: [106.7, -6.7, 106.9, -6.5],
    },
  ],
  notes: [],
};

const NOTE_TEXT =
  'kata kunci "zzqqxx" tidak menemukan wilayah pada empat tingkat (provinsi, kabupaten/kota, kecamatan, desa/kelurahan)';

function renderSearchBox(onSelect = vi.fn()) {
  render(<SearchBox onSelect={onSelect} debounceMs={0} />);
  return onSelect;
}

describe('SearchBox', () => {
  it('menampilkan nama kembar dengan jenis wilayah dan provinsinya', async () => {
    searchRegionsMock.mockResolvedValue(TWIN_RESPONSE);
    renderSearchBox();

    fireEvent.change(screen.getByLabelText('Cari wilayah'), { target: { value: 'bogor' } });

    expect(await screen.findByText('Bogor')).toBeTruthy();
    expect(screen.getByText('Kota Bogor')).toBeTruthy();
    expect(screen.getAllByText('Kabupaten')).toHaveLength(1);
    expect(screen.getAllByText('Kota')).toHaveLength(1);
    // jejak wilayah induk: nama provinsi tampil pada setiap baris hasil
    expect(screen.getAllByText(/Jawa Barat/)).toHaveLength(2);
    expect(searchRegionsMock).toHaveBeenCalledWith('bogor');
  });

  it('menyerahkan wilayah yang dipilih beserta kodenya', async () => {
    searchRegionsMock.mockResolvedValue(TWIN_RESPONSE);
    const onSelect = renderSearchBox();

    fireEvent.change(screen.getByLabelText('Cari wilayah'), { target: { value: 'bogor' } });
    fireEvent.click(await screen.findByText('Kota Bogor'));

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ code: '3271', level: 'regency' }));
  });

  it('menyebut sebab kata kunci tidak menemukan wilayah, bukan hanya kosong', async () => {
    searchRegionsMock.mockResolvedValue({
      query: 'zzqqxx',
      limit: 20,
      count: 0,
      results: [],
      notes: [NOTE_TEXT],
    });
    renderSearchBox();

    fireEvent.change(screen.getByLabelText('Cari wilayah'), { target: { value: 'zzqqxx' } });

    expect(await screen.findByText('Tidak ada wilayah yang cocok.')).toBeTruthy();
    expect(screen.getByText(/tidak menemukan wilayah pada empat tingkat/)).toBeTruthy();
  });

  it('meminta kata kunci minimal dua huruf sebelum memanggil API', async () => {
    searchRegionsMock.mockResolvedValue(TWIN_RESPONSE);
    renderSearchBox();

    fireEvent.change(screen.getByLabelText('Cari wilayah'), { target: { value: 'b' } });

    expect(await screen.findByText(/Ketik minimal 2 huruf/)).toBeTruthy();
    expect(searchRegionsMock).not.toHaveBeenCalled();
  });

  it('menampilkan galat pencarian apa adanya', async () => {
    searchRegionsMock.mockRejectedValue(new Error('permintaan gagal (500)'));
    renderSearchBox();

    fireEvent.change(screen.getByLabelText('Cari wilayah'), { target: { value: 'sido' } });

    expect(await screen.findByText(/permintaan gagal \(500\)/)).toBeTruthy();
  });
});
