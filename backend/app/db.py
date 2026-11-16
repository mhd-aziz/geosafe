"""Koneksi ke PostgreSQL (PostGIS) tempat seluruh angka aplikasi tinggal.

psycopg bersifat sinkron, jadi setiap endpoint yang membaca basis data ditulis
sebagai `def` biasa (bukan `async def`): FastAPI menjalankannya di threadpool
sehingga event loop tidak terblokir.

Satu koneksi dibuka per permintaan, `autocommit` karena aplikasi hanya membaca
(tidak ada penulisan pengguna, SRS-C-07). Kalau ukuran latensi menuntut, langkah
berikutnya adalah `psycopg_pool.ConnectionPool`.
"""

from collections.abc import Iterator

import psycopg
from psycopg.rows import dict_row

from app.config import database_url


def get_connection() -> Iterator[psycopg.Connection]:
    """Dependency FastAPI: buka satu koneksi, tutup otomatis setelah permintaan."""
    with psycopg.connect(
        database_url(),
        row_factory=dict_row,
        autocommit=True,
        connect_timeout=5,
    ) as conn:
        yield conn
