# Dokumen repo aplikasi

Penunjuk isi folder `docs/`. Aturan utama: **jangan menduplikasi dokumen**.

| Berkas | Isi | Hubungan dengan repo perencanaan |
|---|---|---|
| `PRD.md` | apa produknya, untuk siapa, ruang lingkup 14 fitur, batasan data, ukuran keberhasilan | ringkasan sisi produk; kebutuhan teknis tetap di `SRS-GeoSafe.md` |
| `MVP.md` | batas "harus jalan lebih dulu", kriteria selesai, urutan iterasi | turunan dari 14 fitur; menetapkan urutan kerja |

## Yang tetap tinggal di `../../planning-GeoSafe/`

Jangan menyalin isinya ke sini — cukup menunjuk:

| Dokumen | Isi | Kenapa tidak disalin |
|---|---|---|
| `docs/SRS-GeoSafe.md` | 126 kebutuhan ber-ID (`SRS-*`) | satu sumber kebenaran; salinan akan menyimpang |
| `docs/ERD-GeoSafe.md` | 14 tabel, 30 relasi | idem |
| `docs/ARSITEKTUR.md` | bahasa, framework, basis data, penyajian, deploy | idem |
| `docs/alur-sistem.md` | aktor, use case, DFD, kamus data | idem |
| `docs/API-P2.md` | kontrak alur terkini (P2 + W1) | masih dipakai dari sana; kandidat disalin ke sini saat P2 dikerjakan |
| `docs/draft/` + `Proposal-TA_*.docx` | proposal tugas akhir | dokumen akademik, bukan dokumen kerja harian |
| `CATATAN-DISKUSI.md` | keputusan antar-sesi | log perencanaan |

## Yang sengaja belum dibuat

| Kandidat | Alasan ditunda |
|---|---|
| `CHANGELOG.md` | riwayat sudah ada di `git log` + tag `iter-NN-*` dan halaman PR |
| `API.md` | daftar endpoint selalu hidup di `/docs` dan `/openapi.json` (dibuat FastAPI); dokumen terpisah pasti tertinggal |
| `RUNBOOK.md` | tidak ada yang bisa dijalankan sebagai layanan sebelum iterasi deploy (nginx + systemd) |
| `decisions/` (ADR) | keputusan harian dicatat di `../README.md`; yang lintas-sesi di `CATATAN-DISKUSI.md` |

Aturan penulisan: bahasa Indonesia untuk dokumen penunjuk dan penjelasan; nama
berkas, nama simbol, dan pesan commit Bahasa Inggris (lihat `../README.md`
bagian Konvensi penulisan).
