/** Pemformatan angka dan label Bahasa Indonesia. */

const countFormat = new Intl.NumberFormat('id-ID');
const decimalFormat = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Pemformat per jumlah desimal diambil dari cache: membuat `Intl.NumberFormat`
// baru setiap render mahal, sedangkan jumlah desimal yang dipakai cuma sedikit
// (2 untuk skor, 1 untuk persen, 4 untuk korelasi peringkat).
const decimalFormats = new Map<number, Intl.NumberFormat>();

function decimalFormatFor(digits: number): Intl.NumberFormat {
  const cached = decimalFormats.get(digits);
  if (cached) {
    return cached;
  }
  const created = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  decimalFormats.set(digits, created);
  return created;
}

/** Angka tanpa desimal; nilai kosong ditampilkan sebagai "—", bukan 0.
 *
 * ETL menulis nol secara eksplisit (sejak data dibangun ulang 2026-11-19), jadi
 * `0` berarti "nol deteksi terukur" dan `null` berarti "tidak ada baris untuk
 * tahun itu" — dua hal berbeda yang tidak boleh tampil sama.
 */
export function formatCount(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : countFormat.format(value);
}

export function formatDecimal(value: number | null | undefined, digits = 2): string {
  return value === null || value === undefined ? '—' : decimalFormatFor(digits).format(value);
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
  const moment = new Date(iso);
  return Number.isNaN(moment.getTime()) ? '—' : `${momentFormat.format(moment)} WIB`;
}

/** Batas `bbox` yang diterima API (`backend/app/routers/latest.py`: `LON_MIN`…
 * `LAT_MAX`). Diduplikasi di sini karena API tidak mengirimkannya di balasan;
 * kotak peta pada zoom nasional memang lebih lebar daripada Indonesia, dan tanpa
 * potongan ini setiap klik "Batasi ke area tampak" dijawab `422`.
 */
const BBOX_LIMITS = { lonMin: 94.5, latMin: -11.5, lonMax: 141.5, latMax: 6.5 } as const;

/** Empat batas peta → parameter `bbox` API: `min_lon,min_lat,max_lon,max_lat`.
 *
 * Kotak **dipotong** ke batas wilayah Indonesia lebih dulu: peta pada zoom
 * nasional menampilkan laut dan negara tetangga, sedangkan API menolak `bbox`
 * di luar 94,5…141,5 / -11,5…6,5 dengan `422`. Dibulatkan empat desimal (± 11 m)
 * supaya URL pendek dan cache 60 detik tidak pecah oleh digit yang bergerak.
 *
 * `null` = kotak peta seluruhnya di luar Indonesia; tidak ada permintaan yang sah
 * untuk dikirim (batas bawah akan sama dengan batas atas).
 */
export function bboxParam(bounds: [number, number, number, number]): string | null {
  const [west, south, east, north] = bounds;
  const box = [
    Math.max(west, BBOX_LIMITS.lonMin),
    Math.max(south, BBOX_LIMITS.latMin),
    Math.min(east, BBOX_LIMITS.lonMax),
    Math.min(north, BBOX_LIMITS.latMax),
  ].map((value) => Number(value.toFixed(4)));

  if (box[0] >= box[2] || box[1] >= box[3]) {
    return null;
  }
  return box.join(',');
}

/** Bagian dari keseluruhan sebagai persen; pembagi nol berarti "—", bukan 0 %. */
export function formatPercent(value: number | null | undefined, total: number | null | undefined): string {
  if (value === null || value === undefined || !total) {
    return '—';
  }
  return percentFormat.format(value / total);
}
