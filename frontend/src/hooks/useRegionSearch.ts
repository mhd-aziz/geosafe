import { useEffect, useState } from 'react';

import { searchRegions } from '../api/geosafe';
import { MIN_KEYWORD_LENGTH, SEARCH_DEBOUNCE_MS } from '../lib/constants';
import type { SearchResponse } from '../types/geosafe';
import { useDebouncedValue } from './useDebouncedValue';

export type RequestStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface SearchState {
  status: RequestStatus;
  data: SearchResponse | null;
  error: string | null;
}

/** Cari wilayah saat pengguna mengetik, dengan penundaan dan pembatalan.
 *
 * Balasan yang datang setelah kata kunci berubah diabaikan, jadi daftar saran
 * tidak pernah menampilkan hasil untuk kata kunci lama.
 */
export function useRegionSearch(
  query: string,
  debounceMs: number = SEARCH_DEBOUNCE_MS,
): SearchState {
  const keyword = query.trim();
  const debounced = useDebouncedValue(keyword, debounceMs);
  const [state, setState] = useState<SearchState>({
    status: 'idle',
    data: null,
    error: null,
  });

  useEffect(() => {
    if (debounced.length < MIN_KEYWORD_LENGTH) {
      setState({ status: 'idle', data: null, error: null });
      return;
    }

    let cancelled = false;
    setState((previous) => ({ ...previous, status: 'loading', error: null }));

    searchRegions(debounced)
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
            error: error instanceof Error ? error.message : 'pencarian gagal',
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debounced]);

  return state;
}