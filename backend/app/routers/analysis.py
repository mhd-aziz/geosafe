"""A1 — tren nasional 2020–2026, dua seri berdampingan.

Grafik `A1` menampilkan **dua seri yang alat ukurnya berbeda**: jumlah titik panas
(deteksi satelit FIRMS) dan jumlah kejadian karhutla (pencatatan BNPB). Keduanya
tidak boleh dijumlahkan maupun ditaruh pada satu sumbu (`SRS-F-45`, `SRS-F-46`).

Luas terbakar nasional (GWIS) dikirim terpisah sebagai **konteks**, bukan seri
ketiga data penelitian, dan hanya tersedia sampai 2025 pada tingkat nasional
(`SRS-F-47`, `SRS-F-48`) — kenyataan itu ikut dinyatakan di medan `notes`.

Seri titik panas tidak digabung diam-diam: `series` dikirim apa adanya, ditambah
`archive_total` (main + fill) sebagai garis arsip. Seri `nrt` **tidak ada** di
tabel tahunan sejak data dibangun ulang 2026-11-19 (NRT hanya dipakai fitur
terkini `P2`), jadi medan `nrt` selalu kosong; medan itu dipertahankan supaya
bentuk balasan tidak berubah. Nol ditulis eksplisit oleh ETL, jadi tahun tanpa
baris berarti angkanya belum dimuat — dan itu dinyatakan di `notes`.
"""

from typing import Any

import psycopg
from fastapi import APIRouter, Depends
from psycopg.rows import dict_row

from app.db import get_connection

router = APIRouter(prefix="/api/v1/analysis", tags=["A1 tren dua seri"])

# Rentang data proyek; dipakai untuk mengenali tahun yang tidak punya baris.
EXPECTED_YEARS: tuple[int, ...] = (2020, 2021, 2022, 2023, 2024, 2025, 2026)

# Metrik yang dibaca grafik ini. Menambah seri = menambah daftar ini.
METRICS: tuple[str, ...] = ("hotspot_count", "event_count", "burned_area_ha")

# Baris tingkat nasional ditandai `region_code` dan `province_code` sama-sama kosong.
QUERY_NATIONAL_FACTS = """
select f.metric_code,
       f.year,
       f.series,
       f.value
  from region_facts f
 where f.region_code is null
   and f.province_code is null
   and f.month is null
   and f.confidence is null
   and f.metric_code = any(%(metrics)s)
 order by f.metric_code, f.year, f.series
"""

# Nama dan satuan diambil dari tabel `metrics`, bukan ditulis ulang di kode.
QUERY_METRIC_LABELS = """
select metric_code, metric_name, unit
  from metrics
 where metric_code = any(%(metrics)s)
"""


def _missing_years(years_present: set[int]) -> list[int]:
    """Tahun dalam rentang proyek yang tidak punya baris sama sekali."""
    return [year for year in EXPECTED_YEARS if year not in years_present]


def _trend_notes(
    hotspot: list[dict[str, Any]],
    events: list[dict[str, Any]],
    burned: list[dict[str, Any]],
) -> list[str]:
    """Batasan yang wajib ikut tampil di bawah grafik, bukan disembunyikan."""
    notes = [
        "titik panas dan kejadian memakai alat ukur berbeda: titik panas adalah "
        "deteksi satelit (FIRMS), kejadian adalah pencatatan kejadian karhutla "
        "(BNPB), sehingga keduanya tidak boleh dijumlahkan dan digambar pada dua "
        "sumbu terpisah",
        "luas terbakar nasional (GWIS) hanya konteks, bukan seri ketiga data "
        "penelitian; seri ini hanya tersedia sampai 2025 dan hanya pada tingkat "
        "nasional",
    ]

    if any(row["nrt"] is not None for row in hotspot):
        notes.append(
            "seri nrt berasal dari pemrosesan berbeda dan tidak sebanding dengan "
            "seri arsip; angkanya dikirim terpisah dan tidak masuk archive_total"
        )
    elif hotspot:
        notes.append(
            "tabel tahunan tidak memuat seri nrt sejak data dibangun ulang "
            "2026-11-19; NRT hanya hidup di fitur titik panas terkini (24/48/72 jam) "
            "dan tidak boleh dijumlahkan dengan angka arsip 2020–2026"
        )

    fill_years = sorted({row["year"] for row in hotspot if "fill" in row["series"]})
    if fill_years:
        notes.append(
            "archive_total = seri main + seri fill; seri fill hanya punya baris "
            f"untuk tahun {', '.join(str(y) for y in fill_years)}"
        )

    for label, rows in (
        ("titik panas", hotspot),
        ("kejadian", events),
    ):
        missing = _missing_years({row["year"] for row in rows})
        if missing:
            notes.append(
                f"seri {label} tidak memuat baris untuk tahun "
                f"{', '.join(str(y) for y in missing)} karena ETL tidak menulis "
                "baris bernilai nol; tahun yang hilang berarti nol deteksi atau nol "
                "kejadian tercatat"
            )

    burned_years = {row["year"] for row in burned}
    if 2026 not in burned_years:
        notes.append(
            "luas terbakar 2026 tidak tersedia; seri GWIS berhenti di 2025 sehingga "
            "tahun itu dikosongkan, bukan diisi nol"
        )
    return notes


@router.get("/national_trend")
def national_trend(
    conn: psycopg.Connection = Depends(get_connection),
) -> dict[str, Any]:
    """Tren nasional 2020–2026: titik panas dan kejadian, plus luas terbakar
    sebagai konteks."""
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(QUERY_NATIONAL_FACTS, {"metrics": list(METRICS)})
        facts = cur.fetchall()
        cur.execute(QUERY_METRIC_LABELS, {"metrics": list(METRICS)})
        labels = cur.fetchall()

    hotspot: list[dict[str, Any]] = []
    events: list[dict[str, Any]] = []
    burned: list[dict[str, Any]] = []

    # Kumpulkan nilai titik panas per tahun supaya seri dan totalnya bisa disusun
    # dalam satu baris per tahun.
    by_year: dict[int, dict[str, float]] = {}
    for row in facts:
        if row["metric_code"] == "hotspot_count":
            by_year.setdefault(row["year"], {})[row["series"]] = row["value"]
        elif row["metric_code"] == "event_count":
            events.append({"year": row["year"], "event_count": row["value"]})
        elif row["metric_code"] == "burned_area_ha":
            burned.append({"year": row["year"], "burned_area_ha": row["value"]})

    for year in sorted(by_year):
        series = by_year[year]
        # main dan fill sama-sama seri arsip; nrt dipisah karena beda pemrosesan.
        archive_values = [series[name] for name in ("main", "fill") if name in series]
        hotspot.append(
            {
                "year": year,
                "series": series,
                "archive_total": sum(archive_values) if archive_values else None,
                "nrt": series.get("nrt"),
            }
        )

    events.sort(key=lambda row: row["year"])
    burned.sort(key=lambda row: row["year"])

    return {
        "scope": "national",
        "years": list(EXPECTED_YEARS),
        "hotspot_by_year": hotspot,
        "event_by_year": events,
        "burned_area_by_year": burned,
        "units": {row["metric_code"]: row["unit"] for row in labels},
        "metric_names": {row["metric_code"]: row["metric_name"] for row in labels},
        "notes": _trend_notes(hotspot, events, burned),
    }