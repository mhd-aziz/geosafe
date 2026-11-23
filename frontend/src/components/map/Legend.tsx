import { useEffect, useState } from 'react';

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
 *
 * Catatan panjang diletakkan di `<details>`: kartu legenda sempat setinggi 407 px
 * dan menutupi 61% tinggi peta ketika semua halaman masih satu.
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

  const heatmap = layer === 'hotspot' && hotspotView === 'heatmap';
  // Di layar sempit legenda menutupi hampir seluruh peta (kartu 346 px pada peta
  // 489 px). Rincian kelas bisa dilipat; di desktop selalu terbuka seperti biasa.
  const narrow =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(max-width: 639px)').matches === true;
  const [showBody, setShowBody] = useState(!narrow);
  // Perubahan lebar layar (rotasi/penskalaan) harus mengikuti aturan yang sama:
  // desktop terbuka, layar sempit terlipat.
  useEffect(() => {
    const media = window.matchMedia?.('(max-width: 639px)');
    if (!media) {
      return;
    }
    const onChange = (event: MediaQueryListEvent) => setShowBody(!event.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white/95 p-2.5 text-xs shadow-lg backdrop-blur-sm">
      <h2 className="text-xs font-semibold text-slate-900">
        {heatmap
          ? 'Kepadatan titik panas (heatmap)'
          : villageActive
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
        {heatmap ? (
          <>
            seri <code>main</code>, tahun terpilih · titik berkoordinat diagregasi ke sel grid
          </>
        ) : villageActive ? (
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

      <button
        type="button"
        onClick={() => setShowBody((value) => !value)}
        className="mt-1 w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-100 sm:hidden"
      >
        {showBody ? 'Sembunyikan rincian legenda' : 'Tampilkan rincian legenda'}
      </button>

      {showBody ? (
        <>
      {heatmap ? (
        <p className="mt-2 text-[11px] leading-snug text-slate-600">
          Warna menyatakan <strong>kepadatan</strong> deteksi, bukan jumlah per wilayah: makin pekat,
          makin banyak titik di sel itu.
        </p>
      ) : (
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
      )}

      <p className="mt-2 text-[11px] leading-snug text-slate-600">
        {heatmap
          ? 'Kepadatan tidak memakai kelas angka; legenda ini hanya menunjukkan arah warnanya.'
          : villageActive
            ? 'Biru = tidak ada deteksi (bukan kerawanan rendah); abu-abu = kelas belum ada.'
            : riskActive
              ? 'Abu-abu = skor wilayah belum ada, bukan kerawanan rendah.'
              : eventsActive
                ? 'Abu-abu = tidak ada kejadian tercatat pada tahun terpilih.'
                : pointsActive
                  ? 'Titik pusat kecamatan/kabupaten hanya menunjukkan wilayah, bukan lokasi persis.'
                  : 'Abu-abu = wilayah belum punya baris fakta, bukan nol.'}
      </p>

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

      {latestShown ? (
        <p className="mt-2 border-t border-slate-200 pt-2 text-[11px] text-slate-600">
          Titik oranye = <strong>titik panas terkini</strong> (seri <code>nrt</code>), bukan seri
          arsip.
        </p>
      ) : null}

      <details className="mt-2 border-t border-slate-200 pt-1.5 text-[11px] leading-snug text-slate-600">
        <summary className="cursor-pointer font-medium text-slate-700">Catatan lengkap</summary>
        <div className="mt-1 space-y-1">
          {heatmap ? (
            <p>
              Warna menyatakan kepadatan deteksi, bukan jumlah per wilayah: makin pekat, makin banyak
              titik di sel itu. Karena itu legenda ini tidak memakai kelas angka seperti mode
              choropleth (`SRS-F-18` berlaku untuk kelas warna, bukan gradasi kepadatan). Peta baru
              menggambar mulai zoom 4.
            </p>
          ) : villageActive ? (
            <>
              <p>
                Biru berarti tidak ada satu pun deteksi titik panas di desa itu — bukan kerawanan
                rendah. Abu-abu berarti kelas desanya belum ada.
              </p>
              {villageWithoutProvince !== null ? (
                <p>
                  {villageWithoutProvince.toLocaleString('id-ID')} desa belum punya kode kecamatan
                  induk di sumbernya, sehingga tidak bisa dimuat lewat lapisan per provinsi —
                  pencarian wilayah tetap menemukannya.
                </p>
              ) : null}
            </>
          ) : riskActive ? (
            <p>
              Abu-abu berarti skor wilayah itu belum ada, bukan kerawanan rendah. Skor hanya dihitung
              untuk kabupaten/kota karena hanya tingkat itu yang punya seluruh indikator.
            </p>
          ) : eventsActive ? (
            <p>
              Abu-abu berarti tidak ada kejadian tercatat di wilayah itu pada tahun terpilih — BNPB
              mencatat kejadian yang terjadi, jadi angka nol tidak perlu ditulis.
            </p>
          ) : pointsActive ? (
            <p>
              Titik pusat kecamatan dan kabupaten/kota hanya menunjukkan wilayah kejadian, bukan
              lokasi persisnya: banyak kejadian berbagi satu koordinat pusat, dan titiknya digambar
              lebih besar supaya itu terlihat.
            </p>
          ) : (
            <p>
              Abu-abu berarti wilayah itu belum punya baris fakta pada tahun terpilih, jadi angkanya
              tidak boleh dibaca sebagai nol tanpa membaca catatan panel.
            </p>
          )}
          {latestShown ? (
            <p>
              Titik oranye di peta adalah <strong>titik panas terkini</strong> (24/48/72 jam, seri{' '}
              <code>nrt</code>) — seri berbeda yang tidak digambarkan oleh skala warna di atas dan
              tidak boleh dibaca sebagai kerawanan.
            </p>
          ) : null}
        </div>
      </details>
        </>
      ) : null}
    </div>
  );
}
