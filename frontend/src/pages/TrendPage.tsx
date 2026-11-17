import { BurnedAreaChart } from '../components/analysis/BurnedAreaChart';
import { TrendChart } from '../components/analysis/TrendChart';
import { DataNotes } from '../components/common/DataNotes';
import { fetchNationalTrend } from '../api/geosafe';
import { useRemoteData } from '../hooks/useRemoteData';
import { useSourceSummary } from '../hooks/useSourceSummary';

/** Halaman tren nasional (`A1`): dua seri berdampingan + luas terbakar sebagai konteks. */
export function TrendPage() {
  const { status, data, error } = useRemoteData(fetchNationalTrend, []);
  const { firms } = useSourceSummary();

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
  // Tahun terakhir biasanya belum penuh: sumber titik panas berhenti di suatu
  // tanggal. Menyebutkannya mencegah penurunan 2026 dibaca sebagai penurunan
  // sepanjang tahun.
  const partialYear =
    firms?.data_until && firms.data_until.startsWith(String(lastYear)) ? firms.data_until : null;

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
          Tahun {lastYear} belum penuh: data titik panas berhenti pada {partialYear}. Penurunan pada
          tahun itu karena itu belum tentu penurunan sepanjang tahun.
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
                <th className="border-b border-slate-200 py-1 text-right">nrt</th>
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
                    </th>
                    <td className="border-b border-slate-100 py-1 text-right tabular-nums text-slate-800">
                      {angka(row.series.main)}
                    </td>
                    <td className="border-b border-slate-100 py-1 text-right tabular-nums text-slate-800">
                      {angka(row.series.fill)}
                    </td>
                    <td className="border-b border-slate-100 py-1 text-right tabular-nums text-slate-800">
                      {angka(row.nrt)}
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
          Seri dikirim apa adanya: `main` dan `fill` adalah seri arsip, `nrt` pemrosesan berbeda dan
          tidak dijumlahkan ke kolom arsip. Satuan: titik panas {data.units.hotspot_count ?? '—'} ·
          kejadian {data.units.event_count ?? '—'} · luas terbakar {data.units.burned_area_ha ?? '—'}.
        </p>
      </section>

      <DataNotes title="Catatan wajib grafik ini" notes={data.notes} />
    </div>
  );
}