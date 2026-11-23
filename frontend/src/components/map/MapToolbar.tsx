import type { RemoteState } from '../../hooks/useRemoteData';
import { YEARS } from '../../lib/constants';
import type { MapPageSlug } from '../../lib/map-pages';
import { DEFAULT_RISK_SCHEME } from '../../lib/risk';
import type {
  ConfidenceCode,
  EventView,
  HotspotView,
  MapLevel,
  RiskScheme,
  RiskSchemeCode,
  RiskSchemesResponse,
  RiskView,
  VillageProvincesResponse,
} from '../../types/geosafe';
import { Segmented } from '../common/Segmented';

export interface MapToolbarProps {
  page: MapPageSlug;
  /** Choropleth atau heatmap di halaman titik panas (`SRS-F-14`). */
  hotspotView: HotspotView;
  onHotspotViewChange: (view: HotspotView) => void;
  /** Choropleth kejadian atau titik kejadian di halaman kejadian (`P5`). */
  eventView: EventView;
  onEventViewChange: (view: EventView) => void;
  /** Skor kabupaten/kota atau kelas desa di halaman kerawanan (`P4`). */
  riskView: RiskView;
  onRiskViewChange: (view: RiskView) => void;
  /** Lapisan titik panas terkini (`P2`) digambar di atas peta titik panas. */
  showLatest: boolean;
  onShowLatestChange: (show: boolean) => void;
  riskScheme: RiskSchemeCode;
  onRiskSchemeChange: (scheme: RiskSchemeCode) => void;
  /** Status permintaan `/risk/schemes`; ikut menentukan pesan yang tampil. */
  riskSchemes: RemoteState<RiskSchemesResponse>;
  provinceCode: string | null;
  onProvinceChange: (provinceCode: string) => void;
  /** Status permintaan `/provinces`; isi pemilih provinsi lapisan desa. */
  provinces: RemoteState<VillageProvincesResponse>;
  year: number;
  level: MapLevel;
  onYearChange: (year: number) => void;
  onLevelChange: (level: MapLevel) => void;
  /** Kelas kepercayaan aktif (`SRS-F-15`); `null` = seluruh kelas. */
  confidence: ConfidenceCode | null;
  onConfidenceChange: (confidence: ConfidenceCode | null) => void;
}

/** Kendali peta untuk satu halaman, dalam satu baris.
 *
 * Halaman memilih kendali yang berlaku, bukan menonaktifkan kendali lapisan lain:
 * tahun dan tingkat hanya di halaman titik panas/kejadian, skema bobot hanya di
 * skor kerawanan kabupaten/kota, dan pemilih provinsi hanya di kelas desa.
 * Alasan kendali yang tidak ada tetap ditulis di catatan lapisan (`SRS-F-37`,
 * `SRS-F-38`). Satu baris membuat kartu tidak lagi menutupi separuh peta.
 */
