import { legendEntries } from '../../lib/choropleth';
import { MAP_SERIES } from '../../lib/constants';

/** Legenda choropleth dengan angka setiap kelas (`SRS-F-18`).
 *
 * Dua hal yang harus terbaca dari legenda ini: skala warna memakai seri `main`
 * saja (`SRS-F-17`), dan wilayah abu-abu bukan kelas rendah melainkan wilayah
 * yang belum punya baris fakta pada tahun terpilih.
 */
export function Legend() {
  return (
    <div className="max-w-xs rounded-md border border-slate-300 bg-white/95 p-3 text-xs shadow-sm">
      <h2 className="text-xs font-semibold text-slate-900">
        Jumlah titik panas per wilayah
      </h2>
      <p className="mt-1 text-[11px] text-slate-600">
        seri <code>{MAP_SERIES}</code> (arsip), tahun terpilih
      </p>

      <ul className="mt-2 space-y-1">
        {legendEntries().map((entry) => (
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
        Abu-abu berarti wilayah itu belum punya baris fakta pada tahun terpilih, jadi angkanya tidak
        boleh dibaca sebagai nol tanpa membaca catatan panel.
      </p>
    </div>
  );
}