import { YEARS } from '../../lib/constants';
import { DEFAULT_RISK_SCHEME } from '../../lib/risk';
import type { MapLayer, MapLevel, RiskScheme, RiskSchemeCode } from '../../types/geosafe';
import { Segmented } from '../common/Segmented';

export interface MapToolbarProps {
  layer: MapLayer;
  onLayerChange: (layer: MapLayer) => void;
  riskScheme: RiskSchemeCode;
  onRiskSchemeChange: (scheme: RiskSchemeCode) => void;
  /** Skema dari API; `null` = belum termuat, tombol skema memakai kode apa adanya. */
  riskSchemes: RiskScheme[] | null;
  year: number;
  level: MapLevel;
  onYearChange: (year: number) => void;
  onLevelChange: (level: MapLevel) => void;
}

/** Kendali peta: lapisan, tahun, tingkat wilayah, dan skema bobot kerawanan.
 *
 * Dua lapisan tematik tidak pernah bersamaan (`P1` dan `P4`): lapisan titik panas
 * memakai filter tahun dan saklar tingkat (`SRS-F-12`, `SRS-F-13`), sedangkan
 * lapisan kerawanan tidak bertahun dan hanya ada di tingkat kabupaten/kota
 * (`SRS-F-37`). Karena itu kendali yang tidak berlaku dinonaktifkan dengan
 * sebabnya, bukan disembunyikan diam-diam.
 */
export function MapToolbar({
  layer,
  onLayerChange,
  riskScheme,
  onRiskSchemeChange,
  riskSchemes,
  year,
  level,
  onYearChange,
  onLevelChange,
}: MapToolbarProps) {
  const riskActive = layer === 'risk';

  return (
    <div className="w-full space-y-2 rounded-xl border border-slate-200 bg-white/95 p-2.5 shadow-lg backdrop-blur-sm sm:w-auto">
      <Segmented
        label="Lapisan"
        value={layer}
        onChange={onLayerChange}
        options={[
          { value: 'hotspot', label: 'Titik panas', title: 'Jumlah titik panas per tahun (P1)' },
          {
            value: 'risk',
            label: 'Kerawanan',
            title: 'Skor kerawanan susunan penelitian, tingkat kabupaten/kota (P4)',
          },
        ]}
      />

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <label className="flex items-center gap-2 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
          Tahun
          <select
            value={year}
            disabled={riskActive}
            title={
              riskActive
                ? 'Lapisan kerawanan adalah ringkasan satu periode, bukan seri tahunan'
                : undefined
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
              disabled: riskActive,
              title: riskActive
                ? 'Skor kerawanan hanya dihitung untuk kabupaten/kota (SRS-F-37)'
                : undefined,
            },
          ]}
        />
      </div>

      {riskActive ? (
        <div className="space-y-1.5 border-t border-slate-100 pt-2">
          <Segmented
            label="Skema"
            value={riskScheme}
            onChange={onRiskSchemeChange}
            options={(riskSchemes ?? FALLBACK_SCHEMES).map((scheme) => ({
              value: scheme.scheme_code,
              label: scheme.scheme_code.toUpperCase(),
              title: scheme.scheme_name,
            }))}
          />
          <p className="text-[11px] leading-snug text-slate-600">
            {riskSchemes === null
              ? 'Keterangan skema sedang dimuat.'
              : (riskSchemes.find((scheme) => scheme.scheme_code === riskScheme)?.scheme_name ??
                'skema tidak dikenal')}
            {riskScheme === DEFAULT_RISK_SCHEME
              ? ' — tampilan awal; IRBI 2025 ditampilkan sejajar, bukan bagian skor'
              : ' — skema uji; IRBI 2025 ikut masuk 20%'}
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
