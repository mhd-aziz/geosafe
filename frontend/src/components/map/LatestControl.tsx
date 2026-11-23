import { formatCount, formatMoment } from '../../lib/format';
import type { LatestSatellite, LatestWindow } from '../../types/geosafe';
import { Segmented } from '../common/Segmented';

const WINDOWS: LatestWindow[] = [24, 48, 72];

export interface LatestControlProps {
  windowHours: LatestWindow;
  onWindowChange: (windowHours: LatestWindow) => void;
  /** Data yang tampil sudah berasal dari jendela terpilih; `false` = masih memuat. */
  loading: boolean;
  fetchedAt: string | null;
  satellites: LatestSatellite[];
  usingSnapshot: boolean;
  pointCount: number | null;
  truncated: boolean;
  /** `true` = ada kotak peta yang sedang membatasi titik (parameter `bbox` aktif). */
  bboxActive: boolean;
  /** Kotak peta yang tampil belum diketahui (peta belum siap): tombol dimatikan. */
  canUseViewport: boolean;
  error: string | null;
  onRefresh: () => void;
  /** Pakai kotak peta yang sedang tampil sebagai `bbox` permintaan berikutnya. */
  onUseViewport: () => void;
  /** Lepas batas kotak: kembali ke seluruh Indonesia. */
  onClearBounds: () => void;
}

/** Kendali lapisan titik terkini di atas peta (`SRS-F-21`, `F-23`, `F-27`).
 *
 * Jendela 24/48/72 jam, waktu tarikan terakhir, dan satelit yang benar-benar
 * mengirim titik pada tarikan itu. Tombol segarkan tetap ada meskipun penyegaran
 * otomatis berjalan setiap 15 menit (`SRS-F-24`): pengguna perlu bisa memaksa
 * tarikan baru tanpa menunggu jendela itu habis.
 *
 * Angka jendela sebelumnya tidak ditampilkan saat pengguna baru berganti jendela
 * (`loading`): tombol yang sudah menunjuk jendela baru sementara angkanya masih
 * jendela lama adalah dua bacaan berbeda di satu layar.
 *
 * Muatan yang melewati 2 MB membuat API mengirim `points: null` + `truncated`
 * (`API-P2.md` bagian 1). Di sini pengguna diberi satu jalan keluar yang benar-benar
 * bisa diikuti: kirim kotak peta yang sedang tampak sebagai `bbox`, bukan menyuruh
 * memilih jendela lebih pendek (24 jam sudah yang terpendek).
 */
export function LatestControl({
  windowHours,
  onWindowChange,
  loading,
  fetchedAt,
  satellites,
  usingSnapshot,
  pointCount,
  truncated,
  bboxActive,
  canUseViewport,
  error,
  onRefresh,
  onUseViewport,
  onClearBounds,
}: LatestControlProps) {
  const available = satellites.filter((satellite) => satellite.available).map((s) => s.name);

  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white/95 p-2.5 text-xs shadow-lg backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-slate-900">Titik panas terkini</span>
        <Segmented
          label="Jendela"
          value={windowHours}
          onChange={onWindowChange}
          options={WINDOWS.map((option) => ({ value: option, label: `${option} jam` }))}
        />
        <button
          type="button"
          onClick={onRefresh}
          className="min-h-9 cursor-pointer rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-teal-700 sm:min-h-8"
        >
          Segarkan
        </button>
      </div>

      {loading ? (
        <p className="mt-1 text-slate-700">memuat jendela {windowHours} jam...</p>
      ) : (
        <>
          <p className="mt-1 text-slate-700">
            {formatCount(pointCount)} titik{bboxActive ? ' di dalam kotak peta' : ''} · tarikan{' '}
            {formatMoment(fetchedAt)}
          </p>
          <p className="text-slate-600">
            Satelit tersedia:{' '}
            {available.length > 0 ? available.join(' · ') : 'belum ada satelit yang mengirim titik'}
          </p>
        </>
      )}

      {error ? (
        // Tarikan gagal setelah data pernah tampil: angkanya sengaja tidak
        // dikosongkan, jadi kegagalan itu harus terlihat di sebelah angkanya.
        <p data-testid="latest-error" className="mt-1 text-amber-800">
          Tarikan terakhir gagal ({error}).
        </p>
      ) : null}

      {usingSnapshot ? (
        <p data-testid="latest-snapshot" className="mt-1 text-amber-800">
          data per {formatMoment(fetchedAt)} — tarikan terakhir gagal, snapshot yang dipakai
        </p>
      ) : null}

      {truncated ? (
        <div data-testid="latest-truncated" className="mt-1 text-amber-800">
          <p>
            Titik tidak digambar: muatan melewati 2 MB. Perbesar peta ke wilayah yang ingin dilihat,
            lalu batasi permintaan ke kotak yang tampak.
          </p>
          <button
            type="button"
            onClick={onUseViewport}
            disabled={!canUseViewport}
            className="mt-1 min-h-8 cursor-pointer rounded-lg border border-amber-300 bg-white px-3 text-xs font-medium text-amber-900 transition-colors duration-200 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Batasi ke area tampak
          </button>
        </div>
      ) : null}

      {bboxActive ? (
        <p data-testid="latest-bbox" className="mt-1 text-slate-700">
          Hanya titik di dalam kotak peta.{' '}
          <button
            type="button"
            onClick={onClearBounds}
            className="min-h-8 cursor-pointer rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-100"
          >
            Seluruh Indonesia
          </button>
        </p>
      ) : null}
    </div>
  );
}
