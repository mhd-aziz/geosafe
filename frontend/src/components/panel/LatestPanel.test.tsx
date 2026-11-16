import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { LatestSummary } from '../../types/geosafe';
import { LatestPanel } from './LatestPanel';

/** Angka 2026-11-17 jendela 24 jam, seperti yang benar-benar dibalas API. */
const SUMMARY: LatestSummary = {
  fetched_at: '2026-11-17T06:20:11Z',
  window_hours: 24,
  window_start: '2026-11-16T06:20:11Z',
  series: 'nrt',
  using_snapshot: false,
  snapshot_age_seconds: 0,
  point_count: 880,
  points_outside_polygon: 150,
  regions_with_points: 103,
  satellites: [
    { name: 'VIIRS_SNPP_NRT', available: false, last_acq_date: '2026-11-02' },
    { name: 'VIIRS_NOAA20_NRT', available: true, last_acq_date: '2026-11-16' },
    { name: 'VIIRS_NOAA21_NRT', available: true, last_acq_date: '2026-11-16' },
    { name: 'MODIS_NRT', available: true, last_acq_date: null },
  ],
  top_provinces: [
    { province_code: '94', province_name: 'PAPUA SELATAN', point_count: 193 },
    { province_code: '74', province_name: 'SULAWESI TENGGARA', point_count: 89 },
    { province_code: '72', province_name: 'SULAWESI TENGAH', point_count: 88 },
  ],
};

describe('LatestPanel', () => {
  it('menampilkan jumlah titik, jendela, waktu tarikan, dan wilayah terdampak (`SRS-F-57`)', () => {
    render(<LatestPanel summary={SUMMARY} status="ready" error={null} />);

    expect(screen.getByText(/Terkini · 24 jam · seri/)).toBeTruthy();
    expect(screen.getByText('nrt')).toBeTruthy();
    expect(screen.getByText('880')).toBeTruthy();
    expect(screen.getByText('103')).toBeTruthy();
    expect(screen.getByText(/tarikan 17 Nov 2026, 13\.20 WIB/)).toBeTruthy();
    expect(screen.getByText(/jendela mulai 16 Nov 2026, 13\.20 WIB/)).toBeTruthy();
  });

  it('melaporkan titik di luar poligon beserta porsinya, tidak dibuang diam-diam', () => {
    render(<LatestPanel summary={SUMMARY} status="ready" error={null} />);

    expect(screen.getByText('Titik di luar poligon').nextElementSibling?.textContent).toBe(
      '150 (17%)',
    );
  });

  it('memuat peringkat provinsi apa adanya, tanpa baris nol pengisi (`SRS-F-58`)', () => {
    render(<LatestPanel summary={SUMMARY} status="ready" error={null} />);

    expect(screen.getByText('Provinsi dengan titik terbanyak (3)')).toBeTruthy();
    expect(screen.getByText('PAPUA SELATAN')).toBeTruthy();
    expect(screen.getByText('193')).toBeTruthy();
    expect(screen.getByText('SULAWESI TENGAH')).toBeTruthy();
  });

  it('menyatakan satelit yang tidak mengirim titik beserta tanggal terakhirnya (`SRS-F-27`)', () => {
    render(<LatestPanel summary={SUMMARY} status="ready" error={null} />);

    expect(screen.getByText(/3 dari 4/)).toBeTruthy();
    expect(screen.getByText('VIIRS_SNPP_NRT (tidak mengirim titik)').parentElement?.textContent).toBe(
      'VIIRS_SNPP_NRT (tidak mengirim titik)2026-11-02',
    );
    // Satelit yang belum pernah terlihat tidak diberi tanggal karangan.
    expect(screen.getByText('MODIS_NRT').parentElement?.textContent).toBe('MODIS_NRT—');
  });

  it('memakai label "data per" dan umur snapshot saat tarikan gagal (`SRS-F-25`)', () => {
    render(
      <LatestPanel
        summary={{ ...SUMMARY, using_snapshot: true, snapshot_age_seconds: 3300 }}
        status="ready"
        error={null}
      />,
    );

    expect(screen.getByTestId('latest-panel-snapshot').textContent).toContain(
      'Snapshot: data per 17 Nov 2026, 13.20 WIB (umur 55 menit).',
    );
  });

  it('menyatakan bahwa angka terkini tidak boleh dijumlahkan dengan arsip (`SRS-F-26`)', () => {
    render(<LatestPanel summary={SUMMARY} status="ready" error={null} />);

    expect(
      screen.getByText(/tidak boleh dijumlahkan dengan angka arsip 2020–2026/),
    ).toBeTruthy();
  });

  it('menyatakan jendela tanpa titik sebagai tanpa peringkat, bukan daftar kosong', () => {
    render(
      <LatestPanel
        summary={{ ...SUMMARY, point_count: 0, points_outside_polygon: 0, top_provinces: [] }}
        status="ready"
        error={null}
      />,
    );

    expect(screen.getByText(/Tidak ada titik pada jendela ini/)).toBeTruthy();
    expect(screen.getByText('Provinsi dengan titik terbanyak (0)')).toBeTruthy();
  });

  it('menyebut kegagalan penyegaran tanpa menyembunyikan angka lama (`SRS-F-25`)', () => {
    render(<LatestPanel summary={SUMMARY} status="error" error="upstream_http 503" />);

    expect(screen.getByTestId('latest-panel-error').textContent).toContain(
      'Tarikan terakhir gagal (upstream_http 503); angka di bawah berasal dari tarikan sebelumnya.',
    );
    expect(screen.getByText('880')).toBeTruthy();
  });

  it('menyebut kegagalan memuat ringkasan apa adanya', () => {
    render(<LatestPanel summary={null} status="error" error="tarikan gagal (503)" />);

    expect(screen.getByText(/Ringkasan titik terkini gagal dimuat: tarikan gagal \(503\)/)).toBeTruthy();
  });
});
