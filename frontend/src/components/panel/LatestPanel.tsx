import type { RequestStatus } from '../../hooks/useRegionSearch';
import { formatCount, formatMoment, formatPercent } from '../../lib/format';
import type { LatestSummary } from '../../types/geosafe';

export interface LatestPanelProps {
  summary: LatestSummary | null;
  status: RequestStatus;
  error: string | null;
}

/** Panel ringkasan terkini (`W1`, `SRS-F-57`/`F-58`).
 *
 * Angka di panel ini berasal dari `/latest/summary` — generasi cache yang sama
 * dengan titik yang digambar peta, sehingga jumlah titik di panel dan di peta
 * tidak bisa berbeda. Provinsi yang jumlahnya kurang dari sepuluh dikirim apa
 * adanya oleh API, jadi panel tidak menambah baris nol.
 */
export function LatestPanel({ summary, status, error }: LatestPanelProps) {
  if (status === 'loading' && !summary) {
    return <p className="text-sm text-slate-600">memuat ringkasan titik terkini...</p>;
  }

  if (!summary) {
    if (status === 'error') {
      return <p className="text-sm text-red-700">Ringkasan titik terkini gagal dimuat: {error}</p>;
    }
    return null;
  }

  const availableCount = summary.satellites.filter((satellite) => satellite.available).length;

  return (
    <section aria-label="Panel titik panas terkini" className="space-y-3">
      <header>
        <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
          Terkini · {summary.window_hours} jam · seri <code>{summary.series}</code>
        </p>
        <h2 className="text-sm font-semibold text-slate-900">Ringkasan nasional titik panas</h2>
        <p className="text-xs text-slate-600">
          tarikan {formatMoment(summary.fetched_at)} · jendela mulai{' '}
          {formatMoment(summary.window_start)}
        </p>
      </header>

      {summary.using_snapshot ? (
        <p
          data-testid="latest-panel-snapshot"
          className="rounded border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-900"
        >
          Snapshot: data per {formatMoment(summary.fetched_at)} (umur{' '}
          {Math.round(summary.snapshot_age_seconds / 60)} menit).
        </p>
      ) : null}

      <dl className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded border border-slate-200 bg-slate-50 p-2">
          <dt className="text-slate-600">Jumlah titik</dt>
          <dd className="text-sm font-semibold text-slate-900">
            {formatCount(summary.point_count)}
          </dd>
        </div>
        <div className="rounded border border-slate-200 bg-slate-50 p-2">
          <dt className="text-slate-600">Kabupaten/kota terdampak</dt>
          <dd className="text-sm font-semibold text-slate-900">
            {formatCount(summary.regions_with_points)}
          </dd>
        </div>
        <div className="rounded border border-slate-200 bg-slate-50 p-2">
          <dt className="text-slate-600">Titik di luar poligon</dt>
          <dd className="text-sm font-semibold text-slate-900">
            {formatCount(summary.points_outside_polygon)} (
            {formatPercent(summary.points_outside_polygon, summary.point_count)})
          </dd>
        </div>
        <div className="rounded border border-slate-200 bg-slate-50 p-2">
          <dt className="text-slate-600">Satelit tersedia</dt>
          <dd className="text-sm font-semibold text-slate-900">
            {availableCount} dari {summary.satellites.length}
          </dd>
        </div>
      </dl>

      <div>
        <h3 className="text-xs font-semibold text-slate-900">
          Provinsi dengan titik terbanyak ({summary.top_provinces.length})
        </h3>
        {summary.top_provinces.length === 0 ? (
          <p className="text-xs text-slate-600">
            Tidak ada titik pada jendela ini, jadi tidak ada provinsi yang bisa diperingkat.
          </p>
        ) : (
          <ol className="mt-1 space-y-1 text-xs text-slate-700">
            {summary.top_provinces.map((province) => (
              <li key={province.province_code} className="flex justify-between gap-2">
                <span>{province.province_name}</span>
                <span className="font-medium text-slate-900">
                  {formatCount(province.point_count)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div>
        <h3 className="text-xs font-semibold text-slate-900">Satelit sumber</h3>
        <ul className="mt-1 space-y-1 text-xs text-slate-700">
          {summary.satellites.map((satellite) => (
            <li key={satellite.name} className="flex justify-between gap-2">
              <span>
                {satellite.name}
                {satellite.available ? '' : ' (tidak mengirim titik)'}
              </span>
              <span className="text-slate-500">{satellite.last_acq_date ?? '—'}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-700">
        Angka terkini tidak boleh dijumlahkan dengan angka arsip 2020–2026: seri ini berasal dari
        pemrosesan berbeda, dan peta choropleth memakai seri arsip.
      </p>
    </section>
  );
}