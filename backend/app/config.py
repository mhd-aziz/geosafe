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

# Bawaan: `data/siap-pakai/` di repo perencanaan, dihitung dari letak repo ini
# (`project-GeoSafe/backend/app/config.py` → `project-GeoSafe/` → `planning-GeoSafe/`).
_DEFAULT_DATA_DIR = Path(__file__).resolve().parents[3] / "planning-GeoSafe" / "data" / "siap-pakai"


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