export function MapToolbar({
  page,
  hotspotView,
  onHotspotViewChange,
  eventView,
  onEventViewChange,
  riskView,
  onRiskViewChange,
  showLatest,
  onShowLatestChange,
  riskScheme,
  onRiskSchemeChange,
  riskSchemes,
  provinceCode,
  onProvinceChange,
  provinces,
  year,
  level,
  onYearChange,
  onLevelChange,
  confidence,
  onConfidenceChange,
}: MapToolbarProps) {
  const hotspotPage = page === 'titik-panas';
  const eventsPage = page === 'kejadian';
  const riskPage = page === 'kerawanan';
  const schemeOptions = riskSchemes.data?.schemes ?? FALLBACK_SCHEMES;
  const activeScheme = schemeOptions.find((scheme) => scheme.scheme_code === riskScheme);
  const provinceOptions = provinces.data?.provinces ?? [];

  return (
    <div className="w-full max-w-full space-y-2 rounded-xl border border-slate-200 bg-white/95 p-2.5 shadow-lg backdrop-blur-sm sm:w-auto">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {!riskPage ? (
          <label className="flex items-center gap-2 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
            Tahun
            <select
              value={year}
              onChange={(event) => onYearChange(Number(event.target.value))}
              className="min-h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-900 transition-colors duration-200 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-teal-700 sm:min-h-8"
            >
              {YEARS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {hotspotPage ? (
          <Segmented
            label="Tingkat"
            value={level}
            onChange={onLevelChange}
            options={[
              { value: 'regency', label: 'Kabupaten/Kota' },
              { value: 'province', label: 'Provinsi' },
            ]}
          />
        ) : null}

        {hotspotPage ? (
          <div data-testid="hotspot-view-control">
            <Segmented
              label="Tampilan"
              value={hotspotView}
              onChange={onHotspotViewChange}
              options={[
                { value: 'choropleth', label: 'Choropleth', title: 'Jumlah titik panas per wilayah' },
                {
                  value: 'heatmap',
                  label: 'Heatmap',
                  title: 'Kepadatan titik panas berkoordinat, diagregasi per sel grid (SRS-F-14)',
                },
              ]}
            />
          </div>
        ) : null}

        {eventsPage ? (
          <Segmented
            label="Tampilan"
            value={eventView}
            onChange={onEventViewChange}
            options={[
              {
                value: 'choropleth',
                label: 'Choropleth',
                title: 'Jumlah kejadian tercatat BNPB per kabupaten/kota',
              },
              {
                value: 'points',
                label: 'Titik kejadian',
                title:
                  'Titik tiap kejadian tercatat BNPB, dibedakan menurut ketelitian koordinat (P5)',
              },
            ]}
          />
        ) : null}

        {riskPage ? (
          <Segmented
            label="Tampilan"
            value={riskView}
            onChange={onRiskViewChange}
            options={[
              {
                value: 'regency',
                label: 'Kabupaten/kota',
                title: 'Skor kerawanan susunan penelitian (P4)',
              },
              {
                value: 'village',
                label: 'Desa/kelurahan',
                title: 'Kelas kerawanan desa/kelurahan per provinsi (P4, SRS-F-38)',
              },
            ]}
          />
        ) : null}

        {hotspotPage ? (
          <div data-testid="confidence-control">
            <Segmented
              label="Kepercayaan"
              value={(confidence ?? 'semua') as 'semua' | ConfidenceCode}
              onChange={(next) => onConfidenceChange(next === 'semua' ? null : next)}
              options={[
                { value: 'semua', label: 'Semua', title: 'Seluruh kelas kepercayaan (angka resmi)' },
                { value: 'h', label: 'h', title: 'Kepercayaan tinggi' },
                { value: 'n', label: 'n', title: 'Kepercayaan nominal' },
                { value: 'l', label: 'l', title: 'Kepercayaan rendah' },
              ].map((option) => ({
                ...option,
                value: option.value as 'semua' | ConfidenceCode,
                // API hanya menyimpan baris per kelas di tingkat kabupaten/kota.
                disabled: level === 'province',
                title: `${option.title}${
                  level === 'province' ? ' — tidak tersedia di tingkat provinsi' : ''
                }`,
              }))}
            />
          </div>
        ) : null}

        {hotspotPage ? (
          <label className="flex items-center gap-2 text-[11px] font-medium text-slate-700">
            <input
              type="checkbox"
              checked={showLatest}
              onChange={(event) => onShowLatestChange(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-teal-700"
            />
            Tampilkan titik terkini
          </label>
        ) : null}
      </div>

      {riskPage && riskView === 'regency' ? (
        <div className="space-y-1 border-t border-slate-100 pt-2">
          <Segmented
            label="Skema"
            value={riskScheme}
            onChange={onRiskSchemeChange}
            options={schemeOptions.map((scheme) => ({
              value: scheme.scheme_code,
              label: scheme.scheme_code.toUpperCase(),
              title: scheme.scheme_name,
            }))}
          />
          <p className="text-[11px] leading-snug text-slate-600">
            {riskSchemes.status === 'error'
              ? `keterangan skema gagal dimuat (${riskSchemes.error ?? 'sebab tidak diketahui'}); peta tetap memakai skema ${riskScheme.toUpperCase()} tanpa hasil uji sensitivitasnya`
              : riskSchemes.data === null
                ? 'keterangan skema sedang dimuat...'
                : `${activeScheme?.scheme_name ?? 'skema tidak dikenal'}${
                    riskScheme === DEFAULT_RISK_SCHEME
                      ? ' — tampilan awal; IRBI 2025 ditampilkan sejajar, bukan bagian skor'
                      : ' — skema uji; IRBI 2025 ikut masuk 20%'
                  }`}
          </p>
        </div>
      ) : null}

      {riskPage && riskView === 'village' ? (
        <div className="space-y-1.5 border-t border-slate-100 pt-2">
          <label className="flex items-center gap-2 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
            Provinsi
            <select
              value={provinceCode ?? ''}
              disabled={provinceOptions.length === 0}
              onChange={(event) => onProvinceChange(event.target.value)}
              className="min-h-9 max-w-[13rem] rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-900 transition-colors duration-200 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 sm:min-h-8"
            >
              <option value="">pilih provinsi...</option>
              {provinceOptions.map((province) => (
                <option key={province.province_code} value={province.province_code}>
                  {province.province_name}
                </option>
              ))}
            </select>
          </label>
          <p className="text-[11px] leading-snug text-slate-600">
            {provinces.status === 'error'
              ? `daftar provinsi gagal dimuat (${provinces.error ?? 'sebab tidak diketahui'}); lapisan desa tidak bisa dipilih`
              : provinces.data === null
                ? 'daftar provinsi sedang dimuat...'
                : `${provinceOptions.length} provinsi · ${
                    provinceCode === null
                      ? 'pilih satu provinsi untuk menggambar lapisan desa'
                      : 'peta sudah diperbesar ke provinsi terpilih'
                  }`}
          </p>
        </div>
      ) : null}

      <details className="border-t border-slate-100 pt-1.5 text-[11px] leading-snug text-slate-600">
        <summary className="cursor-pointer font-medium text-slate-700">Catatan lapisan</summary>
        <div className="mt-1 space-y-1">
          {hotspotPage ? (
            <>
              <p>
                Choropleth mewarnai tiap wilayah menurut kelas jumlah titik panas, dengan angka di
                legenda. Heatmap memakai titik panas berkoordinat yang diagregasi ke sel grid dan
                baru menggambar mulai zoom 4 — warnanya kepadatan, bukan kelas angka, jadi legenda
                angkanya tidak berlaku.
              </p>
              <p>
                Menyaring kepercayaan memperbarui angka dan warna peta. Kelas h + n + l menjumlah
                tepat ke angka tanpa penyaring, jadi keduanya tidak pernah bertentangan. Di tingkat
                provinsi penyaring dinonaktifkan karena basis data tidak menyimpan baris provinsi
                per kelas.
              </p>
              <p>
                Titik oranye adalah <strong>titik panas terkini</strong> (24/48/72 jam, seri{' '}
                <code>nrt</code>) — seri berbeda yang tidak pernah dijumlahkan dengan seri arsip.
              </p>
            </>
          ) : eventsPage ? (
            <>
              <p>
                Peta ini memuat <strong>kejadian tercatat BNPB</strong>, bukan deteksi satelit.
                Tingkat wilayah dikunci ke kabupaten/kota, dan abu-abu berarti tidak ada kejadian
                tercatat pada tahun terpilih.
              </p>
              {eventView === 'points' ? (
                <p>
                  Setiap titik adalah satu <strong>kejadian tercatat BNPB</strong>. Warna dan ukuran
                  titik menunjukkan ketelitian koordinatnya: biru = desa/kelurahan (paling teliti),
                  cokelat = titik pusat kecamatan, merah tua = titik pusat kabupaten/kota. Klik satu
                  titik untuk rinciannya.
                </p>
              ) : null}
            </>
          ) : (
            <>
              <p>
                Lapisan kerawanan adalah ringkasan satu periode, jadi penyaring tahun tidak berlaku;
                skornya hanya dihitung untuk kabupaten/kota (`SRS-F-37`), jadi tingkat provinsi juga
                tidak ada di halaman ini.
              </p>
              {riskView === 'village' ? (
                <p>
                  Kelas kerawanan desa adalah susunan penelitian ini dan hanya ada per desa. Lapisan
                  ini dimuat satu provinsi pada satu waktu dan baru tampil pada zoom 8 ke atas.
                </p>
              ) : null}
            </>
          )}
        </div>
      </details>
    </div>
  );
}

/** Tombol skema saat `/risk/schemes` belum termuat: kode saja, tanpa label bobot. */
const FALLBACK_SCHEMES: RiskScheme[] = (['a', 'b', 'c'] as RiskSchemeCode[]).map((code) => ({
  scheme_code: code,
  scheme_name: code === DEFAULT_RISK_SCHEME ? 'skema tampilan awal' : 'skema uji',
  weights: { hotspot: null, event: null, irbi: null },
  includes_irbi: code !== DEFAULT_RISK_SCHEME,
  is_default: code === DEFAULT_RISK_SCHEME,
}));
