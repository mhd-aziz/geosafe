import { coordLevelLabel } from '../../lib/event-points';
import { formatCount } from '../../lib/format';
import type { EventPoint } from '../../types/geosafe';

export interface EventDetailPanelProps {
  point: EventPoint;
  onClose: () => void;
  /** Membuka panel kabupaten/kota wilayah kejadian (`SRS-F-44`). */
  onOpenRegion: (regionCode: string, regionName: string) => void;
}

/** Rincian satu kejadian (`W`-nya `P5`, `SRS-F-42`).
 *
 * Rincian ini datang bersama daftar titiknya, jadi tidak ada permintaan kedua saat
 * titik diklik. Nilai dampak ditampilkan apa adanya: `null` berarti tidak
 * dilaporkan, dan itu berbeda dari `0` yang berarti dilaporkan nol.
 */
export function EventDetailPanel({ point, onClose, onOpenRegion }: EventDetailPanelProps) {
  const chain = [point.village_name, point.district_name, point.region_name, point.province_name]
    .filter((part): part is string => Boolean(part))
    .join(' · ');

  return (
    <section aria-label="Rincian kejadian" className="space-y-3 text-xs text-slate-700">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
            Kejadian tercatat BNPB
          </p>
          <h2 className="text-lg font-semibold text-slate-900">
            {point.event_date ?? 'tanggal tidak ada'}
          </h2>
          <p className="text-slate-600">{chain || 'wilayah tidak diketahui'}</p>
          <p className="text-slate-600">
            {coordLevelLabel(point.coord_level)} · kode {point.point_id}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="min-h-9 cursor-pointer rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-100 sm:min-h-8"
        >
          Tutup
        </button>
      </header>

      <dl className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
          <dt className="text-slate-600">Meninggal</dt>
          <dd className="text-sm font-semibold text-slate-900">{formatCount(point.deaths)}</dd>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
          <dt className="text-slate-600">Luka</dt>
          <dd className="text-sm font-semibold text-slate-900">{formatCount(point.injured)}</dd>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
          <dt className="text-slate-600">Rumah rusak</dt>
          <dd className="text-sm font-semibold text-slate-900">
            {formatCount(point.houses_damaged)}
          </dd>
        </div>
      </dl>
      <p className="text-[11px] text-slate-600">
        Tanda “—” berarti sumber tidak melaporkan angkanya, sedangkan 0 berarti dilaporkan nol.
      </p>

      {point.region_code ? (
        <button
          type="button"
          onClick={() => onOpenRegion(point.region_code as string, point.region_name ?? 'wilayah')}
          className="min-h-9 cursor-pointer rounded-lg border border-teal-700 bg-teal-50 px-3 text-xs font-medium text-teal-900 transition-colors duration-200 hover:bg-teal-100 sm:min-h-8"
        >
          Buka panel kabupaten/kota
        </button>
      ) : null}

      {point.documentation_url ? (
        <p>
          <a
            className="text-teal-800 underline"
            href={point.documentation_url}
            target="_blank"
            rel="noreferrer"
          >
            Dokumentasi sumber
          </a>
        </p>
      ) : null}
    </section>
  );
}
