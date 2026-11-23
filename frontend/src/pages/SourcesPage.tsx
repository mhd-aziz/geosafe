import { downloadFileUrl, fetchDownloads, fetchPointCoverage, fetchSources } from '../api/geosafe';
import { DataNotes } from '../components/common/DataNotes';
import { useRemoteData } from '../hooks/useRemoteData';
import { formatCount } from '../lib/format';
import { DATA_GAPS, GLOSSARY, LEVEL_DIFFERENCE_NOTE, SRS_DOCUMENT } from '../lib/transparency-content';

function formatKb(bytes: number): string {
  return `${(bytes / 1024).toFixed(1).replace('.', ',')} kB`;
}

/** Halaman Sumber & Batas Data (`T1`).
 *
 * Memuat: daftar dataset sumber, jumlah titik panas yang tidak masuk poligon
 * wilayah (beserta rincian seri arsip `main`/`fill` — `nrt` tidak dimuat ke
 * tabel titik panas), tujuh celah data, daftar istilah, dan unduhan tabel siap
 * pakai. Semua angka dibaca dari API; teks tetap di `lib/transparency-content.ts`.
 */
export function SourcesPage() {
  const sources = useRemoteData(fetchSources, []);
  const coverage = useRemoteData(() => fetchPointCoverage(), []);
  const downloads = useRemoteData(fetchDownloads, []);

  return (
    <div className="mx-auto h-full w-full max-w-5xl space-y-4 overflow-y-auto p-3 sm:p-5">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-900">Sumber &amp; Batas Data</h2>
        <p className="text-xs text-slate-600">
          Halaman ini menyebutkan dari mana angkanya datang dan apa yang tidak bisa dijawab datanya.
          Tidak ada angka yang dihitung ulang di sini — semuanya dibaca dari API.
        </p>
        <p className="text-xs text-slate-500">
          Purwarupa ini mengikuti dokumen SRS versi <strong>{SRS_DOCUMENT.version}</strong> (
          {SRS_DOCUMENT.date}).
        </p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800">Sumber data</h3>
        {sources.status === 'loading' ? <p className="mt-2 text-xs text-slate-600">memuat sumber…</p> : null}
        {sources.status === 'error' ? (
          <p className="mt-2 text-xs text-red-700">Sumber gagal dimuat: {sources.error}</p>
        ) : null}
        {sources.data ? (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="text-left text-slate-600">
                  <th className="border-b border-slate-200 py-1">Kode</th>
                  <th className="border-b border-slate-200 py-1">Dataset</th>
                  <th className="border-b border-slate-200 py-1">Institusi</th>
                  <th className="border-b border-slate-200 py-1">Diakses</th>
                  <th className="border-b border-slate-200 py-1">Data sampai</th>
                  <th className="border-b border-slate-200 py-1 text-right">Baris</th>
                </tr>
              </thead>
              <tbody>
                {sources.data.sources.map((source) => (
                  <tr key={source.source_code}>
                    <th scope="row" className="border-b border-slate-100 py-1 text-left font-mono text-[11px] font-normal text-slate-700">
                      {source.source_code}
                    </th>
                    <td className="border-b border-slate-100 py-1 text-slate-800">
                      <a
                        href={source.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-700 underline"
                      >
                        {source.source_name}
                      </a>
                    </td>
                    <td className="border-b border-slate-100 py-1 text-slate-700">{source.institution}</td>
                    <td className="border-b border-slate-100 py-1 text-slate-700">{source.accessed_on}</td>
                    <td className="border-b border-slate-100 py-1 text-slate-700">
                      {source.data_until ?? 'tidak disebutkan'}
                    </td>
                    <td className="border-b border-slate-100 py-1 text-right tabular-nums text-slate-800">
                      {formatCount(source.row_count)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800">
          Titik panas di luar poligon wilayah
        </h3>
        {coverage.status === 'loading' ? (
          <p className="mt-2 text-xs text-slate-600">memuat penempatan titik…</p>
        ) : null}
        {coverage.status === 'error' ? (
          <p className="mt-2 text-xs text-red-700">Penempatan titik gagal dimuat: {coverage.error}</p>
        ) : null}
        {coverage.data ? (
          <div className="mt-2 space-y-2 text-xs text-slate-700">
            <p>
              {formatCount(coverage.data.totals.outside_count)} dari{' '}
              {formatCount(coverage.data.totals.point_count)} titik panas (
              {coverage.data.totals.outside_share_percent === null
                ? '—'
                : coverage.data.totals.outside_share_percent.toLocaleString('id-ID')}{' '}
              %) tidak jatuh di poligon wilayah mana pun. Angka itu tidak dihapus dan tidak dihitung
              nol.
            </p>
            <p>
              Angka di halaman ini hanya <strong>seri arsip</strong>:{' '}
              {formatCount(coverage.data.totals.series?.main)} titik seri <code>main</code> +{' '}
              {formatCount(coverage.data.totals.series?.fill)} titik seri <code>fill</code>. Seri{' '}
              <code>nrt</code> tidak dimuat ke tabel titik panas — ia hanya dipakai lapisan terkini
              24/48/72 jam, dan tidak boleh dijumlahkan dengan angka 2020–2026 ini.
            </p>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="text-left text-slate-600">
                  <th className="border-b border-slate-200 py-1">Tahun</th>
                  <th className="border-b border-slate-200 py-1 text-right">Titik panas</th>
                  <th className="border-b border-slate-200 py-1 text-right">Masuk wilayah</th>
                  <th className="border-b border-slate-200 py-1 text-right">Di luar poligon</th>
                </tr>
              </thead>
              <tbody>
                {coverage.data.by_year.map((row) => (
                  <tr key={row.year}>
                    <th scope="row" className="border-b border-slate-100 py-1 text-left font-normal text-slate-700">
                      {row.year}
                    </th>
                    <td className="border-b border-slate-100 py-1 text-right tabular-nums text-slate-800">
                      {formatCount(row.point_count)}
                    </td>
                    <td className="border-b border-slate-100 py-1 text-right tabular-nums text-slate-800">
                      {formatCount(row.placed_count)}
                    </td>
                    <td className="border-b border-slate-100 py-1 text-right tabular-nums text-slate-800">
                      {formatCount(row.outside_count)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <DataNotes notes={coverage.data.notes} />
            <p className="text-[11px] text-slate-600">{LEVEL_DIFFERENCE_NOTE}</p>
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800">
          Tujuh celah data yang tetap ada
        </h3>
        <ol className="mt-2 space-y-2 text-xs text-slate-700">
          {DATA_GAPS.map((gap, index) => (
            <li key={gap.title} className="flex gap-2">
              <span className="tabular-nums text-slate-500">{index + 1}.</span>
              <span>
                <strong className="text-slate-900">{gap.title}</strong> — {gap.detail}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800">Unduh tabel siap pakai</h3>
        {downloads.status === 'loading' ? (
          <p className="mt-2 text-xs text-slate-600">memuat daftar unduhan…</p>
        ) : null}
        {downloads.status === 'error' ? (
          <p className="mt-2 text-xs text-red-700">Daftar unduhan gagal dimuat: {downloads.error}</p>
        ) : null}
        {downloads.data ? (
          <div className="mt-2 space-y-2">
            <p className="text-xs text-slate-600">
              {downloads.data.count} berkas CSV di folder <code>{downloads.data.folder}</code>. Kolomnya
              berbahasa Inggris, isinya tidak diubah dari sumber.
            </p>
            <ul className="grid gap-x-4 gap-y-1 text-xs sm:grid-cols-2">
              {downloads.data.files.map((file) => (
                <li key={file.file_name} className="flex items-baseline justify-between gap-2">
                  <a href={downloadFileUrl(file.file_name)} className="text-blue-700 underline">
                    {file.file_name}
                  </a>
                  <span className="shrink-0 tabular-nums text-slate-500">{formatKb(file.size_bytes)}</span>
                </li>
              ))}
            </ul>
            <DataNotes notes={downloads.data.notes} />
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800">Daftar istilah</h3>
        <dl className="mt-2 space-y-2 text-xs text-slate-700">
          {GLOSSARY.map((entry) => (
            <div key={entry.term}>
              <dt className="font-semibold text-slate-900">{entry.term}</dt>
              <dd>
                {entry.meaning} <span className="text-slate-600">{entry.note}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}