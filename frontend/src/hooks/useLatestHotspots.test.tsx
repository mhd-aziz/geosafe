import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchLatest, fetchLatestSummary } from '../api/geosafe';
import type { LatestResponse, LatestSummary, LatestWindow } from '../types/geosafe';
import { LATEST_REFRESH_MS, useLatestHotspots } from './useLatestHotspots';

vi.mock('../api/geosafe', () => ({
  fetchLatest: vi.fn(),
  fetchLatestSummary: vi.fn(),
}));

function latestResponse(windowHours: LatestWindow, pointCount = 880): LatestResponse {
  return {
    fetched_at: '2026-11-17T06:20:11Z',
    window_hours: windowHours,
    window_start: '2026-11-16T06:20:11Z',
    series: 'nrt',
    using_snapshot: false,
    snapshot_age_seconds: 0,
    point_count: pointCount,
    points_outside_polygon: 150,
    truncated: false,
    satellites: [
      { name: 'VIIRS_NOAA20_NRT', available: true, last_acq_date: '2026-11-16' },
    ],
    points: [
      {
        latitude: -9.03452,
        longitude: 140.99622,
        observed_at: '2026-11-17T04:33:00Z',
        confidence: 'n',
        confidence_class: 'nominal',
        satellite: 'VIIRS_NOAA20_NRT',
        instrument: 'VIIRS',
        brightness: 333.19,
        frp: 46.43,
        region_code: '9413',
      },
    ],
  };
}

function latestSummary(windowHours: LatestWindow): LatestSummary {
  return {
    fetched_at: '2026-11-17T06:20:11Z',
    window_hours: windowHours,
    window_start: '2026-11-16T06:20:11Z',
    series: 'nrt',
    using_snapshot: false,
    snapshot_age_seconds: 0,
    point_count: 880,
    points_outside_polygon: 150,
    regions_with_points: 103,
    satellites: [
      { name: 'VIIRS_NOAA20_NRT', available: true, last_acq_date: '2026-11-16' },
    ],
    top_provinces: [{ province_code: '94', province_name: 'PAPUA SELATAN', point_count: 193 }],
  };
}

/** Selesaikan efek dan rantai `Promise.all` tanpa menunggu waktu nyata. */
async function flush(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('useLatestHotspots', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(fetchLatest).mockImplementation(async (windowHours) => latestResponse(windowHours));
    vi.mocked(fetchLatestSummary).mockImplementation(async (windowHours) => latestSummary(windowHours));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('mengambil titik dan ringkasan bersama saat lapisan dibuka', async () => {
    const { result } = renderHook(() => useLatestHotspots(24));
    await flush();

    expect(result.current.status).toBe('ready');
    expect(result.current.data?.point_count).toBe(880);
    expect(result.current.summary?.regions_with_points).toBe(103);
    expect(vi.mocked(fetchLatest)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fetchLatestSummary)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fetchLatest)).toHaveBeenCalledWith(24, null);
  });

  it('tidak menyegarkan sebelum 15 menit, lalu menyegarkan tepat setelahnya (`SRS-F-24`)', async () => {
    const { result } = renderHook(() => useLatestHotspots(24));
    await flush();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(LATEST_REFRESH_MS - 60_000);
    });
    expect(vi.mocked(fetchLatest)).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(vi.mocked(fetchLatest)).toHaveBeenCalledTimes(2);
    expect(vi.mocked(fetchLatestSummary)).toHaveBeenCalledTimes(2);
    // Penyegaran tidak mengosongkan data yang sudah tampil.
    expect(result.current.status).toBe('ready');
    expect(result.current.data?.point_count).toBe(880);
  });

  it('mengambil data jendela baru saat pengguna memilih jendela lain (`SRS-F-21`)', async () => {
    const { result, rerender } = renderHook(
      ({ windowHours }: { windowHours: LatestWindow }) => useLatestHotspots(windowHours),
      { initialProps: { windowHours: 24 as LatestWindow } },
    );
    await flush();
    expect(result.current.data?.window_hours).toBe(24);

    rerender({ windowHours: 72 });
    await flush();

    expect(vi.mocked(fetchLatest)).toHaveBeenLastCalledWith(72, null);
    expect(vi.mocked(fetchLatestSummary)).toHaveBeenLastCalledWith(72, null);
    expect(result.current.data?.window_hours).toBe(72);
  });

  it('mengirim kotak peta sebagai `bbox` ke kedua endpoint saat batas dipasang', async () => {
    const { rerender } = renderHook(
      ({ bbox }: { bbox: string | null }) => useLatestHotspots(24, bbox),
      { initialProps: { bbox: null as string | null } },
    );
    await flush();
    expect(vi.mocked(fetchLatest)).toHaveBeenLastCalledWith(24, null);

    rerender({ bbox: '95,-11,141,6' });
    await flush();

    // Ringkasan ikut disaring supaya daftar provinsi di panel berasal dari kotak
    // yang sama dengan titiknya (`API-P2.md` bagian 2).
    expect(vi.mocked(fetchLatest)).toHaveBeenLastCalledWith(24, '95,-11,141,6');
    expect(vi.mocked(fetchLatestSummary)).toHaveBeenLastCalledWith(24, '95,-11,141,6');
  });

  it('menyegarkan atas permintaan pengguna tanpa memuat ulang halaman', async () => {
    const { result } = renderHook(() => useLatestHotspots(24));
    await flush();

    vi.mocked(fetchLatest).mockImplementation(async (windowHours) => latestResponse(windowHours, 901));
    act(() => result.current.refresh());
    await flush();

    expect(vi.mocked(fetchLatest)).toHaveBeenCalledTimes(2);
    expect(result.current.data?.point_count).toBe(901);
  });

  it('menyebut kegagalan tanpa membuang titik yang sudah tergambar (`SRS-F-25`)', async () => {
    const { result } = renderHook(() => useLatestHotspots(24));
    await flush();

    vi.mocked(fetchLatest).mockRejectedValue(new Error('upstream_http 503'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(LATEST_REFRESH_MS);
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('upstream_http 503');
    expect(result.current.data?.point_count).toBe(880);
  });
});
