"""P1 — peta sebaran titik panas (choropleth kabupaten/kota).

Geometri dikirim sebagai *vector tile* MVT (`ST_AsMVT`) supaya peramban tidak
menerima 514 poligon dalam bentuk GeoJSON. Nilai yang diwarnai diambil dari
`REGION_FACTS` (metrik `hotspot_count`, tahunan, seri `main`, tanpa penyaring
tingkat kepercayaan).

Wilayah yang **belum punya baris fakta** pada tahun itu tetap dikirim: join-nya
`LEFT JOIN` dan hasilnya membawa properti `has_fact` (1/0) serta
`hotspot_count` yang kosong. ETL tidak menulis baris bernilai nol, jadi wilayah
tanpa baris berarti nol deteksi — peramban yang memutuskan cara menggambarnya,
bukan endpoint ini (aturan 7 di README).

Satu implementasi join tetap di SQL; JavaScript tidak menghitung apa pun.
"""

import psycopg
from fastapi import APIRouter, Depends, HTTPException, Path, Query, Response
from psycopg.rows import dict_row
from typing import Literal

from app.db import get_connection
from app.tiles import render_tile

router = APIRouter(prefix="/tiles", tags=["P1 peta titik panas"])

# Geometri disimpan pada SRID 4326; tile dihitung pada 3857. Amplop tile
# diproyeksikan ke 4326 untuk WHERE (agar indeks GiST `ix_region_geom` tetap
# terpakai), lalu geometri diproyeksikan ke 3857 untuk ST_AsMVTGeom.
QUERY_REGION_TILE = """
with tile as (
    select st_tileenvelope(%(z)s, %(x)s, %(y)s) as env_3857
),
mvt_rows as (
    select st_asmvtgeom(
               st_transform(r.geom, 3857),
               tile.env_3857,
               4096,
               256,
               true
           ) as geom,
           r.region_code,
           r.region_name,
           r.province_code,
           f.value as hotspot_count,
           case when f.metric_code is null then 0 else 1 end as has_fact
      from regions r
      left join region_facts f
        on f.region_code = r.region_code
       and f.metric_code = 'hotspot_count'
       and f.year = %(year)s
       and f.month is null
       and f.confidence is not distinct from %(confidence)s
       and f.series = 'main'
      cross join tile
     where r.geom is not null
       and st_intersects(r.geom, st_transform(tile.env_3857, 4326))
)
select st_asmvt(mvt_rows.*, 'regions', 4096, 'geom') as tile
  from mvt_rows
"""

# Tingkat provinsi memakai baris fakta tingkat provinsi (`region_code` kosong,
# `province_code` terisi) — bukan hasil penjumlahan baris kabupaten/kota, karena
# angka provinsi sudah ada di basis data. Baris `level = 'national'` dikecualikan:
# baris itu tidak punya geometri dan bukan wilayah.
QUERY_PROVINCE_TILE = """
with tile as (
    select st_tileenvelope(%(z)s, %(x)s, %(y)s) as env_3857
),
mvt_rows as (
    select st_asmvtgeom(
               st_transform(p.geom, 3857),
               tile.env_3857,
               4096,
               256,
               true
           ) as geom,
           p.province_code,
           p.province_name,
           f.value as hotspot_count,
           case when f.metric_code is null then 0 else 1 end as has_fact
      from provinces p
      left join region_facts f
        on f.province_code = p.province_code
       and f.region_code is null
       and f.metric_code = 'hotspot_count'
       and f.year = %(year)s
       and f.month is null
       and f.confidence is null
       and f.series = 'main'
      cross join tile
     where p.level = 'province'
       and p.geom is not null
       and st_intersects(p.geom, st_transform(tile.env_3857, 4326))
)
select st_asmvt(mvt_rows.*, 'provinces', 4096, 'geom') as tile
  from mvt_rows
"""


@router.get("/regions/{z}/{x}/{y:int}.mvt")
def region_tile(
    year: int = Query(ge=2020, le=2026, description="Tahun seri titik panas"),
    confidence: Literal["h", "n", "l"] | None = Query(
        default=None,
        description=(
            "Tingkat kepercayaan deteksi. Kosong = seluruh kelas (angka resmi "
            "tabel siap pakai). Kelas h+n+l terbukti menjumlah tepat ke angka "
            "tanpa penyaring untuk setiap tahun 2020–2026."
        ),
    ),
    z: int = Path(ge=0, le=14),
    x: int = Path(ge=0),
    y: int = Path(ge=0),
    conn: psycopg.Connection = Depends(get_connection),
) -> Response:
    """Tile kabupaten/kota dengan jumlah titik panas tahun bersangkutan.

    Tile tanpa poligon dibalas **204 tanpa isi** supaya peramban tidak mengurai
    muatan kosong. Penyaring `confidence` hanya berlaku di tingkat ini (`SRS-F-15`):
    baris fakta tingkat provinsi dan nasional tidak dipecah per kelas.
    """
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            QUERY_REGION_TILE,
            {"z": z, "x": x, "y": y, "year": year, "confidence": confidence},
        )
        row = cur.fetchone()

    return render_tile(row["tile"] if row else None)


@router.get("/provinces/{z}/{x}/{y:int}.mvt")
def province_tile(
    year: int = Query(ge=2020, le=2026, description="Tahun seri titik panas"),
    confidence: Literal["h", "n", "l"] | None = Query(
        default=None,
        description=(
            "Tidak didukung di tingkat provinsi: basis data tidak menyimpan baris "
            "provinsi per kelas kepercayaan. Dikirim apa pun → 422."
        ),
    ),
    z: int = Path(ge=0, le=14),
    x: int = Path(ge=0),
    y: int = Path(ge=0),
    conn: psycopg.Connection = Depends(get_connection),
) -> Response:
    """Tile provinsi dengan jumlah titik panas tahun bersangkutan.

    Saklar tingkat tampilan di `SRS-F-13` memakai tile ini. Wilayah tanpa baris
    fakta tetap terkirim dengan `has_fact = 0`, sama seperti tile kabupaten/kota.
    """
    if confidence is not None:
        raise HTTPException(
            status_code=422,
            detail=(
                "penyaring confidence hanya tersedia untuk tile kabupaten/kota; "
                "basis data tidak punya baris provinsi per kelas kepercayaan"
            ),
        )

    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(QUERY_PROVINCE_TILE, {"z": z, "x": x, "y": y, "year": year})
        row = cur.fetchone()

    return render_tile(row["tile"] if row else None)
