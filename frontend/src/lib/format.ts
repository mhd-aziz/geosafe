/** Pemformatan angka dan label Bahasa Indonesia. */

const countFormat = new Intl.NumberFormat('id-ID');
const decimalFormat = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Angka tanpa desimal; nilai kosong ditampilkan sebagai "—", bukan 0.
 *
 * ETL tidak menulis baris bernilai nol, jadi `null` berarti "tidak ada baris",
 * bukan "tidak ada deteksi" sampai catatan dari API ikut dibaca pengguna.
 */
export function formatCount(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : countFormat.format(value);
}

export function formatDecimal(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : decimalFormat.format(value);
}

export function formatAreaKm2(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : `${decimalFormat.format(value)} km²`;
}

/** Label jenis wilayah untuk daftar hasil pencarian (`SRS-F-69`). */
export function levelLabel(level: string, regionType: string | null): string {
  switch (level) {
    case 'province':
      return 'Provinsi';
    case 'regency':
      return regionType === 'CITY' ? 'Kota' : 'Kabupaten';
    case 'district':
      return 'Kecamatan';
    case 'village':
      return 'Desa/Kelurahan';
    default:
      return level;
  }
}

/** Jejak wilayah induk: kecamatan dan desa perlu dibedakan lewat provinsinya.
 *
 * Nama yang sama tidak diulang: untuk kabupaten/kota, wilayah induk dan provinsi
 * menunjuk hal yang sama, jadi hasilnya cukup ditulis sekali.
 */
export function parentPath(
  provinceName: string | null,
  parentName: string | null,
): string {
  const parts = [parentName, provinceName].filter(
    (part): part is string => Boolean(part),
  );
  return [...new Set(parts)].join(' · ');
}
