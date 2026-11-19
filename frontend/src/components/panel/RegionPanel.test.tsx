import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { fetchRegionPanel } from '../../api/geosafe';
import type { RegionPanelData } from '../../types/geosafe';
import { RegionPanel } from './RegionPanel';

vi.mock('../../api/geosafe', () => ({ fetchRegionPanel: vi.fn() }));

const fetchRegionPanelMock = vi.mocked(fetchRegionPanel);

/** Angka Merauke seperti di basis data setelah data dibangun ulang 2026-11-19:
 * 2026 hanya seri arsip (main + fill), NRT tidak masuk tabel tahunan. */
const PANEL: RegionPanelData = {
  region: {
    region_code: '9301',
    region_name: 'Merauke',
    region_type: 'REGENCY',
    province_code: '93',
    province_name: 'Papua Selatan',
    area_km2: 45986.5,
  },
  hotspot_by_year: [
    { year: 2026, series: 'main', hotspot_count: 4581 },
    { year: 2026, series: 'fill', hotspot_count: 627 },
  ],
  event_by_year: [{ year: 2026, event_count: 12 }],
  emergency_2025: { emergency_sk_karhutla_2025: 0, emergency_sk_mentions_2025: 1 },
  irbi_2025: { irbi_score: 30.53, irbi_class: 'Sedang' },
  irbi_karhutla_by_year: [
    { year: 2025, irbi_karhutla_score: 29.17, irbi_karhutla_class: 'Sedang' },
  ],
  hotspot_per_1000_km2: 147.38,
  risk: {
    default_scheme: 'a',
    risk_score_a: 73.88,
    risk_class_a: 'tinggi',
    risk_score_b: 71.84,
    risk_class_b: 'tinggi',
    risk_score_c: 66.61,
    risk_class_c: 'sedang',
  },
  notes: [
    'seri nrt tahun 2026 berasal dari pemrosesan berbeda dan tidak sebanding dengan seri arsip (main)',
  ],
};

describe('RegionPanel', () => {
  it('memuat identitas wilayah dan luasnya', async () => {
    fetchRegionPanelMock.mockResolvedValue(PANEL);
    render(<RegionPanel regionCode="9301" onClose={vi.fn()} />);

    expect(await screen.findByText('Merauke')).toBeTruthy();
    expect(screen.getByText(/Papua Selatan/)).toBeTruthy();
    expect(screen.getByText(/45.986,50 km²/)).toBeTruthy();
  });

  it('mengirim seri titik panas terpisah, tidak digabung menjadi satu angka', async () => {
    fetchRegionPanelMock.mockResolvedValue(PANEL);
    render(<RegionPanel regionCode="9301" onClose={vi.fn()} />);

    expect(await screen.findByText('4.581')).toBeTruthy(); // main
    expect(screen.getByText('627')).toBeTruthy(); // fill
    expect(screen.queryByText('5.208')).toBeNull(); // jumlah campuran yang dilarang
    expect(screen.queryByText('nrt')).toBeNull(); // NRT tidak ada di tabel tahunan
  });

  it('memuat kejadian, status darurat, IRBI, dan skor kerawanan skema peta', async () => {
    fetchRegionPanelMock.mockResolvedValue(PANEL);
    render(<RegionPanel regionCode="9301" onClose={vi.fn()} />);

    expect(await screen.findByText('Kejadian karhutla per tahun')).toBeTruthy();
    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText('147,38 per 1.000 km²')).toBeTruthy();
    expect(screen.getByText(/rata-rata 2020–2025/)).toBeTruthy();
    expect(screen.getByText(/73,88 · Tinggi/)).toBeTruthy();
    expect(screen.getByText(/skema a/)).toBeTruthy();
    expect(screen.getByText(/30,53 · Sedang/)).toBeTruthy();
  });

  it('menampilkan catatan batasan data dari API', async () => {
    fetchRegionPanelMock.mockResolvedValue(PANEL);
    render(<RegionPanel regionCode="9301" onClose={vi.fn()} />);

    expect(await screen.findByText(/tidak sebanding dengan seri arsip/)).toBeTruthy();
  });

  it('menyebut kegagalan memuat panel apa adanya', async () => {
    fetchRegionPanelMock.mockRejectedValue(new Error('wilayah 9999 tidak ada'));
    render(<RegionPanel regionCode="9999" onClose={vi.fn()} />);

    expect(await screen.findByText(/wilayah 9999 tidak ada/)).toBeTruthy();
  });
});
