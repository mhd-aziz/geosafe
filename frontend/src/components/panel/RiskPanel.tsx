import type { RemoteState } from '../../hooks/useRemoteData';
import { formatCount, formatDecimal } from '../../lib/format';
import { riskLegendEntries } from '../../lib/risk';
import type { RiskSchemeCode, RiskSchemesResponse } from '../../types/geosafe';
import { DataNotes } from '../common/DataNotes';

export interface RiskPanelProps {
  state: RemoteState<RiskSchemesResponse>;
  scheme: RiskSchemeCode;
}

/** Panel keterangan lapisan kerawanan (`P4`, `SRS-F-34`..`F-37`).
 *
 * Angka di panel ini datang dari `/risk/schemes`: bobot tiap skema, hasil uji
 * sensitivitas (korelasi peringkat + jumlah wilayah berpindah kelas), dan
 * catatan yang menyebut bahwa skor ini susunan penelitian. IRBI 2025 tidak ikut
 * skor tampilan awal — pada skema B dan C IRBI masuk 20%, dan justru itulah yang
 * membuat uji sensitivitas perlu dibaca.
 */
export function RiskPanel({ state, scheme }: RiskPanelProps) {
  if (state.status === 'loading' && !state.data) {
    // `aria-live` supaya perubahan status diumumkan pembaca layar; tanpa itu
    // panel hanya berubah diam-diam.
    return (
      <p role="status" aria-live="polite" className="text-sm text-slate-600">
        memuat skema kerawanan...
      </p>
    );
  }

  if (state.status === 'error') {
    return (
      <section
        role="status"
        aria-live="polite"
        aria-label="Keterangan kerawanan"
        className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800"
      >
        Keterangan skema kerawanan gagal dimuat: {state.error}. Peta tetap memakai skema default
        (A) tanpa uji sensitivitasnya.
      </section>
    );
  }

  if (!state.data) {
    return null;
  }

  const { schemes, sensitivity, region_total: regionTotal, regions_without_score: withoutScore } =
    state.data;
  const active = schemes.find((item) => item.scheme_code === scheme);

  return (
    <section aria-label="Keterangan kerawanan" className="space-y-3">
      <header className="space-y-0.5">
        <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
          Kerawanan · skor susunan penelitian
        </p>
        <h2 className="text-sm font-semibold text-slate-900">
          Skema bobot &amp; uji sensitivitas
        </h2>
        <p className="text-xs text-slate-600">
          {formatCount(regionTotal)} kabupaten/kota dinilai · {formatCount(withoutScore)} tanpa skor ·
          skala 0–100 (persentil)
        </p>
      </header>

      <div>
        <h3 className="text-xs font-semibold text-slate-900">Skema</h3>
        <ul className="mt-1 space-y-1 text-xs">
          {schemes.map((item) => (
            <li
              key={item.scheme_code}
              aria-current={item.scheme_code === scheme ? 'true' : undefined}
              className={`flex items-start justify-between gap-2 rounded-lg border px-2 py-1.5 ${
                item.scheme_code === scheme
                  ? 'border-teal-600 bg-teal-50/70'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <span>
                <span className="font-semibold text-slate-900">
                  {item.scheme_code.toUpperCase()}
                </span>{' '}
                <span className="text-slate-700">{item.scheme_name}</span>
              </span>
              {item.scheme_code === scheme ? (
                <span className="shrink-0 rounded bg-teal-700 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  dipakai
                </span>
              ) : null}
            </li>
          ))}
        </ul>
        <p className="mt-1.5 text-[11px] text-slate-600">
          {active === undefined
            ? `Skema ${scheme.toUpperCase()} tidak ada di daftar balasan API, jadi keterangan bobotnya tidak bisa dipastikan di sini.`
            : active.includes_irbi
              ? 'Skema ini ikut memakai IRBI 2025 sebesar 20%; IRBI sendiri adalah indeks gabungan semua jenis bahaya, jadi skema A tetap dipakai sebagai tampilan awal.'
              : 'Skema A tidak memakai IRBI: IRBI 2025 ditampilkan sejajar sebagai konteks, bukan komponen skor.'}
        </p>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-slate-900">Uji sensitivitas antar skema</h3>
        <div className="mt-1 overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="text-left text-slate-600">
                <th className="border-b border-slate-200 py-1">Pasangan</th>
                <th className="border-b border-slate-200 py-1 text-right">Korelasi peringkat</th>
                <th className="border-b border-slate-200 py-1 text-right">Pindah kelas</th>
              </tr>
            </thead>
            <tbody>
              {sensitivity.map((row) => (
                <tr key={`${row.scheme_a}-${row.scheme_b}`}>
                  <th
                    scope="row"
                    className="border-b border-slate-100 py-1 text-left font-normal text-slate-700"
                  >
                    {row.scheme_a.toUpperCase()}–{row.scheme_b.toUpperCase()}
                  </th>
                  <td className="border-b border-slate-100 py-1 text-right tabular-nums text-slate-800">
                    {formatDecimal(row.spearman_rho, 4)}
                  </td>
                  <td className="border-b border-slate-100 py-1 text-right tabular-nums text-slate-800">
                    {formatCount(row.regions_class_changed)} (
                    {formatDecimal(row.pct_class_changed, 1)}%)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-1.5 text-[11px] text-slate-600">
          Semakin rendah korelasi dan semakin banyak wilayah berpindah kelas, semakin besar pengaruh
          pilihan bobot terhadap hasil — angka itu wajib dibaca sebelum menyimpulkan urutan
          kerawanan.
        </p>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-slate-900">Kelas yang digambar di peta</h3>
        <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-700">
          {riskLegendEntries().map((entry) => (
            <li key={entry.label} className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="inline-block h-3 w-5 rounded-sm border border-slate-400"
                style={{ backgroundColor: entry.color }}
              />
              {entry.label}
            </li>
          ))}
        </ul>
        <p className="mt-1.5 text-[11px] text-slate-600">
          Daftar ini sama dengan legenda di peta, termasuk penanda abu-abu untuk wilayah yang skornya
          belum ada — wilayah seperti itu bukan kerawanan rendah.
        </p>
      </div>

      <DataNotes title="Catatan wajib lapisan kerawanan" notes={state.data.notes} />
    </section>
  );
}
