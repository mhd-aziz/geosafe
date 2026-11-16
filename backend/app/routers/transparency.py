"""T1 — sumber dan batas data.

Endpoint pertama yang membaca basis data: daftar dataset yang masuk ke GeoSafe
beserta institusi, tanggal akses, dan jumlah barisnya. Isinya tabel
`data_sources` (14 tabel ERD).
"""

from typing import Any

import psycopg
from fastapi import APIRouter, Depends

from app.db import get_connection

router = APIRouter(prefix="/api/v1", tags=["T1 sumber data"])

QUERY_SOURCES = """
    select source_code,
           source_name,
           institution,
           source_url,
           accessed_on,
           data_until,
           row_count
      from data_sources
     order by source_code
"""


@router.get("/sources")
def list_sources(
    conn: psycopg.Connection = Depends(get_connection),
) -> dict[str, Any]:
    """Daftar dataset sumber beserta jumlah baris yang dimuat ke basis data."""
    with conn.cursor() as cur:
        cur.execute(QUERY_SOURCES)
        rows = cur.fetchall()

    return {"count": len(rows), "sources": rows}
