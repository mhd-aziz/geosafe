import { legendEntries } from '../../lib/choropleth';
import { MAP_SERIES } from '../../lib/constants';
import { riskLegendEntries } from '../../lib/risk';
import type { MapLayer } from '../../types/geosafe';

export interface LegendProps {
  layer: MapLayer;
  /** Keterangan skema aktif pada lapisan kerawanan (dari API). */
  riskSchemeName?: string | null;
}

/** Legenda lapisan aktif, dengan angka setiap kelas (`SRS-F-18`).
 *
 * Dua lapisan memakai legenda berbeda karena maknanya berbeda: jumlah titik panas
 * (deteksi satelit per tahun) dan kelas kerawanan (skor susunan penelitian).
 * Wilayah abu-abu juga berbeda artinya — pada lapisan titik panas berarti
 * "belum ada baris fakta tahun itu", pada lapisan kerawanan berarti "skor belum
 * dihitung" — dan itu disebutkan, bukan disamakan.
 */
export function Legend({ layer, riskSchemeName }: LegendProps) {
  const riskActive = layer === 'risk';
  const entries = riskActive ? riskLegendEntries() : legendEntries();

  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white/95 p-3 text-xs shadow-lg backdrop-blur-sm sm:max-w-xs">
      <h2 className="text-xs font-semibold text-slate-900">
        {riskActive ? 'Kelas kerawanan kabupaten/kota' : 'Jumlah titik panas per wilayah'}
      </h2>
      <p className="mt-0.5 text-[11px] text-slate-600">
        {riskActive ? (
          <>
            {riskSchemeName ? `skema ${riskSchemeName} · ` : ''}susunan penelitian ini, bukan angka
            resmi BNPB
          </>
        ) : (
          <>
            seri <code>{MAP_SERIES}</code> (arsip), tahun terpilih
          </>
        )}
      </p>

      <ul className="mt-2 space-y-1">
        {entries.map((entry) => (
          <li key={entry.label} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block h-3 w-5 shrink-0 rounded-sm border border-slate-400"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-700">{entry.label}</span>
          </li>
        ))}
      </ul>

      <p className="mt-2 text-[11px] text-slate-600">
        {riskActive
          ? 'Abu-abu berarti skor wilayah itu belum ada, bukan kerawanan rendah. Skor hanya dihitung untuk kabupaten/kota karena hanya tingkat itu yang punya seluruh indikator.'
          : 'Abu-abu berarti wilayah itu belum punya baris fakta pada tahun terpilih, jadi angkanya tidak boleh dibaca sebagai nol tanpa membaca catatan panel.'}
      </p>
    </div>
  );
}
