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

const momentFormat = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Jakarta',
});

const percentFormat = new Intl.NumberFormat('id-ID', {
  style: 'percent',
  maximumFractionDigits: 1,
});

/** Waktu ISO-8601 UTC dari API → waktu WIB yang bisa dibaca pengguna.
 *
 * Waktu API selalu UTC bersufiks `Z`; menampilkannya apa adanya membuat pengguna
 * membaca jam tarikan yang meleset tujuh jam (`SRS-F-23`).
 */
export function formatMoment(iso: string | null | undefined): string {
  if (!iso) {
    return '—';
  }
  const waktu = new Date(iso);
  return Number.isNaN(waktu.getTime()) ? '—' : `${momentFormat.format(waktu)} WIB`;
}

/** Bagian dari keseluruhan sebagai persen; pembagi nol berarti "—", bukan 0 %. */
export function formatPercent(value: number | null | undefined, total: number | null | undefined): string {
  if (value === null || value === undefined || !total) {
    return '—';
  }
  return percentFormat.format(value / total);
}
