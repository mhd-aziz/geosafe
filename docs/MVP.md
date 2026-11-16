# MVP — GeoSafe

*Minimum Viable Product.* Batasan **apa yang harus jalan lebih dulu** supaya
GeoSafe bisa didemokan dan dinilai, dan apa yang sengaja ditunda.

Status: 2026-11-16 · iterasi 01–07 selesai, MVP belum lengkap.

---

## 1. Pernyataan MVP

Satu alur utuh yang bisa ditunjukkan di depan dosen:

> **orang membuka satu halaman → memilih tahun → melihat peta warna kabupaten/kota
> menurut jumlah titik panas → mengklik satu kabupaten → melihat angka titik panas,
> kejadian, status darurat, dan IRBI-nya → menelusuri asal angkanya di halaman
> Sumber & Batas Data.**

Kalau alur itu jalan, GeoSafe sudah bisa dinilai sebagai purwarupa yang bekerja.
Fitur lain memperkuat, tapi tidak menentukan.

## 2. Isi MVP (5 dari 14 fitur)

| Kode | Fitur | Kriteria selesai |
|---|---|---|
| **P1** | peta sebaran titik panas kabupaten/kota | choropleth dari MVT, filter tahun 2020–2026, legenda + skala warna, saklar tingkat provinsi |
| **C1** | pencarian wilayah 4 tingkat | ketik nama/kode → daftar provinsi + kabupaten/kota + kecamatan + desa/kelurahan (maks 20 baris) → pilih → peta bergerak ke wilayah itu |
| **W2** | panel kabupaten/kota | satu panel memuat: jumlah titik panas per tahun, jumlah kejadian, status darurat 2025, IRBI 2025 |
| **A1** | tren 2020–2026 dua seri | garis titik panas **dan** kejadian pada satu grafik, dua sumbu terpisah, keterangan bahwa dua seri itu alat ukur berbeda |
| **T1** | sumber & batas data | daftar 7 dataset + URL + tanggal akses + jumlah baris, 7 celah data, unduh CSV, daftar istilah |

## 3. Yang sengaja tidak masuk MVP

| Fitur / hal | Ditunda karena | Kapan |
|---|---|---|
| P2 titik panas terkini | butuh penarik FIRMS + cache 15 menit + snapshot; kuota kunci harus dijaga | iterasi setelah MVP jalan |
| P4 peta kerawanan (versi B) | skor disusun sendiri; bobot + uji sensitivitas belum ditetapkan | setelah W2/A1 jadi bahan pembanding |
| P3, P5 peta kejadian dan titik | bergantung pada lapisan peta yang sudah stabil | setelah P1 stabil |
| A2, A3 komposisi dan peringkat | turunan dari A1 | cepat, setelah A1 |
| W1 panel terkini | bergantung P2 | bersama P2 |
| W3, W4 panel kecamatan/desa | angka pendukung, bukan unit analisis | setelah MVP |
| mode heatmap di P1 | ratusan ribu titik per tahun; diukur dulu | setelah P1 choropleth stabil |
| basemap PMTiles (216 MB) | berkas besar; untuk MVP cukup geometri sendiri di atas latar polos | sebelum demo |
| HTTPS + domain | perlu saat dipasang, bukan saat dikembangkan | saat unjuk kerja |

## 4. Definisi "selesai" untuk setiap iterasi

Satu iterasi dianggap selesai kalau **semua** ini benar:

1. `uv run pytest` lulus (uji endpoint nyata, bukan uji palsu).
2. Angka yang dijanjikan diukur lewat jalur yang dipakai peramban (HTTP), bukan lewat `psql` saja.
3. Ada PR dengan deskripsi memuat bukti jalannya, di-*squash merge*, dan diberi tag `iter-NN-<slug>`.
4. `README.md` diperbarui: daftar endpoint dan hasil ukur terbaru.

## 5. Urutan iterasi

| Iterasi | Isi | Status |
|---|---|---|
| 01 | `feat/api-database` — koneksi PostgreSQL + `GET /api/v1/sources` | ✅ PR #1, tag `iter-01-api-database` |
| 02 | `feat/api-tiles` — tile MVT kabupaten/kota (dasar P1) | ✅ PR #2, tag `iter-02-api-tiles` |
| 03 | `feat/api-panel` — panel kabupaten/kota (W2) | ✅ PR #3, tag `iter-03-api-panel` |
| 04 | `fix/tile-missing-regions` — tile memuat wilayah yang belum punya baris fakta (39 wilayah pada 2020) | ✅ PR #4, tag `iter-04-tile-missing-regions` |
| 05 | `feat/api-search` — pencarian wilayah empat tingkat (C1) | ✅ PR #5, tag `iter-05-api-search` |
| 06 | `feat/api-trend` — tren nasional dua seri (A1) | ✅ PR #6, tag `iter-06-api-trend` |
| 07 | `feat/frontend-app` — frontend: peta choropleth + pencarian + panel (Vite 7.3.8) | ✅ PR #9, tag `iter-07-frontend` |
| 08 | halaman Sumber & Batas Data (T1) + unduh CSV | |
| 09 | deploy: nginx + systemd, basemap PMTiles | |
| 10 | P2 titik panas terkini (FIRMS + cache 15 menit) | setelah MVP jalan |
| 11 | P4 kerawanan versi B + uji sensitivitas bobot | setelah ada pembanding |

Urutan ini boleh bergeser; yang tidak boleh: memasukkan P2/P4 sebelum alur inti
(P1 → C1 → W2 → A1 → T1) berjalan, karena keduanya menambah ketergantungan luar
(kuota FIRMS, bobot yang belum disetujui).
