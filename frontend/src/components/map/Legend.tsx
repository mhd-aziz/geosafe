import { legendEntries } from '../../lib/choropleth';
import { MAP_SERIES } from '../../lib/constants';
import { formatCount } from '../../lib/format';
import { eventLegendEntries } from '../../lib/events';
import { COORD_LEVEL_ORDER, COORD_LEVEL_STYLES } from '../../lib/event-points';
import { riskLegendEntries, villageLegendEntries } from '../../lib/risk';
import type { ConfidenceCode, HotspotView, MapLayer } from '../../types/geosafe';

export interface LegendProps {
  layer: MapLayer;
  /** Keterangan skema aktif pada lapisan kerawanan (dari API). */
  riskSchemeName?: string | null;
  /** Jumlah desa per kelas dari `/api/v1/provinces` (lapisan desa). */
  villageClassCounts?: Record<string, number>;
  /** Desa tanpa kode kecamatan induk: tidak bisa muncul di lapisan per provinsi. */
  villageWithoutProvince?: number | null;
  /** Titik panas terkini (`P2`) sedang digambar di atas lapisan tematik. */
  latestShown?: boolean;
  /** Kelas kepercayaan aktif (`SRS-F-15`); `null` = seluruh kelas. */
  confidence?: ConfidenceCode | null;
  /** Choropleth atau heatmap (`SRS-F-14`). */
  hotspotView?: HotspotView;
  /** Angka tampilan aktif dari `/api/v1/point_coverage` (`SRS-F-16`). */
  coverage?: {
    point_count: number;
    placed_count: number;
    outside_count: number;
    series: Record<string, number>;
  } | null;
}

/** Legenda lapisan aktif, dengan angka setiap kelas (`SRS-F-18`).
 *
 * Tiga lapisan memakai legenda berbeda karena maknanya berbeda: jumlah titik
 * panas (deteksi satelit per tahun), kelas kerawanan kabupaten/kota (skor susunan
 * penelitian), dan kelas kerawanan desa/kelurahan. Wilayah abu-abu juga berbeda
 * artinya — pada lapisan titik panas berarti "belum ada baris fakta tahun itu",
 * pada lapisan kerawanan berarti "skor/kelas belum dihitung", dan pada lapisan
 * desa berarti "kelas desa belum ada" — dan itu disebutkan, bukan disamakan.
 * Kelas `tidak_ada_deteksi` di lapisan desa bukan kerawanan rendah (`SRS-F-39`).
 */
