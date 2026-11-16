import { formatCount } from '../../lib/format';
import type { TrendHotspotRow } from '../../types/geosafe';

const WIDTH = 640;
const HEIGHT = 300;
const MARGIN = { top: 18, right: 60, bottom: 34, left: 68 };

export interface TrendChartProps {
  hotspot: TrendHotspotRow[];
  events: { year: number; event_count: number | null }[];
}

/** Grafik tren nasional dua seri, dua sumbu (`SRS-F-45`, `SRS-F-46`).
 *
 * Sumbu kiri = jumlah titik panas (seri arsip: main + fill), sumbu kanan = jumlah
 * kejadian. Kedua seri **tidak** digambar pada satu sumbu karena alat ukurnya
 * berbeda: titik panas adalah deteksi satelit, kejadian adalah catatan BNPB.
 *
 * Seri `nrt` sengaja tidak dijadikan garis pada skala ini: nilainya (600.323 pada
 * 2026) berasal dari pemrosesan berbeda dan akan menenggelamkan garis arsip.
 * Angkanya dinyatakan sebagai keterangan berangka, bukan dihilangkan.
 */
export function TrendChart({ hotspot, events }: TrendChartProps) {
  const years = hotspot.map((row) => row.year);
  const hotspotValues = hotspot.map((row) => row.archive_total ?? 0);
  const eventByYear = new Map(events.map((row) => [row.year, row.event_count ?? 0]));
  const eventValues = years.map((year) => eventByYear.get(year) ?? 0);

  const plotWidth = WIDTH - MARGIN.left - MARGIN.right;
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const hotspotMax = Math.max(...hotspotValues, 1);
  const eventMax = Math.max(...eventValues, 1);

  const xAt = (index: number) =>
    MARGIN.left + (years.length === 1 ? plotWidth / 2 : (index * plotWidth) / (years.length - 1));
  const yHotspot = (value: number) => MARGIN.top + plotHeight - (value / hotspotMax) * plotHeight;
  const yEvent = (value: number) => MARGIN.top + plotHeight - (value / eventMax) * plotHeight;

  const lineOf = (values: number[], scale: (value: number) => number) =>
    values
      .map((value, index) => `${index === 0 ? 'M' : 'L'}${xAt(index).toFixed(1)},${scale(value).toFixed(1)}`)
      .join(' ');

  const nrtRows = hotspot.filter((row) => row.nrt !== null);
  const gridValues = [0, 0.25, 0.5, 0.75, 1];

  return (
    <figure className="rounded-md border border-slate-300 bg-white p-3">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Tren nasional ${years[0]}–${years[years.length - 1]}: jumlah titik panas (sumbu kiri) dan jumlah kejadian (sumbu kanan) pada dua sumbu terpisah`}
        className="w-full"
      >
        {gridValues.map((ratio) => {
          const y = MARGIN.top + plotHeight * ratio;
          return (
            <g key={ratio}>
              <line
                x1={MARGIN.left}
                y1={y}
                x2={WIDTH - MARGIN.right}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth="1"
              />
              <text x={MARGIN.left - 6} y={y + 4} textAnchor="end" className="fill-slate-500 text-[10px]">
                {formatCount(Math.round(hotspotMax * (1 - ratio)))}
              </text>
              <text x={WIDTH - MARGIN.right + 6} y={y + 4} className="fill-slate-500 text-[10px]">
                {formatCount(Math.round(eventMax * (1 - ratio)))}
              </text>
            </g>
          );
        })}

        <path d={lineOf(hotspotValues, yHotspot)} fill="none" stroke="#b30000" strokeWidth="2" />
        <path d={lineOf(eventValues, yEvent)} fill="none" stroke="#1d4ed8" strokeWidth="2" strokeDasharray="1 0" />

        {hotspotValues.map((value, index) => (
          <circle key={`hotspot-${years[index]}`} cx={xAt(index)} cy={yHotspot(value)} r="3" fill="#b30000" />
        ))}
        {eventValues.map((value, index) => (
          <rect
            key={`event-${years[index]}`}
            x={xAt(index) - 3}
            y={yEvent(value) - 3}
            width="6"
            height="6"
            fill="#1d4ed8"
          />
        ))}

        {years.map((year, index) => (
          <text
            key={year}
            x={xAt(index)}
            y={HEIGHT - MARGIN.bottom + 18}
            textAnchor="middle"
            className="fill-slate-600 text-[11px]"
          >
            {year}
          </text>
        ))}
      </svg>

      <figcaption className="mt-2 space-y-1 text-xs text-slate-700">
        <p>
          <span aria-hidden="true" className="mr-1 inline-block h-2 w-3 align-middle bg-[#b30000]" />
          Titik panas — seri arsip (main + fill), sumbu kiri, satuan titik
        </p>
        <p>
          <span aria-hidden="true" className="mr-1 inline-block h-2 w-3 align-middle bg-[#1d4ed8]" />
          Kejadian karhutla (BNPB), sumbu kanan, satuan kejadian
        </p>
        {nrtRows.map((row) => (
          <p key={row.year} className="text-slate-600">
            Seri nrt {row.year}: {formatCount(row.nrt)} titik — pemrosesan berbeda, tidak sebanding dengan
            arsip, tidak digambar pada skala ini dan tidak dijumlahkan ke garis arsip.
          </p>
        ))}
      </figcaption>
    </figure>
  );
}