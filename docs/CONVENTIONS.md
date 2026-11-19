# Konvensi dan aturan kerja

Keputusan yang dikunci 2026-11-16. Sebelum mengubah salah satunya, baca alasannya
di sini — beberapa keputusan tampak sepele tapi menutup jebakan nyata.

---

## 1. Aturan yang mengikat

1. **Akar repo tanpa manifest dependensi.** `pyproject.toml` (uv) di `backend/`,
   `package.json` (npm) di `frontend/`. Tidak ada `package.json` di akar.
2. **Data besar tidak masuk repo.** Basemap PMTiles (216 MB) ada di
   `../planning-GeoSafe/data/basemap/indonesia.pmtiles`, `siap-pakai/tabel/`
   (31 MB) dan `titik/*.csv.gz` (13 MB) di `../planning-GeoSafe/data/`; nginx
   menunjuk ke sana lewat `deploy/nginx/` (lokasi `/pmtiles/`).
3. **`.env` hanya di `backend/`.** Kunci NASA FIRMS tidak pernah sampai ke
   `frontend/` dan tidak memakai awalan `VITE_` (variabel `VITE_*` ikut terkirim
   ke peramban).
4. **Angka dan geometri hanya dari PostgreSQL** (basis data `geosafe`; **pengembangan
   sejak 2026-11-17 di Aiven**, PostgreSQL 18.7 + PostGIS 3.6.4, TLS wajib; lokal
   kontainer podman `pg` port 5433 untuk ETL). Aplikasi tidak membaca CSV
   `siap-pakai/` langsung, dan tidak
   mengulang join titik ke wilayah di JavaScript — satu implementasi join, di SQL.
5. **Tidak ada berkas atau folder cadangan.** Hanya berkas yang benar-benar
   dipakai yang dibuat: tidak ada placeholder, fungsi kosong ber-`TODO`,
   konfigurasi untuk nilai yang belum ada, atau folder kosong ber-`.gitkeep`.
   Folder `routers/`, `frontend/`, dan `deploy/` dibuat **saat** isinya ditulis.
6. **Gap berarti nol, dan itu harus dinyatakan.** ETL tidak menulis baris bernilai
   nol (`panel_kabupaten_kota.csv` mengisinya dengan 0, basis data tidak). Karena
   itu setiap endpoint yang angkanya bisa nol **wajib** menyebutkan tahun/seri mana
   yang tidak punya baris — panel memakai medan `notes`, tile memakai properti
   `has_fact`. Antarmuka yang menampilkan "0" harus ikut menampilkan catatannya.
   Jangan menambah baris nol diam-diam di aplikasi.
7. **Komentar dan docstring Bahasa Indonesia**, sedangkan nama folder, berkas,
   fungsi, kelas, variabel, kolom JSON, dan pesan commit Bahasa Inggris.
8. **Berkas layanan tidak masuk repo** (keputusan 2026-11-17). `deploy/` diabaikan
   `.gitignore` — nginx maupun systemd hidup di mesin, karena isinya terikat ke
   mesin itu (jalur mutlak dengan spasi, nama pengguna, port) sedangkan repo
   dipublikasikan. Konsekuensi yang harus disadari: `git clone` **tidak** memberi
   unit atau situs yang bisa dijalankan, dan berkas di `deploy/` hanya ada di disk
   satu mesin. Karena itu isinya wajib tertulis lengkap di `docs/ITERATIONS.md`
   (penyisipan 09a dan 09b), dan memindahkan proyek ke mesin lain berarti menulis
   ulang kedua berkas itu dari catatan tersebut.
9. **Satu pengecualian aturan "tidak ada mock", disetujui pemilik repo
   2026-11-17:** panggilan ke layanan **luar** (NASA FIRMS pada `P2`) disuntikkan
   sebagai dependensi FastAPI, sehingga uji memakai penarik palsu dan tidak
   memakan kuota kunci. Batasnya tegas — yang boleh diganti hanya penarik luar;
   basis data, geometri, dan join wilayah tetap dijalankan sungguhan di
   PostgreSQL, dan uji tetap gagal kalau basis data mati. Alasannya: kuota kunci
   FIRMS berbayar secara harfiah (5.000 transaksi/10 menit, terukur ±29 transaksi
   per penyegaran) dan hasil uji tidak boleh bergantung pada isi langit hari itu.

## 2. Keputusan penamaan (dikunci 2026-11-16)

