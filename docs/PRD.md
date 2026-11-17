# PRD — GeoSafe

*Product Requirements Document.* Menjelaskan **apa produknya dan untuk siapa**.
Kebutuhan teknis (126 kebutuhan ber-ID `SRS-*`) tetap di
`../../planning-GeoSafe/docs/SRS-GeoSafe.md` — dokumen ini **tidak** menggantikannya,
hanya merangkum sisi produk. Kalau ada selisih, SRS yang menang.

Status: 2026-11-17 · belum ada rilis; backend berjalan (lihat `../README.md`).

---

## 1. Masalah yang diselesaikan

Data titik panas dan kejadian kebakaran hutan dan lahan di Indonesia tersedia,
tetapi tersebar: titik panas di layanan satelit NASA FIRMS (berbahasa Inggris,
berbentuk tabel), kejadian di portal BNPB, luas terbakar di GWIS, indeks risiko
di InaRISK. Masyarakat umum tidak punya satu tempat untuk melihat **di mana**
sebarannya, **seberapa** besarnya, dan **sejak kapan** angkanya tersedia.

## 2. Pengguna

| Aspek | Keputusan |
|---|---|
| Pengguna | masyarakat umum, tanpa pengetahuan SIG |
| Akun | **tidak ada** login (SRS-C-07) |
| Pemasangan | tidak ada; dibuka lewat peramban (SRS-F-01) |
| Perangkat | peramban desktop dan telepon; peta berbasis WebGL |
| Isi halaman | seluruh teks Bahasa Indonesia |

## 3. Ruang lingkup produk

**Unit analisis: 514 kabupaten/kota** (416 kabupaten + 98 kota). Lima tingkat
wilayah dengan tiga peran berbeda:

| Tingkat | Jumlah | Peran |
|---|---|---|
| nasional | 1 | konteks dan tren |
| provinsi | 38 (+3 tanpa geometri) | konteks dan tren |
| kabupaten/kota | 514 | **unit analisis** — satu-satunya tingkat dengan seluruh indikator |
| kecamatan | 7.382 | angka pendukung |
| desa/kelurahan | 83.530 | angka pendukung |

Kalimat baku yang harus dipakai di seluruh tampilan: *"Skor kerawanan hanya aktif
di tingkat kabupaten/kota, karena hanya tingkat itu yang punya seluruh indikator."*

### 14 fitur / 5 kelompok

| Kode | Fitur | Kelompok |
|---|---|---|
| P1 | peta sebaran titik panas 2020–2026 (choropleth, saklar provinsi, mode heatmap, filter tahun + confidence) | Peta |
| P2 | titik panas terkini 24/48/72 jam (join ke wilayah saat runtime, auto-refresh 15 menit) | Peta |
| P3 | peta kejadian karhutla per kabupaten/kota per tahun | Peta |
| P4 | peta kerawanan (skor kabupaten/kota + IRBI 2025 sebagai konteks) | Peta |
| P5 | peta titik: 6.383 kejadian + titik berangka wilayah | Peta |
| A1 | tren 2020–2026 dua seri (titik panas vs kejadian) | Analisis |
| A2 | komposisi wilayah (top 10 provinsi + top 10 kabupaten/kota) | Analisis |
| A3 | peringkat | Analisis |
| W1 | panel terkini | Panel |
| W2 | panel kabupaten/kota (kejadian, korban & kerusakan, titik panas, status darurat 2025, IRBI) | Panel |
| W3 | panel kecamatan | Panel |
| W4 | panel desa/kelurahan | Panel |
| C1 | pencarian 4 tingkat wilayah (provinsi, kabupaten/kota, kecamatan, desa/kelurahan; kode + nama) | Pencarian |
| T1 | halaman Sumber & Batas Data + unduh CSV + daftar istilah | Transparansi |

## 4. Istilah yang tidak boleh dicampur

| Istilah | Arti | Catatan wajib |
|---|---|---|
| **titik panas (hotspot)** | anomali termal yang terdeteksi satelit | indikasi awal, **bukan** kebakaran terkonfirmasi — keterangan ini selalu disertakan |
| **kebakaran hutan dan lahan (karhutla)** | kategori kejadian resmi BNPB | 6.383 kejadian 2020–2026 |

Dilarang memakai frasa **"kerawanan titik panas"**. Kata "kerawanan" hanya
menempel pada kebakaran hutan dan lahan.

## 5. Di luar ruang lingkup

| Tidak dikerjakan | Alasan |
|---|---|
| peringatan dini / prediksi | butuh pemodelan, bukan pemetaan |
| raster bahaya InaRISK | lisensinya menuntut izin tertulis BNPB dan hanya satu epoch 2021 |
| data event-level DIBI | butuh kredensial (dashboard Superset) |
| level RT/RW | di luar 5 tingkat wilayah |
| akun pengguna, unggahan data, pelaporan warga | runtime harus tipis (SRS-C-07) |

## 6. Batasan data yang harus ditampilkan, bukan disembunyikan

1. Korban & kerusakan karhutla praktis kosong (korban meninggal terisi 0–0,4%). Indikator utama = jumlah titik panas + jumlah kejadian.
2. Korban/kerusakan per kabupaten hanya tersedia untuk 2024.
3. Status keadaan darurat hanya tahun 2025.
4. Luas terbakar per kabupaten tidak ada; hanya nasional (GWIS).
5. Kelas kerawanan desa resmi untuk karhutla tidak ada.
6. GLIDE tidak memuat kejadian karhutla.
7. Kelengkapan lokasi tidak rata antar tahun — "2024 turun" bisa berarti kelengkapan lokasinya yang turun.

Ketujuhnya wajib muncul di halaman T1, bukan hanya di laporan.

## 7. Ukuran keberhasilan

| Ukuran | Sasaran | Sumber angka |
|---|---|---|
| peta terbuka dan bisa dipakai | tile kabupaten/kota ≤ 500 ms | `SRS-NF-04` |
| pemetaan titik terkini ke wilayah | ≤ 1 detik | `SRS-NF-05` |
| geometri kecamatan/desa per permintaan | MVT, kecamatan ≤ 2 detik | `SRS-NF-06` |
| heatmap satu tahun | ≤ 5 detik di peramban | `SRS-NF-08` |
| seluruh angka dapat ditelusuri | setiap angka bisa ditunjuk ke tabel sumbernya | halaman T1 |

## 8. Rujukan (di repo perencanaan, satu sumber kebenaran)

| Dokumen | Isi |
|---|---|
| `docs/SRS-GeoSafe.md` | 126 kebutuhan ber-ID |
| `docs/ERD-GeoSafe.md` | 14 tabel, 30 relasi |
| `docs/ARSITEKTUR.md` | bahasa, framework, basis data, deploy |
| `docs/alur-sistem.md` | aktor, use case, DFD, kamus data |
| `docs/API-P2.md` | kontrak alur terkini |
| `CATATAN-DISKUSI.md` | keputusan antar-sesi |
