import type { EventPointsState } from '../../hooks/useEventPoints';
import { coordLevelSummary } from '../../lib/event-points';
import { formatCount } from '../../lib/format';
import { DataNotes } from '../common/DataNotes';

export interface EventPointsPanelProps {
  state: EventPointsState;
  year: number;
}

/** Kartu pendamping lapisan titik kejadian (`P5`).
 *
 * Tiga hal yang wajib terbaca: satu titik = satu kejadian tercatat BNPB
 * (`SRS-F-30`), jumlah titik tahun terpilih, dan sebaran ketelitian koordinatnya
 * (`SRS-F-41`) — angka terakhir itu yang mencegah peta dibaca lebih presisi
 * daripada datanya.
 */
export function EventPointsPanel({ state, year }: EventPointsPanelProps) {
  if (state.status === 'error') {
    return (
      <section aria-label="Ringkasan titik kejadian" className="space-y-2 text-xs text-slate-700">
        <h2 className="text-sm font-semibold text-slate-900">Titik kejadian {year}</h2>
        <p className="text-red-700">
          Titik kejadian gagal dimuat ({state.error ?? 'sebab tidak diketahui'}).
        </p>
      </section>
    );
  }

  if (state.data === null) {
    return <p className="text-sm text-slate-600">memuat titik kejadian…</p>;
  }

  return (
    <section aria-label="Ringkasan titik kejadian" className="space-y-2 text-xs text-slate-700">
      <h2 className="text-sm font-semibold text-slate-900">Titik kejadian {year}</h2>
      <dl className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
          <dt className="text-slate-600">Jumlah titik</dt>
          <dd className="text-sm font-semibold text-slate-900">{formatCount(state.data.count)}</dd>
        </div>
      </dl>
      <p>{coordLevelSummary(state.data.coord_level_counts)}</p>
      <p className="text-[11px] text-slate-600">
        Klik satu titik untuk melihat tanggal, wilayah, dan nilai dampaknya; angka wilayah dibuka
        lewat panel kabupaten/kota.
      </p>
      <DataNotes title="Catatan wajib lapisan ini" notes={state.data.notes} />
    </section>
  );
}
