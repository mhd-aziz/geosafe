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
 * Titik dan ringkasan diambil bersama dalam satu langkah, bukan oleh dua
 * komponen terpisah: keduanya dilayani satu generasi cache di server
 * (`API-P2.md` bagian 2 — `fetched_at` dan `point_count` identik), dan mengambilnya
 * terpisah hanya menambah peluang keduanya jatuh di generasi berbeda.
 *
 * Invarian itu **tidak** dipaksakan di peramban: bila salah satu dari dua
 * permintaan jatuh tepat di batas 15 menit, server sudah menyegarkan cache di
 * antara keduanya, sehingga `fetched_at` kedua balasan bisa berbeda. Karena itu
 * panel dan kendali menampilkan `fetched_at` dari balasannya masing-masing, bukan
 * satu waktu bersama yang tidak dijamin.
 *
 * `bbox` (kotak peta yang diminta pengguna) ikut jadi kunci tarikan: menggantinya
 * berarti permintaan baru, sama seperti berganti jendela jam.
 */
export function useLatestHotspots(windowHours: LatestWindow, bbox: string | null = null): LatestState {
  const [state, setState] = useState<Omit<LatestState, 'refresh'>>({
    status: 'loading',
    data: null,
    summary: null,
    error: null,
  });
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // Status kembali 'loading' setiap tarikan, tetapi data yang sudah tampil tidak
    // dikosongkan: peta tidak boleh berkedip kosong setiap 15 menit hanya karena
    // tarikan sedang berjalan.
    setState((previous) => ({ ...previous, status: 'loading', error: null }));

    Promise.all([fetchLatest(windowHours, bbox), fetchLatestSummary(windowHours, bbox)])
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
  }, [windowHours, bbox, generation]);

  useEffect(() => {
    const timer = window.setInterval(() => setGeneration((value) => value + 1), LATEST_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, []);

  const refresh = useCallback(() => setGeneration((value) => value + 1), []);

  return { ...state, refresh };
}
