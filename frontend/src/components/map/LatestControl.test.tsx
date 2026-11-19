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
    loading: false,
    fetchedAt: '2026-11-17T06:20:11Z',
    satellites: SATELLITES,
    usingSnapshot: false,
    pointCount: 880,
    truncated: false,
    bboxActive: false,
    canUseViewport: true,
    error: null,
    onRefresh: vi.fn(),
    onUseViewport: vi.fn(),
    onClearBounds: vi.fn(),
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
    const satelliteLine = screen.getByText(/Satelit tersedia/);
    expect(satelliteLine.textContent).toContain('VIIRS_NOAA20_NRT');
    expect(satelliteLine.textContent).toContain('MODIS_NRT');
    expect(satelliteLine.textContent).not.toContain('VIIRS_SNPP_NRT');
  });

  it('menyebut kegagalan tarikan tepat di sebelah angka yang masih tampil', () => {
    renderControl({ error: 'upstream_http 503' });

    expect(screen.getByTestId('latest-error').textContent).toContain('upstream_http 503');
    expect(screen.getByText(/880 titik/)).toBeTruthy();
  });

  it('tidak menampilkan angka jendela lama saat pengguna baru berganti jendela', () => {
    renderControl({ windowHours: 48, loading: true, pointCount: null, fetchedAt: null });

    expect(screen.getByText('memuat jendela 48 jam...')).toBeTruthy();
    expect(screen.queryByText(/titik · tarikan/)).toBeNull();
    expect(screen.queryByText(/Satelit tersedia/)).toBeNull();
  });

  it('menyebut snapshot apa adanya saat tarikan terakhir gagal (`SRS-F-25`)', () => {
    renderControl({ usingSnapshot: true });

    expect(screen.getByTestId('latest-snapshot').textContent).toContain(
      'data per 17 Nov 2026, 13.20 WIB',
    );
  });

  it('menawarkan penyempitan ke kotak peta saat muatan dipotong 2 MB (`API-P2` bagian 1)', () => {
    const props = renderControl({ truncated: true, pointCount: 0 });

    const pesan = screen.getByTestId('latest-truncated').textContent ?? '';
    expect(pesan).toContain('melewati 2 MB');
    // 24 jam adalah jendela terpendek: menyuruh pengguna memilih jendela lebih
    // pendek tidak bisa diikuti.
    expect(pesan).not.toContain('jendela jam yang lebih pendek');

    screen.getByRole('button', { name: 'Batasi ke area tampak' }).click();
    expect(props.onUseViewport).toHaveBeenCalledTimes(1);
  });

  it('mematikan tombol kotak peta selama kotak peta belum diketahui', () => {
    // Sebelum peta siap tidak ada `getBounds()`; tombol yang bisa ditekan tetapi
    // tidak mengirim apa pun lebih buruk daripada tombol yang mati.
    renderControl({ truncated: true, canUseViewport: false });

    const tombol = screen.getByRole('button', { name: 'Batasi ke area tampak' });
    expect((tombol as HTMLButtonElement).disabled).toBe(true);
  });

  it('menyatakan angka hanya untuk kotak peta dan menawarkan kembali ke nasional', () => {
    const props = renderControl({ bboxActive: true, pointCount: 120 });

    expect(screen.getByText(/120 titik di dalam kotak peta/)).toBeTruthy();
    screen.getByRole('button', { name: 'Seluruh Indonesia' }).click();
    expect(props.onClearBounds).toHaveBeenCalledTimes(1);
  });

  it('tidak menampilkan pita kotak peta selama tidak ada batas', () => {
    renderControl();

    expect(screen.queryByTestId('latest-bbox')).toBeNull();
    expect(screen.queryByText(/di dalam kotak peta/)).toBeNull();
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
