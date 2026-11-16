import { useEffect, useState } from 'react';

import { fetchRegionPanel } from '../api/geosafe';
import type { RegionPanelData } from '../types/geosafe';
import type { RequestStatus } from './useRegionSearch';

export interface PanelState {
  status: RequestStatus;
  data: RegionPanelData | null;
  error: string | null;
}

/** Panel satu kabupaten/kota (`W2`); `regionCode` kosong berarti panel tertutup. */
export function useRegionPanel(regionCode: string | null): PanelState {
  const [state, setState] = useState<PanelState>({
    status: 'idle',
    data: null,
    error: null,
  });

  useEffect(() => {
    if (!regionCode) {
      setState({ status: 'idle', data: null, error: null });
      return;
    }

    let cancelled = false;
    setState({ status: 'loading', data: null, error: null });

    fetchRegionPanel(regionCode)
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
            error: error instanceof Error ? error.message : 'panel gagal dimuat',
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [regionCode]);

  return state;
}