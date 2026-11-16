import { useCallback, useEffect, useState } from 'react';

import { fetchLatest, fetchLatestSummary } from '../api/geosafe';
import type { LatestResponse, LatestSummary, LatestWindow } from '../types/geosafe';
import type { RequestStatus } from './useRegionSearch';

/** Penyegaran otomatis lapisan terkini (`SRS-F-24`): 15 menit, tidak lebih cepat. */
export const LATEST_REFRESH_MS = 900_000;

export interface LatestState {
  status: RequestStatus;
  data: LatestResponse | null;
  summary: LatestSummary | null;
  error: string | null;
  /** Menyegarkan sekarang tanpa memuat ulang halaman. */
  refresh: () => void;
}

/** Lapisan titik panas terkini (`P2`) dan ringkasannya (`W1`).
 *
 * Titik dan ringkasan diambil bersama-sama, bukan oleh dua komponen terpisah:
 * keduanya wajib berasal dari generasi cache yang sama (invarian kontrak
 * `API-P2.md` bagian 2 — `fetched_at` dan `point_count` identik), dan memisahkan
 * pengambilannya hanya membuka peluang keduanya berbeda di layar.
 */
export function useLatestHotspots(windowHours: LatestWindow): LatestState {
  const [state, setState] = useState<Omit<LatestState, 'refresh'>>({
    status: 'loading',
    data: null,
    summary: null,
    error: null,
  });
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // Penyegaran tidak mengosongkan yang sudah tampil: peta tidak boleh
    // berkedip kosong setiap 15 menit hanya karena tarikan sedang berjalan.
    setState((previous) =>
      previous.data
        ? { ...previous, error: null }
        : { status: 'loading', data: null, summary: null, error: null },
    );

    Promise.all([fetchLatest(windowHours), fetchLatestSummary(windowHours)])
      .then(([data, summary]) => {
        if (!cancelled) {
          setState({ status: 'ready', data, summary, error: null });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState((previous) => ({
            ...previous,
            status: 'error',
            error: error instanceof Error ? error.message : 'lapisan terkini gagal dimuat',
          }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [windowHours, generation]);

  useEffect(() => {
    const timer = window.setInterval(() => setGeneration((value) => value + 1), LATEST_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, []);

  const refresh = useCallback(() => setGeneration((value) => value + 1), []);

  return { ...state, refresh };
}
