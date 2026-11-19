"""P1 — peta sebaran titik panas (choropleth kabupaten/kota).

Geometri dikirim sebagai *vector tile* MVT (`ST_AsMVT`) supaya peramban tidak
menerima 514 poligon dalam bentuk GeoJSON. Nilai yang diwarnai diambil dari
`REGION_FACTS` (metrik `hotspot_count`, tahunan, seri `main`, tanpa penyaring
tingkat kepercayaan).

Wilayah yang **belum punya baris fakta** pada tahun itu tetap dikirim: join-nya
`LEFT JOIN` dan hasilnya membawa properti `has_fact` (1/0). Sejak data dibangun
ulang 2026-11-19, ETL menulis **nol secara eksplisit**, jadi `has_fact = 1` dengan
`hotspot_count = 0` berarti *nol deteksi yang terukur* (2020: 39 wilayah), dan
`has_fact = 0` hanya muncul bila wilayah itu belum punya baris sama sekali.
Peramban yang memutuskan cara menggambarnya, bukan endpoint ini.

Satu implementasi join tetap di SQL; JavaScript tidak menghitung apa pun.

Sejak 13b tile ini juga membawa `hotspot_per_1000_km2` untuk tahun yang dipilih
(`hotspot_count × 1000 / regions.area_km2`). Angkanya mengikuti seri `main` seperti
`hotspot_count` di tile ini, sedangkan panel `W2`, komposisi `A2`, dan peringkat
`A3` memakai arsip total (`main + fill`) — selisihnya kecil tetapi nyata
(Merauke 2023: 22.463 vs 22.474), jadi jangan dibandingkan tanpa menyebut serinya.
"""

import psycopg
from fastapi import APIRouter, Depends, HTTPException, Path, Query, Response
from psycopg.rows import dict_row
from typing import Literal

from app.db import get_connection
from app.tiles import check_tile_bounds, render_tile

router = APIRouter(prefix="/tiles", tags=["P1 peta titik panas"])

# `P3` memakai berkas yang sama (tile MVT wilayah) tetapi artinya berbeda: yang
# diwarnai adalah **kejadian tercatat BNPB**, bukan deteksi satelit. Tag dipisah
# supaya `/docs` menunjuk kode fiturnya.
event_router = APIRouter(prefix="/tiles", tags=["P3 peta kejadian"])

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
           -- Kepadatan = deteksi tahun itu per 1.000 km², rumus yang sama dengan
           -- metrik `hotspot_per_1000_km2` di `REGION_FACTS` (rata-rata 2020–2025
           -- = rata-rata kepadatan tahunan, dibuktikan 0 selisih > 0,05 di 514
           -- wilayah). Dihitung di sini karena metrik tersimpan itu tidak bertahun.
           -- Ikut penyaring `confidence` bila dipakai: angkanya kepadatan subset itu.
           round(
               (f.value * 1000.0 / nullif(r.area_km2, 0))::numeric,
               2
           ) as hotspot_per_1000_km2,
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
    check_tile_bounds(z, x, y)

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

    Tile ini **tidak** membawa `hotspot_per_1000_km2`: tabel `provinces` tidak
    menyimpan luas wilayah, sedangkan menghitung luas dari geometri pada setiap
    permintaan tile belum diukur biayanya. Kepadatan hanya ada di tile
    kabupaten/kota, tempat `regions.area_km2` tersedia.
    """
    if confidence is not None:
        raise HTTPException(
            status_code=422,
            detail=(
                "penyaring confidence hanya tersedia untuk tile kabupaten/kota; "
                "basis data tidak punya baris provinsi per kelas kepercayaan"
            ),
        )
    check_tile_bounds(z, x, y)

    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(QUERY_PROVINCE_TILE, {"z": z, "x": x, "y": y, "year": year})
        row = cur.fetchone()

    return render_tile(row["tile"] if row else None)


# Tile `P3`: jumlah **kejadian tercatat BNPB** per kabupaten/kota per tahun
# (`SRS-F-28`, `SRS-F-29`). Tiga penyaring yang wajib ada, masing-masing pernah
# menyesatkan kalau hilang:
#
# - `month is null` — `region_facts` memuat baris bulanan untuk `event_count`
#   (2.680 baris), dan jumlahnya sama dengan baris tahunan pada tahun yang sama
#   (2023: 2.153 bulanan dan 2.153 tahunan). Tanpa penyaring ini satu tahun
#   terhitung dua kali.
# - `series is null` — kejadian tidak berseri seperti titik panas; baris `nrt`
#   maupun `fill` tidak pernah ada di metrik ini.
# - `confidence is null` — kejadian adalah catatan peristiwa, bukan deteksi
#   satelit, jadi tidak dipecah menurut kelas kepercayaan (endpoint ini juga tidak
#   menerima `?confidence`).
#
# Arti `has_fact` di tile ini **berbeda** dari tile titik panas: BNPB hanya
# mencatat kejadian yang terjadi, jadi wilayah tanpa baris berarti *tidak ada
# kejadian tercatat* pada tahun itu — bukan "angkanya belum dimuat". Dasarnya
# terukur: baris nasional sama dengan jumlah baris kabupaten/kota setiap tahun
# (2023: 2.153 = 2.153), sehingga tidak ada kejadian yang hilang di tingkat
# wilayah. `has_fact = 0` tetap dikirim supaya peramban bisa membedakan wilayah
# berkejadian nol dari wilayah yang tidak digambar.
QUERY_EVENT_TILE = """
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
           r.region_type,
           r.province_code,
           %(year)s::int as year,
           f.value as event_count,
           case when f.metric_code is null then 0 else 1 end as has_fact
      from regions r
      left join region_facts f
        on f.region_code = r.region_code
       and f.metric_code = 'event_count'
       and f.year = %(year)s
       and f.month is null
       and f.confidence is null
       and f.series is null
      cross join tile
     where r.geom is not null
       and st_intersects(r.geom, st_transform(tile.env_3857, 4326))
)
select st_asmvt(mvt_rows.*, 'events', 4096, 'geom') as tile
  from mvt_rows
"""


@event_router.get("/events/{z}/{x}/{y:int}.mvt")
def event_tile(
    year: int = Query(ge=2020, le=2026, description="Tahun kejadian tercatat BNPB"),
    z: int = Path(ge=0, le=14),
    x: int = Path(ge=0),
    y: int = Path(ge=0),
    conn: psycopg.Connection = Depends(get_connection),
) -> Response:
    """Tile kabupaten/kota dengan jumlah kejadian karhutla tahun bersangkutan (`P3`).

    Wilayah tanpa baris tetap dikirim dengan `has_fact = 0`, yang di lapisan ini
    berarti *tidak ada kejadian tercatat* — bukan angka yang belum dimuat.
    Tahun 2026 adalah angka berjalan sampai akhir tahun (`SRS-AS-06`).
    """
    check_tile_bounds(z, x, y)

    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(QUERY_EVENT_TILE, {"z": z, "x": x, "y": y, "year": year})
        row = cur.fetchone()

    return render_tile(row["tile"] if row else None)
