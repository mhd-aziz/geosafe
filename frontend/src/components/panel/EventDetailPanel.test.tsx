import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { EventPoint } from '../../types/geosafe';
import { EventDetailPanel } from './EventDetailPanel';

/** Kejadian 2023-01-01 di Bengkalis seperti di basis data: dampak tidak dilaporkan
 * (null), rumah rusak dilaporkan nol. */
const POINT: EventPoint = {
  point_id: '1403 107 2023 01 01 1',
  event_date: '2023-01-01',
  year: 2023,
  coord_level: 'village',
  longitude: 102.050188,
  latitude: 1.310401,
  province_code: '14',
  province_name: 'Riau',
  region_code: '1403',
  region_name: 'Bengkalis',
  district_name: 'Talang Mandau | Bukit Batu',
  village_name: 'Dompas | Tanjung Belit',
  deaths: null,
  injured: null,
  houses_damaged: 0,
  documentation_url: null,
};

describe('EventDetailPanel', () => {
  it('memuat tanggal, rantai wilayah, ketelitian, dan point_id (`SRS-F-42`)', () => {
    render(<EventDetailPanel point={POINT} onClose={vi.fn()} onOpenRegion={vi.fn()} />);

    expect(screen.getByText('2023-01-01')).toBeTruthy();
    expect(
      screen.getByText(
        /Dompas \| Tanjung Belit · Talang Mandau \| Bukit Batu · Bengkalis · Riau/,
      ),
    ).toBeTruthy();
    expect(screen.getByText(/Desa\/kelurahan \(teliti\) · kode 1403 107 2023 01 01 1/)).toBeTruthy();
  });

  it('membedakan dampak tidak dilaporkan dari dampak nol', () => {
    render(<EventDetailPanel point={POINT} onClose={vi.fn()} onOpenRegion={vi.fn()} />);

    // `formatCount(null)` menulis "—", sedangkan 0 tetap "0".
    expect(screen.getAllByText('—').length).toBe(2);
    expect(screen.getByText('0')).toBeTruthy();
    expect(screen.getByText(/berarti sumber tidak melaporkan angkanya/)).toBeTruthy();
  });

  it('membuka panel kabupaten/kota wilayah kejadian (`SRS-F-44`)', () => {
    const onOpenRegion = vi.fn();
    render(<EventDetailPanel point={POINT} onClose={vi.fn()} onOpenRegion={onOpenRegion} />);

    fireEvent.click(screen.getByRole('button', { name: 'Buka panel kabupaten/kota' }));

    expect(onOpenRegion).toHaveBeenCalledWith('1403', 'Bengkalis');
  });

  it('menutup panel lewat tombol Tutup', () => {
    const onClose = vi.fn();
    render(<EventDetailPanel point={POINT} onClose={onClose} onOpenRegion={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Tutup' }));

    expect(onClose).toHaveBeenCalled();
  });
});
