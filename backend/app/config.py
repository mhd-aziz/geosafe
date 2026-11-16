"""Konfigurasi aplikasi dari variabel lingkungan.

Nilai rahasia tidak pernah ditulis di repo. Di server, DSN diisi lewat
`EnvironmentFile` pada unit systemd; di mesin pengembangan, diisi dengan
`export` sebelum menjalankan uvicorn atau pytest.
"""

import os
from pathlib import Path

# Variabel lingkungan yang dibaca saat ini. Hanya yang benar-benar dipakai;
# kunci NASA FIRMS ditambahkan nanti bersama modul penariknya.
DATABASE_URL_ENV = "GEOSAFE_DATABASE_URL"
DATA_DIR_ENV = "GEOSAFE_DATA_DIR"
FIRMS_KEY_ENV = "FIRMS_MAP_KEY"
SNAPSHOT_PATH_ENV = "GEOSAFE_SNAPSHOT_PATH"

# Bawaan: `data/siap-pakai/` di repo perencanaan, dihitung dari letak repo ini
# (`project-GeoSafe/backend/app/config.py` → `project-GeoSafe/` → `planning-GeoSafe/`).
_DEFAULT_DATA_DIR = Path(__file__).resolve().parents[3] / "planning-GeoSafe" / "data" / "siap-pakai"

# Snapshot titik panas terkini: di dalam `backend/`, di-`.gitignore`.
_DEFAULT_SNAPSHOT_PATH = Path(__file__).resolve().parents[1] / "snapshot.json"


def database_url() -> str:
    """DSN PostgreSQL/PostGIS (bentuk conninfo: `host=... port=... dbname=...`).

    Gagal cepat dengan pesan jelas, bukan galat sambungan yang membingungkan.
    """
    dsn = os.environ.get(DATABASE_URL_ENV, "").strip()
    if not dsn:
        raise RuntimeError(
            f"Variabel lingkungan {DATABASE_URL_ENV} belum diisi. "
            "Contoh: export GEOSAFE_DATABASE_URL="
            "'host=127.0.0.1 port=5433 dbname=geosafe user=... password=***"
        )
    return dsn


def data_dir() -> Path:
    """Folder tabel siap pakai yang boleh diunduh pengguna (`SRS-F-75`).

    Berkasnya sengaja **tidak** masuk repo aplikasi (aturan repo nomor 2); di
    homelab isinya `../planning-GeoSafe/data/siap-pakai/`. Kalau foldernya tidak
    ada, endpoint unduhan menyebutkannya — bukan menyajikan daftar kosong tanpa
    sebab.
    """
    raw = os.environ.get(DATA_DIR_ENV, "").strip()
    return Path(raw).expanduser().resolve() if raw else _DEFAULT_DATA_DIR


def firms_map_key() -> str:
    """Kunci NASA FIRMS untuk tarikan titik panas terkini (`P2`).

    Hanya ada di server: berkasnya di luar repo (`~/.config/geosafe/geosafe.env`,
    dibaca unit systemd lewat `EnvironmentFile`) dan tidak pernah sampai ke
    peramban (`SRS-C-01`). Gagal cepat dengan pesan jelas, sama seperti DSN.
    """
    key = os.environ.get(FIRMS_KEY_ENV, "").strip()
    if not key:
        raise RuntimeError(
            f"Variabel lingkungan {FIRMS_KEY_ENV} belum diisi. "
            "Kunci gratis dari FIRMS, disimpan di berkas rahasia di luar repo."
        )
    return key


def snapshot_path() -> Path:
    """Berkas snapshot titik panas terkini (`SRS-F-25`).

    Bawaannya `backend/snapshot.json` (di-`.gitignore`); dapat dipindahkan lewat
    `GEOSAFE_SNAPSHOT_PATH` supaya uji tidak menulis ke berkas yang dipakai
    layanan.
    """
    raw = os.environ.get(SNAPSHOT_PATH_ENV, "").strip()
    return Path(raw).expanduser() if raw else _DEFAULT_SNAPSHOT_PATH
