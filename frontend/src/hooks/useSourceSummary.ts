import { useEffect, useState } from 'react';

import { fetchSources } from '../api/geosafe';
import type { DataSource } from '../types/geosafe';

export interface SourceSummary {
  /** Baris dataset NASA FIRMS: sumber titik panas yang digambar di peta. */
  firms: DataSource | null;
  error: string | null;
}

/** Keterangan sumber dan tanggal pembaruan data untuk halaman peta (`SRS-F-19`).
 *
 * Gagal memuat sumber bukan alasan menyembunyikan peta: `error` diisi dan
 * antarmuka menyebutkan bahwa keterangan sumber belum tersedia.
 */
export function useSourceSummary(): SourceSummary {
  const [summary, setSummary] = useState<SourceSummary>({ firms: null, error: null });

  useEffect(() => {
    let cancelled = false;

    fetchSources()
      .then((data) => {
        if (cancelled) {
          return;
        }
        const firms = data.sources.find((source) => source.source_code === 'FIRMS') ?? null;
        setSummary({ firms, error: firms ? null : 'baris sumber FIRMS tidak ada di basis data' });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setSummary({
            firms: null,
            error: error instanceof Error ? error.message : 'sumber data gagal dimuat',
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return summary;
}