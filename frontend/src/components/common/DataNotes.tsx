/** Daftar catatan batasan data yang wajib ikut tampil (aturan repo nomor 6).
 *
 * Catatan datang dari API, bukan disusun di peramban: kalau seri tahunan tidak
 * punya baris, angka nol berarti "tidak ada baris", dan itu penjelasannya.
 */
export function DataNotes({ title = 'Catatan data', notes }: { title?: string; notes: string[] }) {
  if (notes.length === 0) {
    return null;
  }

  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 p-3">
      <h3 className="text-xs font-semibold tracking-wide text-amber-900 uppercase">{title}</h3>
      <ul className="mt-2 space-y-1 text-xs text-amber-900">
        {notes.map((note) => (
          <li key={note} className="flex gap-2">
            <span aria-hidden="true">•</span>
            <span>{note}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
