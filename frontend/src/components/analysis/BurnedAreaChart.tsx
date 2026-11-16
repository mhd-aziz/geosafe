import { formatDecimal } from '../../lib/format';

export interface BurnedAreaChartProps {
  rows: { year: number; burned_area_ha: number | null }[];
}

/** Luas terbakar nasional (GWIS) sebagai **konteks**, grafik terpisah (`SRS-F-47`).
 *
 * Bukan seri ketiga data penelitian, dan hanya tersedia sampai 2025 serta hanya
 * pada tingkat nasional (`SRS-F-48`) — tahun yang tidak ada dibiarkan kosong,
 * bukan diisi nol.
 */
export function BurnedAreaChart({ rows }: BurnedAreaChartProps) {
  const values = rows.map((row) => row.burned_area_ha ?? 0);
  const max = Math.max(...values, 1);

  return (
    <figure className="rounded-md border border-slate-300 bg-white p-3">
      <h3 className="text-sm font-semibold text-slate-800">
        Luas terbakar nasional (GWIS) — konteks, bukan seri ketiga
      </h3>
      <p className="mt-1 text-xs text-slate-600">
        Hanya tersedia sampai 2025 dan hanya tingkat nasional; tahun 2026 dikosongkan, bukan nol.
      </p>

      <ul className="mt-2 space-y-1">
        {rows.map((row) => (
          <li key={row.year} className="flex items-center gap-2 text-xs">
            <span className="w-10 shrink-0 tabular-nums text-slate-600">{row.year}</span>
            <span
              aria-hidden="true"
              className="h-3 rounded-sm bg-amber-600"
              style={{ width: `${Math.max((row.burned_area_ha ?? 0) / max * 100, 1)}%` }}
            />
            <span className="tabular-nums text-slate-800">{formatDecimal(row.burned_area_ha)} ha</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}