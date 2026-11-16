"""Konfigurasi aplikasi dari variabel lingkungan.

Nilai rahasia tidak pernah ditulis di repo. Di server, DSN diisi lewat
`EnvironmentFile` pada unit systemd; di mesin pengembangan, diisi dengan
`export` sebelum menjalankan uvicorn atau pytest.
"""

import os

# Variabel lingkungan yang dibaca saat ini. Hanya yang benar-benar dipakai;
# kunci NASA FIRMS ditambahkan nanti bersama modul penariknya.
DATABASE_URL_ENV = "GEOSAFE_DATABASE_URL"


def database_url() -> str:
    """DSN PostgreSQL/PostGIS (bentuk conninfo: `host=... port=... dbname=...`).

    Gagal cepat dengan pesan jelas, bukan galat sambungan yang membingungkan.
    """
    dsn = os.environ.get(DATABASE_URL_ENV, "").strip()
    if not dsn:
        raise RuntimeError(
            f"Variabel lingkungan {DATABASE_URL_ENV} belum diisi. "
            "Contoh: export GEOSAFE_DATABASE_URL="
            "'host=127.0.0.1 port=5433 dbname=geosafe user=... password=...'"
        )
    return dsn
