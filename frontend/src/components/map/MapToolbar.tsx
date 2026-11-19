import type { RemoteState } from '../../hooks/useRemoteData';
import { YEARS } from '../../lib/constants';
import { DEFAULT_RISK_SCHEME } from '../../lib/risk';
import type {
  ConfidenceCode,
  HotspotView,
  MapLayer,
  MapLevel,
  RiskScheme,
  RiskSchemeCode,
  RiskSchemesResponse,
  VillageProvincesResponse,
} from '../../types/geosafe';
import { Segmented } from '../common/Segmented';

export interface MapToolbarProps {
  layer: MapLayer;
  onLayerChange: (layer: MapLayer) => void;
  riskScheme: RiskSchemeCode;
  onRiskSchemeChange: (scheme: RiskSchemeCode) => void;
  /** Status permintaan `/risk/schemes`; ikut menentukan pesan yang tampil. */
  riskSchemes: RemoteState<RiskSchemesResponse>;
  /** Provinsi terpilih untuk lapisan desa (`SRS-F-38`). */
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
  /** Choropleth atau heatmap (`SRS-F-14`). */
  hotspotView: HotspotView;
  onHotspotViewChange: (view: HotspotView) => void;
}

/** Kendali peta: lapisan, tahun, tingkat wilayah, skema bobot, provinsi lapisan desa.
 *
 * Tiga lapisan tematik tidak pernah bersamaan (`P1` dan `P4`): lapisan titik panas
 * memakai filter tahun dan saklar tingkat (`SRS-F-12`, `SRS-F-13`), lapisan
 * kerawanan kabupaten/kota tidak bertahun dan hanya ada di tingkat itu
 * (`SRS-F-37`), sedangkan lapisan kerawanan desa dimuat **per provinsi** dan baru
 * pada zoom 8 ke atas (`SRS-F-38`). Karena itu kendali yang tidak berlaku
 * dinonaktifkan dengan sebabnya, bukan disembunyikan diam-diam.
 */
