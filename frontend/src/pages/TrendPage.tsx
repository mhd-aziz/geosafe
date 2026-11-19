import { BurnedAreaChart } from '../components/analysis/BurnedAreaChart';
import { TrendChart } from '../components/analysis/TrendChart';
import { DataNotes } from '../components/common/DataNotes';
import { fetchNationalTrend } from '../api/geosafe';
import { useRemoteData } from '../hooks/useRemoteData';
import { formatCount, formatDecimal } from '../lib/format';

/** Halaman tren nasional (`A1`): dua seri berdampingan + luas terbakar sebagai konteks. */
export function TrendPage() {
  const { status, data, error } = useRemoteData(fetchNationalTrend, []);

  if (status === 'loading') {
    return <p className="p-4 text-sm text-slate-600">memuat tren nasional…</p>;
  }

  if (status === 'error') {
    return <p className="p-4 text-sm text-red-700">Tren gagal dimuat: {error}</p>;
  }

  if (!data) {
    return null;
  }

  const lastYear = data.years[data.years.length - 1];
  // Tahun parsial dihitung API dari tanggal deteksi terakhir yang benar-benar
  // tercatat — lebih kuat daripada metadata "data sampai" milik sumber, yang
  // tidak menjamin barisnya benar-benar terisi sampai tanggal itu.
  const coverage = data.coverage_by_year[String(lastYear)];
  const partialYear = coverage?.partial ? coverage : null;

  return (
    <div className="mx-auto h-full w-full max-w-5xl space-y-4 overflow-y-auto p-3 sm:p-5">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-900">
          Tren nasional {data.years[0]}–{data.years[data.years.length - 1]}
        </h2>
        <p className="text-xs text-slate-600">
          Dua seri dengan alat ukur berbeda: jumlah titik panas (deteksi satelit NASA FIRMS) dan
          jumlah kejadian karhutla (pencatatan BNPB). Keduanya digambar pada dua sumbu terpisah dan
          tidak boleh dijumlahkan.
        </p>
      </header>

      <TrendChart hotspot={data.hotspot_by_year} events={data.event_by_year} />

      {partialYear ? (
        <p className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
          Tahun {lastYear} belum penuh: data titik panas terukur sampai{' '}
          {partialYear.last_observed_on} ({formatCount(partialYear.days_covered)} dari{' '}
          {formatCount(partialYear.days_in_year)} hari, {formatDecimal(partialYear.coverage_pct)}%
          tahun). Penurunan pada tahun itu karena itu belum tentu penurunan sepanjang tahun.
        </p>
      ) : null}

      <BurnedAreaChart rows={data.burned_area_by_year} />

      <section className="rounded-md border border-slate-300 bg-white p-3">
        <h3 className="text-sm font-semibold text-slate-800">Angka per tahun</h3>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="text-left text-slate-600">
                <th className="border-b border-slate-200 py-1">Tahun</th>
                <th className="border-b border-slate-200 py-1 text-right">main</th>
                <th className="border-b border-slate-200 py-1 text-right">fill</th>
                <th className="border-b border-slate-200 py-1 text-right">arsip (main + fill)</th>
                <th className="border-b border-slate-200 py-1 text-right">kejadian</th>
              </tr>
            </thead>
            <tbody>
              {data.hotspot_by_year.map((row) => {
                const events = data.event_by_year.find((item) => item.year === row.year);
                const angka = (value: number | null | undefined) =>
                  value === null || value === undefined ? '—' : value.toLocaleString('id-ID');
                return (
                  <tr key={row.year}>
                    <th scope="row" className="border-b border-slate-100 py-1 text-left font-normal text-slate-700">
                      {row.year}
                      {data.coverage_by_year[String(row.year)]?.partial ? (
                        <span title="tahun parsial: datanya belum setahun penuh"> *</span>
                      ) : null}
                    </th>
                    <td className="border-b border-slate-100 py-1 text-right tabular-nums text-slate-800">
                      {angka(row.series.main)}
                    </td>
                    <td className="border-b border-slate-100 py-1 text-right tabular-nums text-slate-800">
                      {angka(row.series.fill)}
                    </td>
                    <td className="border-b border-slate-100 py-1 text-right tabular-nums font-medium text-slate-900">
                      {angka(row.archive_total)}
                    </td>
                    <td className="border-b border-slate-100 py-1 text-right tabular-nums text-slate-800">
                      {angka(events?.event_count)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-slate-600">
          Seri dikirim apa adanya: `main` dan `fill` adalah seri arsip, dan kolom arsip menjumlahkan
          keduanya. Seri `nrt` tidak ada di tabel tahunan sejak data dibangun ulang — angkanya hanya
          hidup di lapisan titik panas terkini (24/48/72 jam). Satuan: titik panas{' '}
          {data.units.hotspot_count ?? '—'} · kejadian {data.units.event_count ?? '—'} · luas terbakar{' '}
          {data.units.burned_area_ha ?? '—'}. Tanda <strong>*</strong> menandai tahun parsial: data
          tahun itu belum terukur setahun penuh.
        </p>
      </section>

      <DataNotes title="Catatan wajib grafik ini" notes={data.notes} />
    </div>
  );
}