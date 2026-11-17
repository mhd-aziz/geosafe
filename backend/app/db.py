"""Koneksi ke PostgreSQL (PostGIS) tempat seluruh angka aplikasi tinggal.

psycopg bersifat sinkron, jadi setiap endpoint yang membaca basis data ditulis
sebagai `def` biasa (bukan `async def`): FastAPI menjalankannya di threadpool
sehingga event loop tidak terblokir.

**Satu kolam koneksi (`psycopg_pool`), bukan satu koneksi per permintaan.**
Keputusan awal (iterasi 01) memakai koneksi per permintaan karena ukurannya
0,028-0,029 dtk. Pengukuran 2026-11-17 membatalkannya: lapisan kerawanan desa di
peta meminta belasan tile MVT sekaligus, dan server Aiven hanya mengizinkan
**15 koneksi** yang 11 di antaranya sudah dipakai proses internalnya sendiri —
sebagian permintaan lalu dijawab `500` dengan
`FATAL: remaining connection slots are reserved for roles with the SUPERUSER
attribute`, dan pita galat muncul di peta. Kolam berukuran kecil sekaligus
menghapus jabat tangan TLS per permintaan (setiap koneksi baru ke Aiven memang
berbiaya ±0,3 dtk).

Koneksi dipinjam per permintaan dan dikembalikan ke kolam saat permintaan
selesai; `autocommit` karena aplikasi hanya membaca (tidak ada penulisan
pengguna, SRS-C-07).
"""

from collections.abc import Iterator
from functools import lru_cache
from typing import Any, cast

import psycopg
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

from app.config import database_url

# Ukuran kolam dijaga kecil dengan sengaja: `max_connections` server hanya 15 dan
# proses internal Aiven memakai 11 di antaranya. Permintaan yang berlebih antre
# sejenak, bukan ditolak server.
POOL_MIN_SIZE = 1
POOL_MAX_SIZE = 3

# Tipe baris kolam: `dict_row` membuat setiap baris menjadi `dict`, dan itu tidak
# bisa dinyatakan lewat `connection_class` bawaan pustakanya (bawaannya
# `TupleRow`), jadi tipenya ditegaskan di sini.
PoolType = ConnectionPool[psycopg.Connection[Any]]


@lru_cache(maxsize=1)
def get_pool() -> PoolType:
    """Kolam koneksi proses ini; dibuka saat permintaan pertama."""
    pool = cast(
        PoolType,
        ConnectionPool(
            conninfo=database_url(),
            min_size=POOL_MIN_SIZE,
            max_size=POOL_MAX_SIZE,
            kwargs={
                "row_factory": dict_row,
                "autocommit": True,
                "connect_timeout": 5,
            },
            open=False,
            name="geosafe",
        ),
    )
    pool.open()
    return pool


def get_connection() -> Iterator[psycopg.Connection]:
    """Dependency FastAPI: pinjam satu koneksi dari kolam, kembalikan setelahnya."""
    with get_pool().connection() as conn:
        yield conn