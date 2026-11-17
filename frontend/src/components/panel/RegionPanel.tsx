import { useRegionPanel } from '../../hooks/useRegionPanel';
import { formatAreaKm2, formatCount, formatDecimal, levelLabel } from '../../lib/format';
import type { HotspotSeriesRow } from '../../types/geosafe';
import { DataNotes } from '../common/DataNotes';

/** Urutan kolom seri titik panas: arsip lebih dulu, nrt dipisah paling kanan. */
const SERIES_COLUMNS = ['main', 'fill', 'nrt'] as const;

/** Susun baris titik panas per tahun dengan kolom per seri.
 *
 * Seri tidak digabung: `main` + `fill` adalah seri arsip, `nrt` pemrosesan
 * berbeda dan tidak sebanding. Menjumlahkannya diam-diam adalah kesalahan yang
 * sudah tercatat pada artefak `panel_kabupaten_kota.csv`.
 */
function hotspotTable(rows: HotspotSeriesRow[]): { year: number; values: Record<string, number | null> }[] {
  const byYear = new Map<number, Record<string, number | null>>();
  for (const row of rows) {
    const entry = byYear.get(row.year) ?? {};
    entry[row.series] = row.hotspot_count;
    byYear.set(row.year, entry);
  }
  return [...byYear.entries()]
    .sort(([left], [right]) => left - right)
    .map(([year, values]) => ({ year, values }));
}

export interface RegionPanelProps {
  regionCode: string;
  onClose: () => void;
}

/** Panel kabupaten/kota (`W2`): titik panas, kejadian, status darurat, IRBI. */
export function RegionPanel({ regionCode, onClose }: RegionPanelProps) {
  const { status, data, error } = useRegionPanel(regionCode);

  if (status === 'loading') {
    return <p className="text-sm text-slate-600">memuat panel wilayah…</p>;
  }

  if (status === 'error') {
    return <p className="text-sm text-red-700">Panel gagal dimuat: {error}</p>;
  }

  if (!data) {
    return null;
  }

  const hotspotRows = hotspotTable(data.hotspot_by_year);

  return (
    <section aria-label="Panel wilayah" className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
            {levelLabel('regency', data.region.region_type)}
          </p>
          <h2 className="text-lg font-semibold text-slate-900">{data.region.region_name}</h2>
          <p className="text-xs text-slate-600">
            {data.region.province_name} · kode {data.region.region_code} ·{' '}
            {formatAreaKm2(data.region.area_km2)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="min-h-9 cursor-pointer rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-teal-700 sm:min-h-8"
        >
          Tutup
        </button>
      </header>

      <dl className="grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
          <dt className="text-slate-600">Kepadatan titik panas (seluruh seri)</dt>
          <dd className="text-sm font-semibold text-slate-900">
            {formatDecimal(data.hotspot_per_1000_km2)} per 1.000 km²
          </dd>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
          <dt className="text-slate-600">IRBI 2025</dt>
          <dd className="text-sm font-semibold text-slate-900">
            {formatDecimal(data.irbi_2025.irbi_score)} · {data.irbi_2025.irbi_class ?? '—'}
          </dd>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
          <dt className="text-slate-600">SK darurat karhutla 2025</dt>
          <dd className="text-sm font-semibold text-slate-900">
            {formatCount(data.emergency_2025.emergency_sk_karhutla_2025)}
          </dd>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
          <dt className="text-slate-600">SK darurat yang menyebut kebakaran 2025</dt>
          <dd className="text-sm font-semibold text-slate-900">
            {formatCount(data.emergency_2025.emergency_sk_mentions_2025)}
          </dd>
        </div>
      </dl>

      <div>
        <h3 className="text-sm font-semibold text-slate-800">
          Titik panas per tahun <span className="font-normal text-slate-600">(deteksi satelit, seri dipisah)</span>
        </h3>
        <table className="mt-2 w-full border-collapse text-xs">
          <thead>
            <tr className="text-left text-slate-600">
              <th className="border-b border-slate-200 py-1">Tahun</th>
              {SERIES_COLUMNS.map((series) => (
                <th key={series} className="border-b border-slate-200 py-1 text-right">
                  {series}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hotspotRows.map((row) => (
              <tr key={row.year}>
                <th scope="row" className="border-b border-slate-100 py-1 text-left font-normal text-slate-700">
                  {row.year}
                </th>
                {SERIES_COLUMNS.map((series) => (
                  <td
                    key={series}
                    className="border-b border-slate-100 py-1 text-right tabular-nums text-slate-800"
                  >
                    {formatCount(row.values[series] ?? null)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-800">
          Kejadian karhutla per tahun <span className="font-normal text-slate-600">(catatan BNPB)</span>
        </h3>
        <table className="mt-2 w-full border-collapse text-xs">
          <thead>
            <tr className="text-left text-slate-600">
              <th className="border-b border-slate-200 py-1">Tahun</th>
              <th className="border-b border-slate-200 py-1 text-right">Kejadian</th>
            </tr>
          </thead>
          <tbody>
            {data.event_by_year.map((row) => (
              <tr key={row.year}>
                <th scope="row" className="border-b border-slate-100 py-1 text-left font-normal text-slate-700">
                  {row.year}
                </th>
                <td className="border-b border-slate-100 py-1 text-right tabular-nums text-slate-800">
                  {formatCount(row.event_count)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-800">
          IRBI ancaman karhutla per tahun
        </h3>
        <table className="mt-2 w-full border-collapse text-xs">
          <thead>
            <tr className="text-left text-slate-600">
              <th className="border-b border-slate-200 py-1">Tahun</th>
              <th className="border-b border-slate-200 py-1 text-right">Skor</th>
              <th className="border-b border-slate-200 py-1 text-right">Kelas</th>
            </tr>
          </thead>
          <tbody>
            {data.irbi_karhutla_by_year.map((row) => (
              <tr key={row.year}>
                <th scope="row" className="border-b border-slate-100 py-1 text-left font-normal text-slate-700">
                  {row.year}
                </th>
                <td className="border-b border-slate-100 py-1 text-right tabular-nums text-slate-800">
                  {formatDecimal(row.irbi_karhutla_score)}
                </td>
                <td className="border-b border-slate-100 py-1 text-right text-slate-800">
                  {row.irbi_karhutla_class ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DataNotes title="Catatan wajib panel ini" notes={data.notes} />
    </section>
  );
}