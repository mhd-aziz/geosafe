import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { LatestSatellite } from '../../types/geosafe';
import { LatestControl } from './LatestControl';

const SATELLITES: LatestSatellite[] = [
  { name: 'VIIRS_SNPP_NRT', available: false, last_acq_date: '2026-11-02' },
  { name: 'VIIRS_NOAA20_NRT', available: true, last_acq_date: '2026-11-16' },
  { name: 'MODIS_NRT', available: true, last_acq_date: '2026-11-16' },
];

function renderControl(overrides: Partial<Parameters<typeof LatestControl>[0]> = {}) {
  const props = {
    windowHours: 24 as const,
    onWindowChange: vi.fn(),
    fetchedAt: '2026-11-17T06:20:11Z',
    satellites: SATELLITES,
    usingSnapshot: false,
    pointCount: 880,
    truncated: false,
    onRefresh: vi.fn(),
    ...overrides,
  };
  render(<LatestControl {...props} />);
  return props;
}

describe('LatestControl', () => {
  it('menawarkan tiga jendela jam dan menandai yang aktif (`SRS-F-21`)', () => {
    renderControl({ windowHours: 48 });

    expect(screen.getByRole('button', { name: '24 jam' }).getAttribute('aria-pressed')).toBe(
      'false',
    );
    expect(screen.getByRole('button', { name: '48 jam' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: '72 jam' }).getAttribute('aria-pressed')).toBe(
      'false',
    );
  });

  it('mengabarkan jendela yang dipilih ke pemanggilnya', async () => {
    const props = renderControl();

    screen.getByRole('button', { name: '72 jam' }).click();

    expect(props.onWindowChange).toHaveBeenCalledWith(72);
  });

  it('menampilkan waktu tarikan dan hanya satelit yang benar-benar mengirim titik', () => {
    renderControl();

    // Waktu API adalah UTC; ditampilkan dalam WIB agar tidak terbaca meleset 7 jam.
    expect(screen.getByText(/880 titik · tarikan 17 Nov 2026, 13\.20 WIB/)).toBeTruthy();
    const satelit = screen.getByText(/Satelit tersedia/);
    expect(satelit.textContent).toContain('VIIRS_NOAA20_NRT');
    expect(satelit.textContent).toContain('MODIS_NRT');
    expect(satelit.textContent).not.toContain('VIIRS_SNPP_NRT');
  });

  it('menyebut snapshot apa adanya saat tarikan terakhir gagal (`SRS-F-25`)', () => {
    renderControl({ usingSnapshot: true });

    expect(screen.getByTestId('latest-snapshot').textContent).toContain(
      'data per 17 Nov 2026, 13.20 WIB',
    );
  });

  it('menyatakan titik tidak digambar ketika muatan dipotong 2 MB', () => {
    renderControl({ truncated: true, pointCount: 0 });

    expect(screen.getByTestId('latest-truncated').textContent).toContain('melewati 2 MB');
  });

  it('tidak menampilkan pita snapshot pada tarikan yang sehat', () => {
    renderControl();

    expect(screen.queryByTestId('latest-snapshot')).toBeNull();
    expect(screen.queryByTestId('latest-truncated')).toBeNull();
  });

  it('menyegarkan saat tombol segarkan ditekan', () => {
    const props = renderControl();

    screen.getByRole('button', { name: 'Segarkan' }).click();

    expect(props.onRefresh).toHaveBeenCalledTimes(1);
  });
});
