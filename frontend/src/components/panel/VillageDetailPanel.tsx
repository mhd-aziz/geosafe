import { fetchVillagePanel } from '../../api/geosafe';
import { useRemoteData } from '../../hooks/useRemoteData';
import { formatAreaKm2, formatCount, formatDecimal } from '../../lib/format';
import { villageRiskClassLabel } from '../../lib/risk';
import type { HotspotSeriesRow } from '../../types/geosafe';
import { DataNotes } from '../common/DataNotes';

/** Urutan kolom seri titik panas desa: arsip `main` lalu pengisi hari kosong `fill`.
 *
 * Seri tidak digabung, sama seperti panel kabupaten/kota: `main` + `fill` sama-sama
 * arsip tetapi berbeda sensor. Tabel desa memuat baris **bulanan** di samping baris
 * tahunan, dan penyaring `month is null` dilakukan API — panel tidak menyaring ulang.
 */
const SERIES_COLUMNS = ['main', 'fill'] as const;

function hotspotTable(
  rows: HotspotSeriesRow[],
): { year: number; values: Record<string, number | null> }[] {
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

export interface VillageDetailPanelProps {
  villageCode: string;
  onClose: () => void;
}

/** Panel desa/kelurahan (`W4`, `SRS-F-65`): identitas, titik panas per tahun,
 * kejadian per tahun, dan kelas kerawanan desa.
 *
 * Kelasnya susunan penelitian ini, bukan kelas resmi BNPB (`SRS-F-66`), jadi
 * keterangan itu ditulis di sebelah angkanya — bukan hanya di catatan bawah.
 */
export function VillageDetailPanel({ villageCode, onClose }: VillageDetailPanelProps) {
  const { status, data, error } = useRemoteData(
    () => fetchVillagePanel(villageCode),
    [villageCode],
  );

  if (status === 'loading') {
    return <p className="text-sm text-slate-600">memuat panel desa…</p>;
  }

  if (status === 'error') {
    return <p className="text-sm text-red-700">Panel desa gagal dimuat: {error}</p>;
  }

  if (!data) {
    return null;
  }

  const { village } = data;
  const hotspotRows = hotspotTable(data.hotspot_by_year);
  const parent = [village.district_name, village.region_name, village.province_name].filter(
    (part): part is string => Boolean(part),
  );

  return (
    <section aria-label="Panel desa/kelurahan" className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
            Desa/Kelurahan
          </p>
          <h2 className="text-lg font-semibold text-slate-900">{village.village_name}</h2>
          <p className="text-xs text-slate-600">
            {parent.join(' · ')} · kode {village.village_code}
          </p>
          <p className="text-xs text-slate-600">Luas {formatAreaKm2(village.area_km2)}</p>
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
          <dt className="text-slate-600">
            Kelas kerawanan desa <span className="text-slate-500">(susunan penelitian, bukan BNPB)</span>
          </dt>
          <dd className="text-sm font-semibold text-slate-900">
            {villageRiskClassLabel(data.risk_class_desa)}
          </dd>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
          <dt className="text-slate-600">Kepadatan titik panas (rata-rata 2020–2025)</dt>
          <dd className="text-sm font-semibold text-slate-900">
            {formatDecimal(data.hotspot_per_1000_km2)} per 1.000 km²
          </dd>
        </div>
      </dl>

      <div>
        <h3 className="text-sm font-semibold text-slate-800">
          Titik panas per tahun{' '}
          <span className="font-normal text-slate-600">(deteksi satelit, seri dipisah)</span>
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
          Kejadian karhutla per tahun{' '}
          <span className="font-normal text-slate-600">(catatan BNPB)</span>
        </h3>
        {data.event_by_year.length === 0 ? (
          <p className="mt-1 text-xs text-slate-600">
            Desa ini tidak punya baris kejadian pada 2020–2026; itu berarti angkanya belum dimuat,
            bukan berarti nol kejadian.
          </p>
        ) : (
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
        )}
      </div>

      <DataNotes title="Catatan wajib panel ini" notes={data.notes} />
    </section>
  );
}
