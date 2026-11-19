import { useEffect, useState } from 'react';

import { fetchEventPoints } from '../api/geosafe';
import type { RequestStatus } from './useRegionSearch';
import type { EventPointsResponse } from '../types/geosafe';

export interface EventPointsState {
  status: RequestStatus;
  data: EventPointsResponse | null;
  error: string | null;
}

/** Titik kejadian satu tahun, dimuat **hanya** saat lapisannya aktif.
 *
 * Daftar 2.153 kejadian tidak perlu diunduh saat pengguna sedang melihat lapisan
 * titik panas atau kerawanan; tahun berubah → daftar baru diminta.
 */
export function useEventPoints(year: number, enabled: boolean): EventPointsState {
  const [state, setState] = useState<EventPointsState>({
    status: 'loading',
    data: null,
    error: null,
  });

  useEffect(() => {
    if (!enabled) {
      setState({ status: 'ready', data: null, error: null });
      return;
    }
    let cancelled = false;
    setState({ status: 'loading', data: null, error: null });

    fetchEventPoints(year)
      .then((data) => {
        if (!cancelled) {
          setState({ status: 'ready', data, error: null });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            status: 'error',
            data: null,
            error: error instanceof Error ? error.message : 'gagal memuat titik kejadian',
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [year, enabled]);

  return state;
}
