# Dokumen repo aplikasi

Penunjuk isi folder `docs/`. Aturan utama: **jangan menduplikasi dokumen** — setiap
hal punya satu tempat.

| Berkas | Isi | Sifat |
|---|---|---|
| `PRD.md` | apa produknya, untuk siapa, ruang lingkup 14 fitur, batasan data, ukuran keberhasilan | tetap (jarang berubah) |
| `MVP.md` | batas "harus jalan lebih dulu", kriteria selesai, antrean iterasi | diperbarui tiap iterasi |
| `ITERATIONS.md` | catatan per iterasi + hasil ukur + temuan | **log**, bertambah terus |
| `CONVENTIONS.md` | aturan yang mengikat, penamaan, bahasa, format commit, alur git, jebakan | tetap |

Kerja harian: baca `MVP.md` untuk tahu apa berikutnya, `CONVENTIONS.md` sebelum
menulis kode, dan tambahkan entri di `ITERATIONS.md` setelah setiap iterasi.
Pintu gerbang repo ada di [`../README.md`](../README.md).

## Yang tetap tinggal di `../../planning-GeoSafe/`

Jangan menyalin isinya ke sini — cukup menunjuk:

| Dokumen | Isi | Kenapa tidak disalin |
|---|---|---|
| `docs/SRS-GeoSafe.md` | 126 kebutuhan ber-ID (`SRS-*`) | satu sumber kebenaran; salinan akan menyimpang |
| `docs/ERD-GeoSafe.md` | 14 tabel, 30 relasi | idem |
| `docs/ARSITEKTUR.md` | bahasa, framework, basis data, penyajian, deploy | idem |
| `docs/alur-sistem.md` | aktor, use case, DFD, kamus data | idem |
| `docs/API-P2.md` | kontrak alur terkini (P2 + W1) | masih dipakai dari sana; kandidat disalin ke sini saat P2 dikerjakan |
| `data/SUMBER.md` | dataset + URL + tanggal akses | dokumen data, bukan dokumen aplikasi |
| `docs/draft/` + `Proposal-TA_*.docx` | proposal tugas akhir | dokumen akademik, bukan dokumen kerja harian |
| `CATATAN-DISKUSI.md` | keputusan antar-sesi | log perencanaan |

## Yang sengaja belum dibuat

| Kandidat | Alasan ditunda |
|---|---|
| `API.md` | daftar endpoint selalu hidup di `/docs` dan `/openapi.json` (dibuat FastAPI); berkas terpisah pasti tertinggal |
| `CHANGELOG.md` | fungsinya sudah dipegang `ITERATIONS.md` + tag `iter-NN-*` + halaman PR |
| `RUNBOOK.md` | belum dibuat walau layanan sudah ada (nginx + unit systemd): cara menjalankan, memuat ulang, dan menyiapkan ulang dari nol masih tercatat di [`ITERATIONS.md`](ITERATIONS.md) penyisipan 09a/09b dan `../README.md`. Kandidat berikutnya kalau langkahnya mulai sering dipakai |
| `decisions/` (ADR) | keputusan yang sudah dikunci ada di `CONVENTIONS.md`; keputusan lintas-sesi di `CATATAN-DISKUSI.md` |

Aturan penulisan: bahasa Indonesia untuk isi dokumen; nama berkas, nama simbol,
dan pesan commit Bahasa Inggris (lihat [`CONVENTIONS.md`](CONVENTIONS.md)).
