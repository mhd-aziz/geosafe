import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { EventPointsResponse } from '../../types/geosafe';
import { EventPointsPanel } from './EventPointsPanel';

const READY = {
  status: 'ready' as const,
  error: null,
  data: {
    year: 2023,
    count: 2153,
    coord_level_counts: { village: 637, district: 384, region: 1132 },
    points: [],
    notes: [
      'ketelitian koordinat 2023: region 1132 kejadian (titik pusat kabupaten/kota, paling kasar)',
      '1655 kejadian pada 2020–2026 tidak punya kode identitas BNPB',
    ],
  } satisfies EventPointsResponse,
};

describe('EventPointsPanel', () => {
  it('menampilkan jumlah titik tahun terpilih dan sebaran ketelitiannya (`SRS-F-41`)', () => {
    render(<EventPointsPanel state={READY} year={2023} />);

    expect(screen.getByText('Titik kejadian 2023')).toBeTruthy();
    expect(screen.getByText('2.153')).toBeTruthy();
    expect(screen.getByText(/Desa\/kelurahan \(teliti\): 637/)).toBeTruthy();
    expect(screen.getByText(/Pusat kabupaten\/kota: 1.132/)).toBeTruthy();
  });

  it('menyertakan catatan wajib dari API, termasuk kunci cadangan', () => {
    render(<EventPointsPanel state={READY} year={2023} />);

    expect(screen.getByText(/tidak punya kode identitas BNPB/)).toBeTruthy();
  });

  it('menyebut kegagalan memuat titik apa adanya', () => {
    render(
      <EventPointsPanel
        state={{ status: 'error', data: null, error: 'jaringan mati' }}
        year={2023}
      />,
    );

    expect(screen.getByText(/Titik kejadian gagal dimuat \(jaringan mati\)/)).toBeTruthy();
  });
});