export function MapToolbar({
  layer,
  onLayerChange,
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
  hotspotView,
  onHotspotViewChange,
}: MapToolbarProps) {
  // Tahun berlaku untuk lapisan titik panas dan lapisan kejadian; dua lapisan
  // kerawanan adalah ringkasan satu periode pada tingkat tetap.
  const hotspotActive = layer === 'hotspot';
  const eventsActive = layer === 'events';
  const pointsActive = layer === 'event_points';
  const yearlyActive = hotspotActive || eventsActive || pointsActive;
  const riskActive = layer === 'risk';
  const villageActive = layer === 'risk_village';
  const schemeOptions = riskSchemes.data?.schemes ?? FALLBACK_SCHEMES;
  const activeScheme = schemeOptions.find((scheme) => scheme.scheme_code === riskScheme);
  const provinceOptions = provinces.data?.provinces ?? [];

  return (
    <div className="w-full space-y-2 rounded-xl border border-slate-200 bg-white/95 p-2.5 shadow-lg backdrop-blur-sm sm:w-auto">
      <Segmented
        label="Lapisan"
        value={layer}
        onChange={onLayerChange}
        options={[
          { value: 'hotspot', label: 'Titik panas', title: 'Jumlah titik panas per tahun (P1)' },
          {
            value: 'events',
            label: 'Kejadian',
            title: 'Jumlah kejadian karhutla tercatat BNPB per tahun, tingkat kabupaten/kota (P3)',
          },
          {
            value: 'event_points',
            label: 'Titik kejadian',
            title: 'Titik tiap kejadian tercatat BNPB, dibedakan menurut ketelitian koordinat (P5)',
          },
          {
            value: 'risk',
            label: 'Kerawanan',
            title: 'Skor kerawanan susunan penelitian, tingkat kabupaten/kota (P4)',
          },
          {
            value: 'risk_village',
            label: 'Kerawanan desa',
            title: 'Kelas kerawanan desa/kelurahan per provinsi (P4, SRS-F-38)',
          },
        ]}
      />

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <label className="flex items-center gap-2 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
          Tahun
          <select
            value={year}
            disabled={!yearlyActive}
            title={
              yearlyActive
                ? undefined
                : 'Lapisan kerawanan adalah ringkasan satu periode, bukan seri tahunan'
            }
            onChange={(event) => onYearChange(Number(event.target.value))}
            className="min-h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-900 transition-colors duration-200 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 sm:min-h-8"
          >
            {YEARS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <Segmented
          label="Tingkat"
          value={level}
          onChange={onLevelChange}
          options={[
            { value: 'regency', label: 'Kabupaten/Kota' },
            {
              value: 'province',
              label: 'Provinsi',
              disabled: !hotspotActive,
              title: hotspotActive
                ? undefined
                : eventsActive
                  ? 'Kejadian dipetakan per kabupaten/kota (SRS-F-28)'
                  : pointsActive
                    ? 'Titik kejadian tidak punya tingkat provinsi (SRS-F-40)'
                    : 'Skor kerawanan hanya dihitung untuk kabupaten/kota (SRS-F-37)',
            },
          ]}
        />
      </div>

      {eventsActive ? (
        // `SRS-F-30`: pembaca harus tahu ini catatan kejadian, bukan deteksi satelit.
        <p className="text-[11px] leading-snug text-slate-600">
          Peta ini memuat <strong>kejadian tercatat BNPB</strong>, bukan deteksi satelit. Tingkat
          wilayah dikunci ke kabupaten/kota (`SRS-F-28`), dan abu-abu berarti tidak ada kejadian
          tercatat pada tahun terpilih.
        </p>
      ) : null}

      {hotspotActive ? (
        <div className="space-y-1" data-testid="hotspot-view-control">
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
          <p className="text-[11px] leading-snug text-slate-600">
            {hotspotView === 'heatmap'
              ? 'Heatmap memakai titik panas berkoordinat tahun terpilih, diagregasi ke sel grid dan diwarnai menurut kepadatan — bukan kelas angka, jadi legenda angkanya tidak berlaku. Peta baru menggambar mulai zoom 4.'
              : 'Choropleth mewarnai tiap wilayah menurut kelas jumlah titik panas, dengan angka di legenda.'}
          </p>
        </div>
      ) : null}

      {hotspotActive ? (
        <div className="space-y-1" data-testid="confidence-control">
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
          <p className="text-[11px] leading-snug text-slate-600">
            {level === 'province'
              ? 'Penyaring kepercayaan hanya berlaku di tingkat kabupaten/kota: basis data tidak menyimpan baris provinsi per kelas.'
              : 'Menyaring memperbarui angka dan warna peta. Kelas h + n + l menjumlah tepat ke angka tanpa penyaring, jadi keduanya tidak pernah bertentangan.'}
          </p>
        </div>
      ) : null}

      {pointsActive ? (
        // `SRS-F-41`: arti tingkat ketelitian koordinat wajib dinyatakan.
        <p className="text-[11px] leading-snug text-slate-600">
          Setiap titik adalah satu <strong>kejadian tercatat BNPB</strong>. Warna dan ukuran titik
          menunjukkan ketelitian koordinatnya: biru = desa/kelurahan (paling teliti), cokelat = titik
          pusat kecamatan, merah tua = titik pusat kabupaten/kota. Klik satu titik untuk rinciannya.
        </p>
      ) : null}

      {villageActive ? (
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
          {/* Alasan penonaktifan kendali harus terbaca di teks layar, bukan hanya di
           * atribut `title`: elemen nonaktif tidak dapat difokus pengguna keyboard. */}
          <p className="text-[11px] leading-snug text-slate-600">
            Kelas kerawanan desa adalah susunan penelitian ini dan hanya ada per desa, jadi penyaring
            tahun dan tingkat wilayah tidak berlaku. Lapisan ini dimuat satu provinsi pada satu waktu
            dan baru tampil pada zoom 8 ke atas.
          </p>
        </div>
      ) : null}

      {riskActive ? (
        <div className="space-y-1.5 border-t border-slate-100 pt-2">
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
          {/* Alasan penonaktifan ini harus terbaca di teks layar, bukan hanya di
           * atribut `title`: elemen nonaktif tidak dapat difokus, jadi pengguna
           * keyboard tidak akan pernah melihat keterangan itu. */}
          <p className="text-[11px] leading-snug text-slate-600">
            Lapisan kerawanan adalah ringkasan satu periode, jadi penyaring tahun tidak berlaku; dan
            skornya hanya dihitung untuk kabupaten/kota (`SRS-F-37`), jadi tingkat provinsi
            dinonaktifkan.
          </p>
        </div>
      ) : null}
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
