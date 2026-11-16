"""C1 — pencarian wilayah satu kotak untuk empat tingkat administrasi.

Satu permintaan = satu query yang menelusuri `PROVINCES`, `REGIONS`
(kabupaten/kota), `DISTRICTS` (kecamatan), dan `VILLAGES` (desa/kelurahan),
sesuai pemetaan fitur `C1` di SRS (tabel `PROVINCES`, `REGIONS`, `DISTRICTS`,
`VILLAGES`). Hasilnya dibatasi 20 baris (`SRS-F-68`).

Nama kembar dibedakan lewat medan `level`, `region_type` (kabupaten vs kota),
dan `province_name` (`SRS-F-69`). Setiap baris membawa `bbox` supaya peramban
dapat memperbesar peta ke wilayah itu (`SRS-F-70`); baris tanpa geometri
mengirim `bbox` kosong dan `has_geometry = 0`.

Kata kunci yang tidak menemukan apa pun tetap dibalas **200** dengan
`results = []` dan medan `notes` yang menyebut sebabnya (`SRS-F-71`) — bukan
404, karena kotak pencarian yang tidak menemukan hasil bukan wilayah tak dikenal.
"""

from typing import Any

import psycopg
from fastapi import APIRouter, Depends, Query
from psycopg.rows import dict_row

from app.db import get_connection

router = APIRouter(prefix="/api/v1", tags=["C1 pencarian wilayah"])

# Batas baris hasil. `SRS-F-68` menetapkan maksimal 20 baris saran.
MAX_RESULTS = 20

# Panjang kata kunci minimum: satu huruf akan mencocokkan hampir semua nama
# kecamatan/desa, jadi bukan saran yang berguna.
MIN_KEYWORD_LENGTH = 2

# Satu query untuk empat tingkat. Urutan hasil: nama sama persis lebih dulu
# (semua tingkat), lalu tingkat lebih tinggi (provinsi, kabupaten/kota,
# kecamatan, desa/kelurahan), dan di dalam satu tingkat: awalan nama, awalan
# kode, lalu nama yang memuat kata kunci. Tingkat didahulukan supaya nama kembar
# kabupaten/kota tidak tertutup puluhan desa berawalan sama, padahal hasil
# dibatasi 20 baris (`SRS-F-68`, `SRS-F-69`).
QUERY_SEARCH = """
with keyword as (
    select %(keyword)s::text as kw,
           lower(%(keyword)s::text) as kw_lower
),
matches as (
    -- tingkat provinsi (baris `level = 'national'` tidak ikut: bukan wilayah)
    select 'province'::text as level,
           p.province_code as code,
           p.province_name as name,
           null::text as region_type,
           null::text as parent_code,
           null::text as parent_name,
           p.province_code as province_code,
           p.province_name as province_name,
           p.latitude,
           p.longitude,
           p.has_geometry::int as has_geometry,
           p.geom
      from provinces p
      cross join keyword k
     where p.level = 'province'
       and (p.province_name ilike k.kw || '%%'
            or p.province_name ilike '%%' || k.kw || '%%'
            or p.province_code like k.kw || '%%')

    union all

    -- tingkat kabupaten/kota
    select 'regency', r.region_code, r.region_name, r.region_type,
           r.province_code, p.province_name,
           r.province_code, p.province_name,
           r.latitude, r.longitude, r.has_geometry,
           r.geom
      from regions r
      join provinces p on p.province_code = r.province_code
      cross join keyword k
     where r.region_name ilike k.kw || '%%'
        or r.region_name ilike '%%' || k.kw || '%%'
        or r.region_code like k.kw || '%%'

    union all

    -- tingkat kecamatan
    select 'district', d.district_code, d.district_name, null,
           d.region_code, r.region_name,
           r.province_code, p.province_name,
           null, null, (d.geom is not null)::int,
           d.geom
      from districts d
      join regions r on r.region_code = d.region_code
      join provinces p on p.province_code = r.province_code
      cross join keyword k
     where d.district_name ilike k.kw || '%%'
        or d.district_name ilike '%%' || k.kw || '%%'
        or d.district_code like k.kw || '%%'

    union all

    -- tingkat desa/kelurahan; `left join` supaya desa yang kode kecamatan
    -- induknya tidak diterbitkan sumbernya tetap muncul (provinsi kosong),
    -- bukan hilang dari hasil pencarian tanpa penjelasan
    select 'village', v.village_code, v.village_name, null,
           v.district_code, d.district_name,
           r.province_code, p.province_name,
           null, null, (v.geom is not null)::int,
           v.geom
      from villages v
      left join districts d on d.district_code = v.district_code
      left join regions r on r.region_code = d.region_code
      left join provinces p on p.province_code = r.province_code
      cross join keyword k
     where v.village_name ilike k.kw || '%%'
        or v.village_name ilike '%%' || k.kw || '%%'
        or v.village_code like k.kw || '%%'
),
ranked as (
    select m.level,
           m.code,
           m.name,
           m.region_type,
           m.parent_code,
           m.parent_name,
           m.province_code,
           m.province_name,
           m.latitude,
           m.longitude,
           m.has_geometry,
           case when lower(m.name) = k.kw_lower then 0
                when lower(m.name) like k.kw_lower || '%%' then 1
                when m.code like k.kw || '%%' then 2
                else 3 end as match_rank,
           case m.level when 'province' then 0
                        when 'regency' then 1
                        when 'district' then 2
                        else 3 end as level_rank,
           st_xmin(st_envelope(m.geom)) as min_x,
           st_ymin(st_envelope(m.geom)) as min_y,
           st_xmax(st_envelope(m.geom)) as max_x,
           st_ymax(st_envelope(m.geom)) as max_y
      from matches m
      cross join keyword k
)
select level,
       code,
       name,
       region_type,
       parent_code,
       parent_name,
       province_code,
       province_name,
       latitude,
       longitude,
       has_geometry,
       min_x,
       min_y,
       max_x,
       max_y
  from ranked
 order by case when match_rank = 0 then 0 else 1 end,
          level_rank,
          match_rank,
          name,
          code
 limit %(limit)s
"""


