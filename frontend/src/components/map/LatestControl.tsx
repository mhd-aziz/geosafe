import { formatCount, formatMoment } from '../../lib/format';
import type { LatestSatellite, LatestWindow } from '../../types/geosafe';

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
  error: string | null;
  onRefresh: () => void;
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
  error,
  onRefresh,
}: LatestControlProps) {
  const available = satellites.filter((satellite) => satellite.available).map((s) => s.name);

  return (
    <div className="rounded-md border border-slate-300 bg-white/95 px-3 py-2 text-xs shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-slate-900">Titik panas terkini</span>
        <div
          role="group"
          aria-label="Jendela jam terkini"
          className="flex overflow-hidden rounded border border-slate-300"
        >
          {WINDOWS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={windowHours === option}
              onClick={() => onWindowChange(option)}
              className={`px-2 py-1 text-xs ${
                windowHours === option
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              {option} jam
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
        >
          Segarkan
        </button>
      </div>

      {loading ? (
        <p className="mt-1 text-slate-700">memuat jendela {windowHours} jam...</p>
      ) : (
        <>
          <p className="mt-1 text-slate-700">
            {formatCount(pointCount)} titik · tarikan {formatMoment(fetchedAt)}
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
        <p data-testid="latest-truncated" className="mt-1 text-amber-800">
          Titik tidak digambar: muatan melewati 2 MB. Penyempitan wilayah belum tersedia di
          antarmuka ini, dan jumlah titiknya tetap terbaca di panel.
        </p>
      ) : null}
    </div>
  );
}
