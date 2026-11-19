import type { RemoteState } from '../../hooks/useRemoteData';
import { formatCount } from '../../lib/format';
import type { TrendData } from '../../types/geosafe';

export interface EventPanelProps {
  /** Seri nasional dari `/api/v1/analysis/national_trend`; dipakai sebagai pembanding. */
  trend: RemoteState<TrendData>;
  year: number;
}

/** Kartu pendamping lapisan kejadian (`P3`).
 *
 * Dua kewajiban SRS dipenuhi di sini: peta ini memuat **kejadian tercatat BNPB**,
 * bukan deteksi satelit (`SRS-F-30`), dan jumlah kejadian nasional tahun terpilih
 * ditampilkan sebagai pembanding (`SRS-F-31`). Angka nasionalnya dibaca dari
 * seri yang sudah dipakai halaman tren, bukan dijumlahkan dari tile yang sedang
 * tampil — tile hanya memuat wilayah di dalam kotak peta, jadi penjumlahannya
 * akan bergantung pada posisi peta.
 */
export function EventPanel({ trend, year }: EventPanelProps) {
  const nationalRow = trend.data?.event_by_year.find((row) => row.year === year) ?? null;

  return (
    <section aria-label="Ringkasan lapisan kejadian" className="space-y-2 text-xs text-slate-700">
      <h2 className="text-sm font-semibold text-slate-900">Kejadian karhutla {year}</h2>
      <p>
        Peta ini memuat <strong>kejadian tercatat BNPB</strong>, bukan deteksi satelit. Satu kejadian
        adalah peristiwa yang dilaporkan; satu titik panas adalah anomali termal dari satelit.
      </p>

      {trend.status === 'error' ? (
        <p className="text-red-700">
          Angka nasional gagal dimuat ({trend.error ?? 'sebab tidak diketahui'}), jadi pembandingnya
          tidak ditampilkan.
        </p>
      ) : trend.data === null ? (
        <p>memuat angka nasional…</p>
      ) : (
        <dl className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
            <dt className="text-slate-600">Kejadian nasional {year}</dt>
            <dd className="text-sm font-semibold text-slate-900">
              {formatCount(nationalRow?.event_count ?? null)}
            </dd>
          </div>
        </dl>
      )}

      {year === 2026 ? (
        <p className="text-[11px] text-slate-600">
          Angka 2026 adalah angka berjalan sampai data terakhir, bukan angka setahun penuh.
        </p>
      ) : null}
      <p className="text-[11px] text-slate-600">
        Wilayah abu-abu berarti tidak ada kejadian tercatat pada tahun itu; BNPB mencatat kejadian
        yang terjadi, jadi tidak ada baris nol yang perlu dibaca.
      </p>
    </section>
  );
}
