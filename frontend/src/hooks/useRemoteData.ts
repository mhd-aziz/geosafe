import { useEffect, useRef, useState } from 'react';

import type { RequestStatus } from './useRegionSearch';

export interface RemoteState<T> {
  status: RequestStatus;
  data: T | null;
  error: string | null;
}

/** Muat satu sumber data sekali per kombinasi `deps`, dengan pembatalan.
 *
 * Dipakai halaman yang hanya membaca (`T1`, `A1`) supaya pola status
 * loading/ready/error tidak ditulis ulang di setiap halaman.
 */
export function useRemoteData<T>(
  load: () => Promise<T>,
  deps: readonly unknown[],
): RemoteState<T> {
  const [state, setState] = useState<RemoteState<T>>({
    status: 'loading',
    data: null,
    error: null,
  });
  const loadRef = useRef(load);
  loadRef.current = load;
  const key = JSON.stringify(deps);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading', data: null, error: null });

    loadRef
      .current()
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
            error: error instanceof Error ? error.message : 'gagal memuat data',
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [key]);

  return state;
}