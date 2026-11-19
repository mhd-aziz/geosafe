import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { fetchVillagePanel } from '../../api/geosafe';
import type { VillagePanelData } from '../../types/geosafe';
import { VillageDetailPanel } from './VillageDetailPanel';

vi.mock('../../api/geosafe', () => ({ fetchVillagePanel: vi.fn() }));

const fetchVillagePanelMock = vi.mocked(fetchVillagePanel);

/** Angka Bukit Tunggal (6271012003) seperti di basis data: 2023 = 128 dari baris
 * tahunan (baris bulanannya 5/37/85/1 disaring API), 2025 tidak punya kejadian. */
const PANEL: VillagePanelData = {
  village: {
    village_code: '6271012003',
    village_name: 'Bukit Tunggal',
    district_code: '6271012',
    district_name: 'Jekan Raya',
    region_code: '6271',
    region_name: 'Kota Palangkaraya',
    province_code: '62',
    province_name: 'Kalimantan Tengah',
    area_km2: 274.18,
  },
  hotspot_by_year: [
    { year: 2022, series: 'main', hotspot_count: 0 },
    { year: 2023, series: 'main', hotspot_count: 128 },
    { year: 2026, series: 'main', hotspot_count: 21 },
  ],
  event_by_year: [
    { year: 2023, event_count: 4 },
    { year: 2026, event_count: 5 },
  ],
  risk_class_desa: 'tinggi',
  hotspot_per_1000_km2: 80.85,
  notes: [
    'kelas kerawanan desa adalah susunan penelitian ini, bukan kelas resmi BNPB',
    'angka 0 pada titik panas berarti nol deteksi yang terukur untuk tahun itu',
  ],
};

describe('VillageDetailPanel', () => {
  it('memuat rantai wilayah induk, kode, dan luas desa (`SRS-F-65`)', async () => {
    fetchVillagePanelMock.mockResolvedValue(PANEL);
    render(<VillageDetailPanel villageCode="6271012003" onClose={vi.fn()} />);

    expect(await screen.findByText('Bukit Tunggal')).toBeTruthy();
    expect(
      screen.getByText(/Jekan Raya · Kota Palangkaraya · Kalimantan Tengah · kode 6271012003/),
    ).toBeTruthy();
    expect(screen.getByText(/274,18 km²/)).toBeTruthy();
  });

  it('menyebut kelas kerawanan sebagai susunan penelitian, bukan kelas BNPB (`SRS-F-66`)', async () => {
    fetchVillagePanelMock.mockResolvedValue(PANEL);
    render(<VillageDetailPanel villageCode="6271012003" onClose={vi.fn()} />);

    expect(await screen.findByText('Tinggi')).toBeTruthy();
    expect(screen.getByText(/susunan penelitian, bukan BNPB/)).toBeTruthy();
    expect(screen.getByText(/bukan kelas resmi BNPB/)).toBeTruthy();
  });

  it('menampilkan titik panas per tahun dan membedakan nol terukur dari sel kosong', async () => {
    fetchVillagePanelMock.mockResolvedValue(PANEL);
    render(<VillageDetailPanel villageCode="6271012003" onClose={vi.fn()} />);

    expect(await screen.findByText('128')).toBeTruthy();
    expect(screen.getByText('21')).toBeTruthy();
    // 2022 nol terukur: tampil sebagai "0", bukan "—".
    expect(screen.getByText('0')).toBeTruthy();
    expect(screen.getByText('80,85 per 1.000 km²')).toBeTruthy();
  });

  it('memuat kejadian per tahun yang ada saja', async () => {
    fetchVillagePanelMock.mockResolvedValue(PANEL);
    render(<VillageDetailPanel villageCode="6271012003" onClose={vi.fn()} />);

    expect(await screen.findByText('Kejadian karhutla per tahun')).toBeTruthy();
    expect(screen.getByText('4')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
  });

  it('menyatakan desa tanpa baris kejadian apa adanya, bukan nol kejadian', async () => {
    fetchVillagePanelMock.mockResolvedValue({ ...PANEL, event_by_year: [], notes: [] });
    render(<VillageDetailPanel villageCode="6112080011" onClose={vi.fn()} />);

    expect(await screen.findByText(/tidak punya baris kejadian pada 2020–2026/)).toBeTruthy();
    expect(screen.getByText(/bukan berarti nol kejadian/)).toBeTruthy();
  });

  it('menyebut kegagalan memuat panel desa apa adanya', async () => {
    fetchVillagePanelMock.mockRejectedValue(new Error('desa 9999999999 tidak ada'));
    render(<VillageDetailPanel villageCode="9999999999" onClose={vi.fn()} />);

    expect(await screen.findByText(/desa 9999999999 tidak ada/)).toBeTruthy();
  });
});