export function Legend({
  layer,
  riskSchemeName,
  villageClassCounts = {},
  villageWithoutProvince = null,
  latestShown = false,
  confidence = null,
  coverage = null,
  hotspotView = 'choropleth',
}: LegendProps) {
  const riskActive = layer === 'risk';
  const villageActive = layer === 'risk_village';
  const eventsActive = layer === 'events';
  const pointsActive = layer === 'event_points';
  // Rincian seri apa adanya (`main`, `fill`); tidak digabung karena artinya beda.
  const seriesText =
    coverage === null
      ? ''
      : Object.entries(coverage.series)
          .map(([series, count]) => `${series} ${formatCount(count)}`)
          .join(' · ');
  const entries = villageActive
    ? villageLegendEntries(villageClassCounts)
    : riskActive
      ? riskLegendEntries()
      : eventsActive
        ? eventLegendEntries()
        : pointsActive
          ? COORD_LEVEL_ORDER.map((level) => ({
              label: COORD_LEVEL_STYLES[level].label,
              color: COORD_LEVEL_STYLES[level].color,
            }))
          : legendEntries();

  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white/95 p-3 text-xs shadow-lg backdrop-blur-sm sm:max-w-xs">
      {layer === 'hotspot' && hotspotView === 'heatmap' ? (
        <>
          <h2 className="text-xs font-semibold text-slate-900">Kepadatan titik panas (heatmap)</h2>
          <p className="mt-0.5 text-[11px] text-slate-600">
            seri <code>main</code>, tahun terpilih · titik berkoordinat diagregasi ke sel grid
          </p>
          <p className="mt-2 text-[11px] text-slate-600">
            Warna menyatakan <strong>kepadatan</strong> deteksi, bukan jumlah per wilayah: makin pekat,
            makin banyak titik di sel itu. Karena itu legenda ini tidak memakai kelas angka seperti
            mode choropleth (<code>SRS-F-18</code> berlaku untuk kelas warna, bukan gradasi kepadatan).
          </p>
        </>
      ) : (
      <>
      <h2 className="text-xs font-semibold text-slate-900">
        {villageActive
          ? 'Kelas kerawanan desa/kelurahan'
          : riskActive
            ? 'Kelas kerawanan kabupaten/kota'
            : eventsActive
              ? 'Jumlah kejadian karhutla per wilayah'
              : pointsActive
                ? 'Titik kejadian menurut ketelitian koordinat'
                : 'Jumlah titik panas per wilayah'}
      </h2>
      <p className="mt-0.5 text-[11px] text-slate-600">
        {villageActive ? (
          <>susunan penelitian ini, bukan angka resmi BNPB · satu provinsi, zoom 8 ke atas</>
        ) : riskActive ? (
          <>
            {riskSchemeName ? `skema ${riskSchemeName} · ` : ''}susunan penelitian ini, bukan angka
            resmi BNPB
          </>
        ) : eventsActive ? (
          <>kejadian tercatat BNPB, bukan deteksi satelit · tingkat kabupaten/kota</>
        ) : pointsActive ? (
          <>kejadian tercatat BNPB · satu titik = satu kejadian</>
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
        {villageActive ? (
          <>
            Biru berarti tidak ada satu pun deteksi titik panas di desa itu — bukan kerawanan
            rendah. Abu-abu berarti kelas desanya belum ada.
          </>
        ) : riskActive ? (
          'Abu-abu berarti skor wilayah itu belum ada, bukan kerawanan rendah. Skor hanya dihitung untuk kabupaten/kota karena hanya tingkat itu yang punya seluruh indikator.'
        ) : eventsActive ? (
          'Abu-abu berarti tidak ada kejadian tercatat di wilayah itu pada tahun terpilih — BNPB mencatat kejadian yang terjadi, jadi angka nol tidak perlu ditulis.'
        ) : pointsActive ? (
          'Titik pusat kecamatan dan kabupaten/kota hanya menunjukkan wilayah kejadian, bukan lokasi persisnya: banyak kejadian berbagi satu koordinat pusat, dan titiknya digambar lebih besar supaya itu terlihat.'
        ) : (
          'Abu-abu berarti wilayah itu belum punya baris fakta pada tahun terpilih, jadi angkanya tidak boleh dibaca sebagai nol tanpa membaca catatan panel.'
        )}
      </p>

      {villageActive && villageWithoutProvince !== null ? (
        <p className="mt-2 text-[11px] text-slate-600">
          {villageWithoutProvince.toLocaleString('id-ID')} desa belum punya kode kecamatan induk di
          sumbernya, sehingga tidak bisa dimuat lewat lapisan per provinsi — pencarian wilayah tetap
          menemukannya.
        </p>
      ) : null}

      {layer === 'hotspot' && coverage !== null ? (
        // `SRS-F-16`: angka yang dipakai tampilan aktif, termasuk titik yang di
        // luar poligon wilayah — yang terakhir tidak boleh dibaca sebagai nol.
        // Ketiga angka diambil dari kumpulan baris yang SAMA: `placed_count` dan
        // `outside_count` dihitung atas seluruh seri, jadi angka pertamanya juga
        // `point_count` (bukan `series.main`), dan rincian seri ditulis terpisah.
        <p className="mt-2 border-t border-slate-200 pt-2 text-[11px] text-slate-600">
          Tampilan aktif
          {confidence === null ? ' seluruh kelas kepercayaan' : ` kelas kepercayaan ${confidence}`}:{' '}
          {formatCount(coverage.point_count)} titik ({seriesText}) ·{' '}
          {formatCount(coverage.placed_count)} masuk poligon wilayah ·{' '}
          {formatCount(coverage.outside_count)} di luar (tidak dihitung nol).
        </p>
      ) : null}

      </>
      )}

      {latestShown ? (
        // Titik terkini tetap digambar di atas lapisan tematik apa pun; tanpa
        // keterangan ini, titik oranye di atas peta kerawanan terbaca sebagai
        // bagian dari kerawanan.
        <p className="mt-2 border-t border-slate-200 pt-2 text-[11px] text-slate-600">
          Titik oranye di peta adalah <strong>titik panas terkini</strong> (24/48/72 jam, seri{' '}
          <code>nrt</code>) — seri berbeda yang tidak digambarkan oleh skala warna di atas dan tidak
          boleh dibaca sebagai kerawanan.
        </p>
      ) : null}
    </div>
  );
}