def _escape_like(keyword: str) -> str:
    """Netralkan `%`, `_`, dan `\\` supaya kata kunci diperlakukan sebagai teks."""
    return keyword.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def _result_row(row: dict[str, Any]) -> dict[str, Any]:
    """Susun satu baris hasil; `bbox` hanya diisi kalau geometrinya ada."""
    bbox = [row["min_x"], row["min_y"], row["max_x"], row["max_y"]]
    return {
        "level": row["level"],
        "code": row["code"],
        "name": row["name"],
        "region_type": row["region_type"],
        "parent_code": row["parent_code"],
        "parent_name": row["parent_name"],
        "province_code": row["province_code"],
        "province_name": row["province_name"],
        "latitude": row["latitude"],
        "longitude": row["longitude"],
        "has_geometry": row["has_geometry"],
        "bbox": bbox if all(value is not None for value in bbox) else None,
    }


def _search_notes(keyword: str, results: list[dict[str, Any]]) -> list[str]:
    """Sebutkan batasan yang berlaku, terutama saat hasilnya kosong."""
    if not results:
        return [
            f'kata kunci "{keyword}" tidak menemukan wilayah pada empat tingkat '
            "(provinsi, kabupaten/kota, kecamatan, desa/kelurahan)",
            "pencarian memakai nama resmi dan kode wilayah versi BPS, jadi ejaan "
            "lain atau singkatan (mis. \"Kab.\") tidak cocok",
            f"kata kunci kurang dari {MIN_KEYWORD_LENGTH} huruf memang tidak "
            "dilayani karena akan mencocokkan hampir semua nama",
        ]

    notes: list[str] = []
    if any(row["code"] is None for row in results):
        notes.append(
            "sebagian baris tidak punya kode wilayah (code kosong) karena kode itu "
            "memang tidak diterbitkan sumbernya"
        )
    if any(row["province_code"] is None and row["level"] == "village" for row in results):
        notes.append(
            "sebagian desa/kelurahan tidak punya kode kecamatan induk, sehingga "
            "kecamatan, kabupaten/kota, dan provinsinya kosong"
        )
    if any(row["has_geometry"] == 0 for row in results):
        notes.append(
            "sebagian baris tidak punya geometri (has_geometry 0), sehingga tidak "
            "bisa dipakai memperbesar peta"
        )
    if len(results) == MAX_RESULTS:
        notes.append(
            f"hasil tepat {MAX_RESULTS} baris, yaitu batas maksimal saran, jadi bisa "
            "ada wilayah lain yang cocok — persempit kata kunci"
        )
    return notes


@router.get("/search/regions")
def search_regions(
    q: str = Query(
        min_length=MIN_KEYWORD_LENGTH,
        max_length=64,
        description="Nama atau kode wilayah (provinsi, kabupaten/kota, kecamatan, desa/kelurahan)",
    ),
    limit: int = Query(default=MAX_RESULTS, ge=1, le=MAX_RESULTS),
    conn: psycopg.Connection = Depends(get_connection),
) -> dict[str, Any]:
    """Cari wilayah di empat tingkat administrasi, maksimal 20 baris saran."""
    keyword = q.strip()
    if len(keyword) < MIN_KEYWORD_LENGTH:
        return {
            "query": q,
            "limit": limit,
            "count": 0,
            "results": [],
            "notes": _search_notes(keyword, []),
        }

    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            QUERY_SEARCH,
            {"keyword": _escape_like(keyword), "limit": limit},
        )
        rows = cur.fetchall()

    results = [_result_row(row) for row in rows]
    return {
        "query": keyword,
        "limit": limit,
        "count": len(results),
        "results": results,
        "notes": _search_notes(keyword, results),
    }
