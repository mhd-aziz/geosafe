import { useMemo, useState } from 'react';

import { formatCount, formatDecimal } from '../../lib/format';
import type { RankingRow } from '../../types/geosafe';

/** Kolom yang bisa diurutkan (`SRS-F-54`). */
const SORTS = [
  { key: 'hotspot_count', label: 'Titik panas' },
  { key: 'hotspot_per_1000_km2', label: 'Kepadatan / 1.000 km²' },
  { key: 'event_count', label: 'Kejadian' },
] as const;

type SortKey = (typeof SORTS)[number]['key'];

export interface RankingTableProps {
  rows: RankingRow[];
  /** Tahun yang sedang dipilih; hanya dipakai di keterangan kolom. */
  year: number;
}

/** Nilai kosong selalu di bawah: `null` berarti belum punya baris fakta, bukan nol. */
function compare(left: number | null, right: number | null): number {
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  return right - left;
}

/** Tabel peringkat 514 kabupaten/kota (`A3`).
 *
 * Seluruh baris sudah ada di peramban (± 60 kB), jadi pengurutan dan pencarian
 * dikerjakan di sini — bukan dengan meminta ulang ke API per klik atau per huruf.
 * Urutan bawaan: titik panas tahun terpilih menurun.
 */
export function RankingTable({ rows, year }: RankingTableProps) {
  const [sort, setSort] = useState<SortKey>('hotspot_count');
  const [keyword, setKeyword] = useState('');

  const shown = useMemo(() => {
    const needle = keyword.trim().toLowerCase();
    const filtered = needle
      ? rows.filter(
          (row) =>
            row.region_name.toLowerCase().includes(needle) ||
            (row.province_name ?? '').toLowerCase().includes(needle) ||
            row.region_code.includes(needle),
        )
      : rows;
    return [...filtered].sort(
      (left, right) => compare(left[sort], right[sort]) || left.region_name.localeCompare(right.region_name),
    );
  }, [rows, keyword, sort]);

  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-800">
          Peringkat kabupaten/kota{' '}
          <span className="font-normal text-slate-600">
            ({formatCount(rows.length)} wilayah, titik panas {year})
          </span>
        </h3>
        <label className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
          Cari wilayah
          <input
            type="search"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="nama atau kode"
            className="ml-2 min-h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs font-normal tracking-normal text-slate-800 normal-case"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Urut</span>
        {SORTS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setSort(option.key)}
            aria-pressed={sort === option.key}
            className={`min-h-8 cursor-pointer rounded-lg border px-3 text-xs font-medium transition-colors duration-200 ${
              sort === option.key
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            {option.label}
          </button>
        ))}
        <span className="text-[11px] text-slate-600">{formatCount(shown.length)} baris tampil</span>
      </div>

      <div className="max-h-[28rem] overflow-auto rounded-lg border border-slate-200">
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 bg-slate-50">
            <tr className="text-left text-slate-600">
              <th className="border-b border-slate-200 px-2 py-1">#</th>
              <th className="border-b border-slate-200 px-2 py-1">Kabupaten/kota</th>
              <th className="border-b border-slate-200 px-2 py-1">Provinsi</th>
              <th className="border-b border-slate-200 px-2 py-1 text-right">Titik panas {year}</th>
              <th className="border-b border-slate-200 px-2 py-1 text-right">Kepadatan</th>
              <th className="border-b border-slate-200 px-2 py-1 text-right">Kejadian {year}</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((row, index) => (
              <tr key={row.region_code}>
                <td className="border-b border-slate-100 px-2 py-1 text-right tabular-nums text-slate-500">
                  {index + 1}
                </td>
                <td className="border-b border-slate-100 px-2 py-1 text-slate-800">
                  {row.region_name}{' '}
                  <span className="text-slate-500">({row.region_code})</span>
                </td>
                <td className="border-b border-slate-100 px-2 py-1 text-slate-700">
                  {row.province_name ?? '—'}
                </td>
                <td className="border-b border-slate-100 px-2 py-1 text-right tabular-nums text-slate-800">
                  {formatCount(row.hotspot_count)}
                </td>
                <td className="border-b border-slate-100 px-2 py-1 text-right tabular-nums text-slate-800">
                  {formatDecimal(row.hotspot_per_1000_km2)}
                </td>
                <td className="border-b border-slate-100 px-2 py-1 text-right tabular-nums text-slate-800">
                  {formatCount(row.event_count)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
