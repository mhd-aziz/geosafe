"""T1 — sumber data, batas angka, dan unduhan tabel siap pakai.

Tiga hal yang disajikan router ini:

1. daftar dataset sumber (`data_sources`) — nama, institusi, URL, tanggal akses,
   dan jumlah baris (`SRS-F-72`);
2. penempatan titik panas: berapa titik yang jatuh **di luar** poligon wilayah
   (`SRS-F-76`, dipakai juga oleh `SRS-F-16` di halaman peta). Tabel titik panas
   hanya memuat seri arsip (`main` + `fill`): seri `nrt` tidak dimuat dan hidup di
   endpoint terkini, jadi rincian per seri ikut dikirim di `totals.series` supaya
   dua hal itu tidak bisa tertukar;
3. daftar tabel siap pakai yang boleh diunduh (`SRS-F-75`) beserta pengunduhan satu
   berkas. Berkasnya tinggal di folder data di luar repo aplikasi (aturan repo
   nomor 2), jadi yang disajikan adalah daftar isi folder itu — bukan salinan.
"""

from pathlib import Path
from typing import Any

import psycopg
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from psycopg.rows import dict_row

from app.config import data_dir
from app.db import get_connection

router = APIRouter(prefix="/api/v1", tags=["T1 sumber data"])

# Subfolder `siap-pakai/` yang berisi CSV siap unduh.
DOWNLOAD_SUBDIR = "tabel"

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

# Titik panas per tahun dan seri, dipisah menurut berhasil-tidaknya penempatan ke
# wilayah. `placed_count` menghitung baris ber-`region_code`; sisanya titik yang
# tidak masuk poligon mana pun dan tidak boleh dihilangkan dari laporan.
QUERY_POINT_COVERAGE = """
select extract(year from observed_on)::int as year,
       series,
       count(*) as point_count,
       count(region_code) as placed_count,
       count(*) - count(region_code) as outside_count
  from point_observations
 where point_type = 'hotspot'
   -- rentang tanggal, bukan extract() di WHERE: supaya indeks `ix_po_tanggal`
   -- terpakai (satu tahun turun dari ~1,2 dtk menjadi puluhan milidetik)
   and (%(year)s::int is null
        or (observed_on >= make_date(%(year)s::int, 1, 1)
            and observed_on < make_date(%(year)s::int + 1, 1, 1)))
 group by 1, 2
 order by 1, 2
"""


def _csv_files() -> list[dict[str, Any]]:
    """Isi folder unduhan, urut nama; folder yang tidak ada menghasilkan daftar kosong."""
    folder = data_dir() / DOWNLOAD_SUBDIR
    if not folder.is_dir():
        return []

    files = [
        {"file_name": path.name, "size_bytes": path.stat().st_size}
        for path in folder.glob("*.csv")
        if path.is_file()
    ]
    return sorted(files, key=lambda item: str(item["file_name"]))


@router.get("/sources")
def list_sources(
    conn: psycopg.Connection = Depends(get_connection),
) -> dict[str, Any]:
    """Daftar dataset sumber beserta jumlah baris yang dimuat ke basis data."""
    with conn.cursor() as cur:
        cur.execute(QUERY_SOURCES)
        rows = cur.fetchall()

    return {"count": len(rows), "sources": rows}


@router.get("/point_coverage")
def point_coverage(
    year: int | None = Query(
        default=None,
        ge=2020,
        le=2026,
        description="Batasi ke satu tahun; kosong = seluruh rentang 2020–2026",
    ),
    conn: psycopg.Connection = Depends(get_connection),
) -> dict[str, Any]:
    """Berapa titik panas yang masuk poligon wilayah, dan berapa yang tidak."""
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(QUERY_POINT_COVERAGE, {"year": year})
        rows = cur.fetchall()

    per_year: dict[int, dict[str, Any]] = {}
    for row in rows:
        entry = per_year.setdefault(
            row["year"],
            {
                "year": row["year"],
                "point_count": 0,
                "placed_count": 0,
                "outside_count": 0,
                "series": {},
            },
        )
        entry["point_count"] += row["point_count"]
        entry["placed_count"] += row["placed_count"]
        entry["outside_count"] += row["outside_count"]
        entry["series"][row["series"]] = row["point_count"]

    by_year = [per_year[key] for key in sorted(per_year)]
    total_points = sum(entry["point_count"] for entry in by_year)
    outside = sum(entry["outside_count"] for entry in by_year)
    share = round(outside / total_points * 100, 2) if total_points else None

    series_totals: dict[str, int] = {}
    for entry in by_year:
        for series, count in entry["series"].items():
            series_totals[series] = series_totals.get(series, 0) + count

    notes = [
        "penempatan dihitung terhadap geometri wilayah yang terpasang di basis data "
        "ini, sehingga bisa berbeda sedikit dari angka per wilayah hasil ETL yang "
        "memakai geometri mentah",
        "titik di luar poligon tidak dihapus dan tidak dihitung nol; jumlahnya "
        "dinyatakan di sini supaya selisihnya bisa dipertanggungjawabkan",
    ]
    # Sejak data dibangun ulang 2026-11-19 seri `nrt` tidak dimuat ke tabel titik
    # panas sama sekali (hanya `main` + `fill`); NRT hidup di endpoint terkini.
    if "nrt" not in series_totals:
        notes.append(
            "tabel titik panas hanya memuat seri arsip (main + fill): seri nrt "
            "tidak dimuat dan hanya dipakai endpoint titik panas terkini 24/48/72 "
            "jam, sehingga angka terkini tidak boleh dijumlahkan dengan angka "
            "2020–2026 di halaman ini"
        )
    if not by_year:
        notes.append(
            f"tidak ada baris titik panas untuk tahun {year}"
            if year
            else "tabel titik panas kosong"
        )

    return {
        "year": year,
        "totals": {
            "point_count": total_points,
            "placed_count": total_points - outside,
            "outside_count": outside,
            "outside_share_percent": share,
            "series": series_totals,
        },
        "by_year": by_year,
        "notes": notes,
    }


@router.get("/downloads")
def list_downloads() -> dict[str, Any]:
    """Daftar tabel siap pakai (CSV) yang bisa diunduh pengguna."""
    files = _csv_files()
    notes = []
    if not files:
        notes.append(
            "folder tabel siap pakai tidak ditemukan di mesin ini; unduhan tidak "
            "tersedia sampai datanya dipasang (lihat ../planning-GeoSafe/data/siap-pakai/)"
        )

    return {
        "count": len(files),
        "folder": DOWNLOAD_SUBDIR,
        "files": files,
        "notes": notes,
    }


@router.get("/downloads/{file_name}")
def download_file(file_name: str) -> FileResponse:
    """Unduh satu tabel siap pakai; nama berkas harus ada di daftar folder unduhan."""
    known = {str(item["file_name"]) for item in _csv_files()}
    if file_name not in known:
        raise HTTPException(
            status_code=404,
            detail=f"berkas {file_name} tidak ada di folder unduhan",
        )

    path = data_dir() / DOWNLOAD_SUBDIR / Path(file_name).name
    return FileResponse(path, media_type="text/csv", filename=path.name)
