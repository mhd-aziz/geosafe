import { YEARS } from '../../lib/constants';
import type { MapLevel } from '../../types/geosafe';

export interface MapToolbarProps {
  year: number;
  level: MapLevel;
  onYearChange: (year: number) => void;
  onLevelChange: (level: MapLevel) => void;
}

const LEVELS: { value: MapLevel; label: string }[] = [
  { value: 'regency', label: 'Kabupaten/Kota' },
  { value: 'province', label: 'Provinsi' },
];

/** Filter tahun (`SRS-F-12`) dan saklar tingkat tampilan (`SRS-F-13`). */
export function MapToolbar({ year, level, onYearChange, onLevelChange }: MapToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-slate-300 bg-white/95 px-3 py-2 shadow-sm">
      <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
        Tahun
        <select
          value={year}
          onChange={(event) => onYearChange(Number(event.target.value))}
          className="rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900"
        >
          {YEARS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-slate-700">Tingkat</span>
        <div role="group" aria-label="Tingkat wilayah" className="flex overflow-hidden rounded border border-slate-300">
          {LEVELS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={level === option.value}
              onClick={() => onLevelChange(option.value)}
              className={`px-2 py-1 text-xs ${
                level === option.value
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}