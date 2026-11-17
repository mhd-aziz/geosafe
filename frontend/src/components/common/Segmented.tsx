export interface SegmentedOption<T extends string | number> {
  value: T;
  label: string;
  /** Keterangan tambahan saat kursor berhenti di tombol (mis. sebab dinonaktifkan). */
  title?: string;
  disabled?: boolean;
}

export interface SegmentedProps<T extends string | number> {
  label: string;
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
}

/** Kendali pilihan tunggal bergaya saklar (tahun, tingkat, jendela, skema).
 *
 * Satu komponen untuk semua saklar supaya keadaannya seragam: `aria-pressed`
 * ikut dikirim agar pembaca layar tahu mana yang aktif, ukuran sasaran sentuh
 * minimal 36 px, dan perubahan warna memakai transisi 200 ms (tidak ada
 * pergeseran tata letak saat kursor berhenti).
 */
export function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: SegmentedProps<T>) {
  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
        {label}
      </span>
      <div
        role="group"
        aria-label={label}
        className="inline-flex overflow-hidden rounded-lg border border-slate-200 bg-white"
      >
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={String(option.value)}
              type="button"
              aria-pressed={active}
              title={option.title}
              disabled={option.disabled}
              onClick={() => onChange(option.value)}
              className={`min-h-9 cursor-pointer px-3 text-xs font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 sm:min-h-8 ${
                active ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
