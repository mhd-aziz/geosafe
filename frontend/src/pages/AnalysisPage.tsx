import { useState } from 'react';

import { fetchComposition, fetchRanking } from '../api/geosafe';
import { RankingTable } from '../components/analysis/RankingTable';
import { DataNotes } from '../components/common/DataNotes';
import { Segmented } from '../components/common/Segmented';
import { useRemoteData } from '../hooks/useRemoteData';
import { DEFAULT_YEAR, YEARS } from '../lib/constants';
import { formatCount, formatDecimal } from '../lib/format';
import type { CompositionMetric, YearCoverage } from '../types/geosafe';

const METRICS: { value: CompositionMetric; label: string }[] = [
  { value: 'hotspot_count', label: 'Titik panas' },
  { value: 'event_count', label: 'Kejadian' },
];

/** Keterangan satu tabel komposisi: nilai, pangsa, dan total pembaginya. */
function compositionTable(
  title: string,
  nameLabel: string,
  rows: { key: string; name: string; parent: string | null; value: number; sharePct: number | null }[],
  total: number | null,
) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      <table className="mt-2 w-full border-collapse text-xs">
        <thead>
          <tr className="text-left text-slate-600">
            <th className="border-b border-slate-200 py-1">#</th>
            <th className="border-b border-slate-200 py-1">{nameLabel}</th>
            <th className="border-b border-slate-200 py-1 text-right">Nilai</th>
            <th className="border-b border-slate-200 py-1 text-right">Pangsa</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.key}>
              <td className="border-b border-slate-100 py-1 text-right tabular-nums text-slate-500">
                {index + 1}
              </td>
              <td className="border-b border-slate-100 py-1 text-slate-800">
                {row.name}
                {row.parent ? <span className="text-slate-500"> · {row.parent}</span> : null}
              </td>
              <td className="border-b border-slate-100 py-1 text-right tabular-nums text-slate-800">
                {formatCount(row.value)}
              </td>
              <td className="border-b border-slate-100 py-1 text-right tabular-nums text-slate-800">
                {row.sharePct === null ? '—' : `${formatDecimal(row.sharePct)}%`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-1 text-[11px] text-slate-600">
        Pangsa dihitung terhadap seluruh wilayah tingkat ini pada tahun itu: {formatCount(total)}{' '}
        wilayah terhitung.
      </p>
    </div>
  );
}

/** Penanda tahun parsial: sampai kapan data tahun itu benar-benar terukur (`A1`–`A3`). */
function CoverageBanner({ year, coverage }: { year: number; coverage: YearCoverage }) {
  if (!coverage.partial) {
    return null;
  }
  return (
    <p
      data-testid="coverage-partial"
      className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900"
    >
      Tahun {year} belum penuh: data titik panas terukur sampai{' '}
      {coverage.last_observed_on} ({formatCount(coverage.days_covered)} dari{' '}
      {formatCount(coverage.days_in_year)} hari, {formatDecimal(coverage.coverage_pct)}% tahun).
      Angkanya karena itu belum bisa dibaca sebagai angka setahun penuh.
    </p>
  );
}

/** Halaman analisis: komposisi wilayah (`A2`) dan peringkat kabupaten/kota (`A3`).
 *
 * Keduanya membaca tabel fakta yang sama, jadi tahun yang dipilih di sini berlaku
 * untuk dua bagian sekaligus — satu kendali, satu kebenaran. Kepadatan titik panas
 * tidak mengikuti tahun (satu rata-rata 2020–2025 per wilayah) dan itu dinyatakan
 * di catatan, bukan disembunyikan.
 */
export function AnalysisPage() {
  const [year, setYear] = useState<number>(DEFAULT_YEAR);
  const [metric, setMetric] = useState<CompositionMetric>('hotspot_count');

  const composition = useRemoteData(() => fetchComposition(year, metric), [year, metric]);
  const ranking = useRemoteData(() => fetchRanking(year), [year]);

  return (
    <div className="mx-auto h-full w-full max-w-5xl space-y-4 overflow-y-auto p-3 sm:p-5">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-900">Analisis wilayah {year}</h2>
        <p className="text-xs text-slate-600">
          Komposisi: sepuluh provinsi dan sepuluh kabupaten/kota dengan angka terbesar pada tahun
          terpilih. Peringkat: seluruh 514 kabupaten/kota, bisa diurutkan menurut titik panas,
          kepadatan, atau kejadian.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          label="Tahun"
          value={year}
          onChange={setYear}
          options={YEARS.map((option) => ({ value: option, label: String(option) }))}
        />
        <Segmented
          label="Metrik komposisi"
          value={metric}
          onChange={setMetric}
          options={METRICS}
        />
      </div>

      <section
        aria-label="Komposisi wilayah"
        className="space-y-3 rounded-md border border-slate-300 bg-white p-3"
      >
        <h3 className="text-sm font-semibold text-slate-800">
          Komposisi wilayah{' '}
          <span className="font-normal text-slate-600">
            (satuan {composition.data?.unit ?? '—'})
          </span>
        </h3>

        {composition.status === 'loading' ? (
          <p className="text-xs text-slate-600">memuat komposisi…</p>
        ) : composition.status === 'error' ? (
          <p className="text-xs text-red-700">Komposisi gagal dimuat: {composition.error}</p>
        ) : composition.data ? (
          <>
            <CoverageBanner year={year} coverage={composition.data.coverage} />
            <div className="grid gap-4 lg:grid-cols-2">
              {compositionTable(
                'Sepuluh provinsi teratas',
                'Provinsi',
                composition.data.province.rows.map((row) => ({
                  key: row.province_code,
                  name: row.province_name,
                  parent: null,
                  value: row.value,
                  sharePct: row.share_pct,
                })),
                composition.data.province.total,
              )}
              {compositionTable(
                'Sepuluh kabupaten/kota teratas',
                'Kabupaten/kota',
                composition.data.regency.rows.map((row) => ({
                  key: row.region_code,
                  name: row.region_name,
                  parent: row.province_name,
                  value: row.value,
                  sharePct: row.share_pct,
                })),
                composition.data.regency.total,
              )}
            </div>
            <DataNotes title="Catatan wajib komposisi" notes={composition.data.notes} />
          </>
        ) : null}
      </section>

      <section
        aria-label="Peringkat kabupaten/kota"
        className="space-y-3 rounded-md border border-slate-300 bg-white p-3"
      >
        {ranking.status === 'loading' ? (
          <p className="text-xs text-slate-600">memuat peringkat…</p>
        ) : ranking.status === 'error' ? (
          <p className="text-xs text-red-700">Peringkat gagal dimuat: {ranking.error}</p>
        ) : ranking.data ? (
          <>
            <CoverageBanner year={year} coverage={ranking.data.coverage} />
            <RankingTable rows={ranking.data.regions} year={year} />
            <DataNotes title="Catatan wajib peringkat" notes={ranking.data.notes} />
          </>
        ) : null}
      </section>
    </div>
  );
}
