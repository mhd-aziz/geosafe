import { useState } from 'react';

import { useRegionSearch } from '../../hooks/useRegionSearch';
import { MIN_KEYWORD_LENGTH } from '../../lib/constants';
import { levelLabel, parentPath } from '../../lib/format';
import type { SearchResult } from '../../types/geosafe';

export interface SearchBoxProps {
  onSelect: (result: SearchResult) => void;
  /** Lama tunggu sebelum memanggil API; diuji dengan nilai 0. */
  debounceMs?: number;
}

/** Kotak pencarian satu untuk empat tingkat wilayah (`SRS-F-67`).
 *
 * Hasil dibatasi 20 baris oleh API (`SRS-F-68`) dan nama kembar dibedakan lewat
 * jenis wilayah + provinsi (`SRS-F-69`). Saat tidak ada hasil, sebabnya
 * ditampilkan dari medan `notes`, bukan diganti kalimat "tidak ditemukan" saja
 * (`SRS-F-71`).
 */
export function SearchBox({ onSelect, debounceMs }: SearchBoxProps) {
  const [query, setQuery] = useState('');
  const { status, data, error } = useRegionSearch(query, debounceMs);
  const tooShort = query.trim().length > 0 && query.trim().length < MIN_KEYWORD_LENGTH;

  return (
    <section aria-label="Pencarian wilayah" className="space-y-2">
      <label htmlFor="region-search" className="block text-sm font-medium text-slate-800">
        Cari wilayah
      </label>
      <input
        id="region-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Nama atau kode: Bogor, 9301, Simeulue"
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
      />

      {tooShort ? (
        <p className="text-xs text-slate-600">
          Ketik minimal {MIN_KEYWORD_LENGTH} huruf; satu huruf akan mencocokkan hampir semua nama.
        </p>
      ) : null}

      {status === 'loading' ? <p className="text-xs text-slate-600">mencari…</p> : null}

      {status === 'error' ? (
        <p className="text-xs text-red-700">Pencarian gagal: {error}</p>
      ) : null}

      {status === 'ready' && data ? (
        <div className="space-y-2">
          {data.count === 0 ? (
            <p className="text-xs text-slate-700">Tidak ada wilayah yang cocok.</p>
          ) : (
            <ul className="max-h-72 divide-y divide-slate-200 overflow-y-auto rounded-md border border-slate-300 bg-white">
              {data.results.map((result) => (
                <li key={`${result.level}-${result.code ?? result.name}-${result.parent_code ?? ''}`}>
                  <button
                    type="button"
                    onClick={() => onSelect(result)}
                    className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-slate-50"
                  >
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-slate-700 uppercase">
                        {levelLabel(result.level, result.region_type)}
                      </span>
                      <span className="text-sm font-medium text-slate-900">{result.name}</span>
                      {result.code ? (
                        <span className="text-[11px] text-slate-500">{result.code}</span>
                      ) : null}
                    </span>
                    <span className="text-[11px] text-slate-600">
                      {parentPath(result.province_name, result.parent_name) || 'tanpa wilayah induk'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {data.notes.length > 0 ? (
            <ul className="space-y-1 text-[11px] text-slate-600">
              {data.notes.map((note) => (
                <li key={note}>• {note}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}