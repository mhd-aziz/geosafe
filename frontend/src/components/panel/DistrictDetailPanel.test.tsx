import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { fetchDistrictPanel } from '../../api/geosafe';
import type { DistrictPanelData } from '../../types/geosafe';
import { DistrictDetailPanel } from './DistrictDetailPanel';

vi.mock('../../api/geosafe', () => ({ fetchDistrictPanel: vi.fn() }));

const fetchDistrictPanelMock = vi.mocked(fetchDistrictPanel);

/** Angka Jekan Raya (6271012) seperti di basis data: 2023 = 293 dari baris tahunan
 * (baris bulanannya 57/81/154/1 disaring API), kepadatan 129,88 per 1.000 km². */
const PANEL: DistrictPanelData = {
  district: {
    district_code: '6271012',
    district_name: 'Jekan Raya',
    region_code: '6271',
    region_name: 'Kota Palangkaraya',
    province_code: '62',
    province_name: 'Kalimantan Tengah',
    area_km2: 387.55,
  },
  hotspot_by_year: [
    { year: 2020, series: 'main', hotspot_count: 2 },
    { year: 2023, series: 'main', hotspot_count: 293 },
    { year: 2026, series: 'main', hotspot_count: 24 },
  ],
  event_by_year: [{ year: 2023, event_count: 5 }],
  hotspot_per_1000_km2: 129.88,
  notes: [
    'angka kecamatan bersifat pendukung, bukan unit analisis penelitian ini (unit analisisnya 514 kabupaten/kota)',
    'angka 0 pada titik panas berarti nol deteksi yang terukur untuk tahun itu',
  ],
};

describe('DistrictDetailPanel', () => {
  it('memuat rantai wilayah induk, kode, dan luas kecamatan (`SRS-F-63`)', async () => {
    fetchDistrictPanelMock.mockResolvedValue(PANEL);
    render(<DistrictDetailPanel districtCode="6271012" onClose={vi.fn()} />);

    expect(await screen.findByText('Jekan Raya')).toBeTruthy();
    expect(
      screen.getByText(/Kota Palangkaraya · Kalimantan Tengah · kode 6271012/),
    ).toBeTruthy();
    expect(screen.getByText(/387,55 km²/)).toBeTruthy();
  });

  it('menyatakan angka kecamatan sebagai pendukung, bukan unit analisis (`SRS-F-64`)', async () => {
    fetchDistrictPanelMock.mockResolvedValue(PANEL);
    render(<DistrictDetailPanel districtCode="6271012" onClose={vi.fn()} />);

    // Keterangan ini wajib terbaca di panelnya sendiri, bukan hanya di catatan bawah;
    // karena itu ia muncul dua kali (panel + catatan), dan yang diperiksa yang pertama.
    expect(
      await screen.findByText(
        /^Angka kecamatan bersifat pendukung, bukan unit analisis penelitian ini — unit analisisnya 514 kabupaten\/kota\./,
      ),
    ).toBeTruthy();
  });

  it('menampilkan titik panas per tahun sekali per tahun dan kepadatannya', async () => {
    fetchDistrictPanelMock.mockResolvedValue(PANEL);
    render(<DistrictDetailPanel districtCode="6271012" onClose={vi.fn()} />);

    expect(await screen.findByText('293')).toBeTruthy();
    expect(screen.getByText('24')).toBeTruthy();
    expect(screen.getByText('129,88 per 1.000 km²')).toBeTruthy();
  });

  it('memuat kejadian per tahun yang ada saja', async () => {
    fetchDistrictPanelMock.mockResolvedValue(PANEL);
    render(<DistrictDetailPanel districtCode="6271012" onClose={vi.fn()} />);

    expect(await screen.findByText('Kejadian karhutla per tahun')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
  });

  it('menyatakan kecamatan tanpa baris kejadian apa adanya, bukan nol kejadian', async () => {
    fetchDistrictPanelMock.mockResolvedValue({ ...PANEL, event_by_year: [], notes: [] });
    render(<DistrictDetailPanel districtCode="6271021" onClose={vi.fn()} />);

    expect(await screen.findByText(/tidak punya baris kejadian pada 2020–2026/)).toBeTruthy();
    expect(screen.getByText(/bukan berarti nol kejadian/)).toBeTruthy();
  });

  it('menyebut kegagalan memuat panel kecamatan apa adanya', async () => {
    fetchDistrictPanelMock.mockRejectedValue(new Error('kecamatan 9999999 tidak ada'));
    render(<DistrictDetailPanel districtCode="9999999" onClose={vi.fn()} />);

    expect(await screen.findByText(/kecamatan 9999999 tidak ada/)).toBeTruthy();
  });
});