Dasar aturannya: PEP 8 untuk paket Python ("Modules should have short,
all-lowercase names"), aturan npm untuk `package.json` ("must not have uppercase
letters", nama ikut jadi URL dan nama folder), konvensi Git untuk nama repo, dan
pola yang sudah ada di mesin ini untuk unit systemd serta berkas nginx.

| Benda | Nama | Dasar |
|---|---|---|
| paket Python backend | `backend/app/` | huruf kecil semua (PEP 8); mengikuti contoh resmi FastAPI `uvicorn app.main:app` |
| proyek Python (`pyproject.toml`) | `geosafe-api` | huruf kecil; `-api` membedakan dari nama basis data |
| paket npm | `geosafe-frontend` | npm menolak huruf besar |
| unit systemd | `geosafe-api.service` | pola unit di mesin ini (`backend-abn.service`) |
| berkas nginx | `deploy/nginx/geosafe.conf` | pola situs di mesin ini (`sia-iti`); berkas ini **tidak** masuk git (aturan 8) |
| basis data · kontainer · basemap | `geosafe` · `pg` · `indonesia.pmtiles` | sudah sesuai aturan |
| branch | `main` | konvensi Git |

Nama folder repo (`project-GeoSafe` dan `planning-GeoSafe`) **sengaja tidak
diubah** — jadi jangan dirapikan tanpa persetujuan.

Alternatif yang ditolak beserta alasannya: `web/` + `api/` (memperkenalkan sinonim
untuk lapisan yang sudah bernama Backend/Frontend di SRS), `client/` + `server/`
("server" rancu: mesin, proses, atau basis data?), `apps/web` + `apps/api`
(satu lapis folder ekstra untuk dua aplikasi tanpa pustaka bersama), dan nama
Indonesia seperti `tampilan/` + `layanan/` (seluruh perkakas berbahasa Inggris).

## 3. Konvensi penulisan

| Hal | Aturan |
|---|---|
| Nama folder dan berkas | Bahasa Inggris. Python: huruf kecil, `snake_case` (`maps.py`, `hotspot_series.py`). Konfigurasi: `kebab-case` (`geosafe-api.service`, `geosafe.conf`) |
| Nama fungsi, kelas, variabel | Bahasa Inggris, **termasuk nama fungsi uji** (`test_empty_tile_answers_204`, bukan `test_tile_kosong_balas_204`) dan konstanta modul (`WORLD_TILE`). Python: `snake_case` untuk fungsi/variabel, `PascalCase` untuk kelas. TypeScript: `camelCase` untuk fungsi, `PascalCase` untuk komponen React |
| Nama kolom basis data di SQL | Bahasa Inggris; alias hasil gabungan juga Bahasa Inggris (`fact_rows`, `region_count`), bukan Bahasa Indonesia |
| Nama kolom JSON / API | Bahasa Inggris, sama persis dengan nama kolom basis data (`hotspot_count`, `region_code`, `event_count`) |
| Komentar dan docstring | **Bahasa Indonesia**; nama fungsi, kelas, variabel, dan kolom tetap Inggris |
| Pesan commit | Bahasa Inggris, Conventional Commits |
| `README.md` dan dokumen di `docs/` | Bahasa Indonesia |
| Dokumen perencanaan (SRS, proposal, ERD) | Bahasa Indonesia, tetap di `../planning-GeoSafe/` |

Kode fitur dokumen perencanaan (P1–P5, W1–W4, A1–A3, C1, T1) dipakai **sebagai
penanda traceability**, bukan sebagai nama berkas. Nama berkas router:

| Berkas | Fitur |
|---|---|
| `maps.py` | P1, P3, P5 — tile MVT jumlah titik panas (kabupaten/kota + provinsi) |
| `risk.py` | P4 — skor kerawanan, kelas, dan uji sensitivitas skema bobot |
| `panels.py` | W1–W4 — panel wilayah per tingkat |
| `analysis.py` | A1–A3 — tren, komposisi wilayah, peringkat |
| `search.py` | C1 — pencarian empat tingkat wilayah (provinsi, kabupaten/kota, kecamatan, desa/kelurahan) |
| `latest.py` | P2 — titik panas terkini 24/48/72 jam + cache 15 menit |
| `transparency.py` | T1 — sumber & batas data, unduh CSV |

Berkas dipisah **bukan** menurut nomor kelompok fiturnya, melainkan saat satu
fitur membawa perilaku sendiri yang tidak dipakai tetangganya: `latest.py` punya
cache, snapshot, dan tarikan pihak ketiga; `risk.py` punya skema bobot dan uji
sensitivitas. Fitur yang sekadar menambah satu endpoint baca tetap masuk berkas
kelompoknya.

### Format pesan commit (Conventional Commits)

```
<type>(<scope>): <subject imperatif, huruf kecil, tanpa titik di akhir>
```

- **type**: `feat` · `fix` · `docs` · `refactor` · `perf` · `test` · `build` · `ci` · `chore` · `style`
- **scope**: `api` · `frontend` · `deploy` · `db` · `docs`
- baris judul ≤ 72 karakter; alasan perubahan masuk badan pesan, bukan daftar berkas

Contoh yang benar:

```
feat(api): add choropleth tile endpoint for hotspot series
fix(api): keep regions without fact rows in the hotspot tile
perf(api): index village geometry to cut tile time
test(api): cover point-in-polygon join for recent hotspots
docs: turn README into a project front door
chore(api): add pyproject and uv lockfile
build(deploy): add nginx site config and systemd unit
```

Dilarang: pesan berbahasa Indonesia, `update file`, `fix bug`, `wip`, `revisi`.

## 4. Alur kerja git

Model **trunk-based dengan cabang pendek**. `main` harus selalu bisa dijalankan:
repo ini publik dan aplikasinya dipakai untuk demo.

| Hal | Aturan |
|---|---|
| `main` | selalu bisa dijalankan; **dilarang** `git push --force` |
| Berkas yang tidak masuk git | `deploy/` (unit systemd + situs nginx), data besar, `.env` — lihat aturan 1 dan 8 di bagian 1 |
| Cabang kerja | `feat/<slug>` · `fix/<slug>` · `docs/<slug>` · `chore/<slug>` — huruf kecil, kebab |
| Umur cabang | satu tujuan, 1–3 sesi; lebih dari itu dipotong jadi lebih kecil |
| Masuk ke `main` | Pull Request, lalu **squash merge** — `main` jadi satu commit per fitur |
| Cabang setelah digabung | **tidak dihapus** (dipilih sebagai jejak saat sidang); pengecualian hanya kalau pemilik repo memintanya, dan pengecualian itu dicatat di `ITERATIONS.md` — cabang `refactor/api-english-identifiers` (penyisipan 06b) dihapus atas permintaan pemilik, tag `iter-06b-english-names` tetap ada |
| Jejak iterasi | tag `iter-NN-<slug>` pada commit hasil merge, di-push ke GitHub |
| Deskripsi PR | wajib memuat: apa yang ditambah, kenapa, dan bukti jalannya |
| Perubahan kode | selalu lewat cabang; dokumentasi/aturan boleh langsung ke `main` |

Alasan memilih **squash**, bukan merge commit: tanpa CI tidak ada penjaga mutu
otomatis, sehingga commit tengah cabang yang setengah jalan tidak boleh sampai ke
`main`. Riwayat per-langkah tidak hilang — tetap ada di halaman PR dan di
`refs/pull/<nomor>/head` di GitHub (bisa diambil dengan
`git fetch origin pull/<nomor>/head:<nama-lokal>`).

Cara menjalankan satu fitur:

```bash
git switch -c feat/<slug>
# ... kerja; commit bergaya Conventional Commits ...
git push -u origin feat/<slug>
gh pr create --base main --title "<type>(<scope>): <subject>" --body "<apa, kenapa, bukti>"
gh pr merge <nomor> --squash --subject "<type>(<scope>): <subject>" --body "<ringkasan>"
git switch main && git pull --ff-only
git tag iter-NN-<slug> && git push origin iter-NN-<slug>
```

Antrean iterasi ada di [`MVP.md`](MVP.md) bagian 5; catatan hasil tiap iterasi di
[`ITERATIONS.md`](ITERATIONS.md).

## 5. Jebakan yang sudah pernah kena

1. **uvicorn di latar + port masih dipegang proses lama** → proses baru mati
   dengan `address already in use` **tanpa suara**, dan pengukuran membaca kode
   lama. Selalu periksa `ss -ltnp` atau log proses sebelum mengukur.
2. **`uv run` tidak selalu ada di PATH sesi latar** — pada proses latar, pakai
   jalur mutlak `.venv/bin/python`.
3. **pytest tidak menemukan paket `app`** kalau `pythonpath = ["."]` belum diisi
   di `pyproject.toml` (bawaan pytest menambahkan `tests/`, bukan `backend/`).
4. **`fastapi.testclient` + `httpx`** memunculkan `StarletteDeprecationWarning`
   (menyarankan `httpx2`). Baru peringatan; `httpx` tetap dipakai karena juga
   dipakai menarik data NASA FIRMS.
5. **`git rm --cached` + `.gitignore` + berpindah cabang = berkas hilang dari disk.**
   Berkas yang dikeluarkan dari pelacakan tetap ada di disk sampai Anda memindahkan
   cabang: di cabang asal ia *untracked*, tetapi begitu masuk cabang yang masih
   melacaknya, commit yang menghapusnya ikut dijalankan dan berkasnya lenyap.
   Kejadian 2026-11-17 pada `deploy/systemd/geosafe-api.service` (unitnya bertahan
   hanya karena sudah termuat di memori; restart/reboot akan gagal). Sebelum
   berpindah cabang: salin `deploy/` ke luar repo (mis. `~/geosafe-deploy/`),
   berpindah, lalu pastikan berkasnya masih ada. Memulihkan isi berkas dari
   riwayat: `git show <commit-sebelum-merge>:<path> > <path>`, lalu bandingkan
   dengan `diff` terhadap versi riwayat.
6. **Sesi Hermes dapat mengarahkan `XDG_CONFIG_HOME` ke
   `~/.hermes/bot-desktop/xdg`**, sehingga `gh` mencari konfigurasi di sana dan
   melaporkan "not logged into any GitHub hosts" walau `~/.config/gh/hosts.yml`
   utuh. Jalankan perintah `gh` dengan `GH_CONFIG_DIR="$HOME/.config/gh"` di sesi
   seperti itu.
