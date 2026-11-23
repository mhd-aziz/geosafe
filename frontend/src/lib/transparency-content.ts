/** Isi tetap halaman Sumber & Batas Data (`T1`).
 *
 * Tujuh celah data dan daftar istilah diambil dari `docs/PRD.md` bagian 4 dan 6 —
 * dokumen yang sama yang menuntut keduanya muncul di halaman, bukan hanya di
 * laporan (`SRS-F-73`, `SRS-F-74`). Kalau salah satu daftar berubah di PRD,
 * berkas ini yang ikut berubah.
 *
 * Satu angka tetap tinggal di sini: jumlah kejadian karhutla pada daftar istilah.
 * Angka itu ikut berubah setiap data dibangun ulang (2026-11-19: 6.383 → **6.390**),
 * jadi wajib diperiksa ulang setiap kali `data/siap-pakai/` dibangun ulang.
 */

export interface GapEntry {
  title: string;
  detail: string;
}

export const DATA_GAPS: GapEntry[] = [
  {
    title: 'Korban dan kerusakan karhutla praktis kosong',
    detail:
      'Kolom korban meninggal terisi hanya 0–0,4% baris. Indikator utama proyek ini karena itu jumlah titik panas dan jumlah kejadian, bukan korban.',
  },
  {
    title: 'Korban/kerusakan per kabupaten hanya tersedia untuk 2024',
    detail: 'Tahun lain tidak punya rincian per wilayah, jadi tidak bisa dibandingkan antar tahun.',
  },
  {
    title: 'Status keadaan darurat hanya tahun 2025',
    detail:
      'Panel wilayah menampilkan status darurat 2025 saja; tahun lain tidak punya datanya sama sekali.',
  },
  {
    title: 'Luas terbakar per kabupaten tidak ada',
    detail:
      'Seri GWIS hanya tersedia tingkat nasional dan berhenti di 2025, sehingga tidak bisa diturunkan ke kabupaten/kota.',
  },
  {
    title: 'Kelas kerawanan desa resmi untuk karhutla tidak ada',
    detail:
      'Kelas kerawanan desa yang dipakai proyek ini adalah susunan penelitian, bukan kelas resmi BNPB.',
  },
  {
    title: 'GLIDE tidak memuat kejadian karhutla',
    detail:
      'Katalog lintas negara itu tidak punya baris untuk karhutla Indonesia, jadi tidak dipakai sebagai pembanding.',
  },
  {
    title: 'Kelengkapan lokasi tidak rata antar tahun',
    detail:
      'Penurunan angka pada suatu tahun bisa berarti kelengkapan pencatatan lokasinya yang turun, bukan kejadiannya berkurang.',
  },
];

export interface GlossaryEntry {
  term: string;
  meaning: string;
  note: string;
}

export const GLOSSARY: GlossaryEntry[] = [
  {
    term: 'titik panas (hotspot)',
    meaning: 'anomali termal yang terdeteksi satelit (NASA FIRMS, VIIRS/MODIS).',
    note: 'Indikasi awal, bukan kebakaran terkonfirmasi. Tidak boleh dijumlahkan dengan jumlah kejadian.',
  },
  {
    term: 'kebakaran hutan dan lahan (karhutla)',
    meaning: 'kategori kejadian resmi BNPB; 6.390 kejadian tercatat pada 2020–2026.',
    note: 'Seri ini memakai alat ukur berbeda dari titik panas, jadi digambar pada sumbu terpisah.',
  },
  {
    term: 'kerawanan',
    meaning:
      'penilaian seberapa mudah suatu wilayah terbakar, disusun proyek ini dari kombinasi titik panas, kejadian, dan IRBI.',
    note:
      'Skor kerawanan A/B/C di backoffice adalah susunan penelitian, bukan kelas resmi. Kata "kerawanan" hanya menempel pada karhutla.',
  },
  {
    term: 'IRBI (Indeks Risiko Bencana Indonesia)',
    meaning: 'indeks risiko bencana BNPB/InaRISK, termasuk per ancaman bahaya.',
    note:
      'Dipakai sebagai pembanding dari luar; kelas IRBI dibaca dari kolom teks, bukan angka skornya.',
  },
];

/** Selisih angka antar tingkat wilayah yang sah, bukan kesalahan hitung (`SRS-F-77`). */
export const LEVEL_DIFFERENCE_NOTE =
  'Selisih angka nasional, provinsi, dan kabupaten/kota adalah hal yang sah: kejadian yang merambat di beberapa wilayah dihitung sekali pada tingkat nasional tetapi sekali di setiap wilayah pada tingkat yang lebih rinci, sesuai cara BNPB mencatat.';

/** Versi dokumen SRS yang jadi acuan purwarupa ini (`SRS-S-04`).
 *
 * Sumbernya `../planning-GeoSafe/docs/SRS-GeoSafe.md`; nilainya **wajib** ikut
 * berubah setiap dokumen itu naik versi, karena halaman ini menampilkannya.
 */
export const SRS_DOCUMENT = { version: '1.16', date: '23 November 2026' } as const;
