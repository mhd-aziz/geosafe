"""A1 — tren nasional 2020–2026, dua seri berdampingan; A2 — komposisi wilayah;
A3 — peringkat kabupaten/kota.

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

`A2`/`A3` membaca tabel yang sama. Nilai satu wilayah untuk satu tahun adalah
**jumlah seri arsip** (`main` + `fill`), sama dengan `archive_total` di `A1`;
`event_count` tidak punya seri. `A3` mengirim seluruh 514 kabupaten/kota sekali
(± 60 kB) dan membiarkan pengurutan serta pencarian di peramban, karena
memindahkannya ke server hanya menambah parameter tanpa menghemat muatan.

Penanda **tahun parsial** diturunkan dari data yang benar-benar terukur
(`point_observations`): tanggal deteksi terakhir dalam setahun dibandingkan dengan
31 Desember. Sampai 2026-11-19, 2026 hanya terukur sampai **31 Juli 2026** (212 dari
365 hari, 58,1%) — angka setahun penuh tidak boleh diklaim untuk tahun itu.
"""

import calendar
import time
from datetime import date
from typing import Any, Literal

import psycopg
from fastapi import APIRouter, Depends, Query
from psycopg.rows import dict_row

from app.db import get_connection

router = APIRouter(prefix="/api/v1/analysis", tags=["A1 tren dua seri"])
# `A2` dan `A3` memakai berkas yang sama (keluarga analisis) tetapi tag dipisah
# supaya `/docs` tetap menunjuk kode fiturnya, seperti pola `panels.py`.
composition_router = APIRouter(prefix="/api/v1/analysis", tags=["A2 komposisi wilayah"])
ranking_router = APIRouter(prefix="/api/v1/analysis", tags=["A3 peringkat kabupaten/kota"])

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
    coverage = _year_coverage(conn)

    return {
        "scope": "national",
        "years": list(EXPECTED_YEARS),
        "hotspot_by_year": hotspot,
        "event_by_year": events,
        "burned_area_by_year": burned,
        "coverage_by_year": coverage,
        "units": {row["metric_code"]: row["unit"] for row in labels},
        "metric_names": {row["metric_code"]: row["metric_name"] for row in labels},
        "notes": _trend_notes(hotspot, events, burned) + _partial_year_notes(coverage),
    }


# --- tahun parsial -----------------------------------------------------------
#
# Satu baris per tahun: tanggal deteksi pertama dan terakhir yang benar-benar
# tercatat di `point_observations`. Sumber ini dipilih karena satu-satunya yang
# tidak ambigu — `region_facts` punya metrik `hotspot_coverage_pct`, tetapi
# metrik itu ditulis **dua baris per tahun** tanpa pembeda (2020: 68,9 dan 70,8)
# sehingga tidak bisa dipakai sebagai penanda tunggal.
QUERY_YEAR_SPAN = """
select extract(year from o.observed_on)::int as year,
       min(o.observed_on) as first_observed_on,
       max(o.observed_on) as last_observed_on
  from point_observations o
 where o.observed_on is not null
 group by 1
 order by 1
"""

# Query di atas menelusuri 918 ribu baris (1,2 dtk di Aiven, diukur 2026-11-19)
# sedangkan nilainya hanya berubah kalau ETL dijalankan ulang. Cache 15 menit menahan
# biaya itu di setiap permintaan `A1`/`A2`/`A3`.
COVERAGE_TTL_SECONDS = 900
_coverage_cache: tuple[float, dict[int, dict[str, Any]]] | None = None


def _year_coverage(conn: psycopg.Connection) -> dict[int, dict[str, Any]]:
    """Cakupan tiap tahun: tanggal deteksi terakhir dan pangsanya terhadap setahun."""
    global _coverage_cache
    now = time.monotonic()
    if _coverage_cache is not None and now - _coverage_cache[0] < COVERAGE_TTL_SECONDS:
        return _coverage_cache[1]

    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(QUERY_YEAR_SPAN)
        rows = cur.fetchall()

    coverage: dict[int, dict[str, Any]] = {}
    for row in rows:
        year = row["year"]
        first = row["first_observed_on"]
        last = row["last_observed_on"]
        days_in_year = 366 if calendar.isleap(year) else 365
        days_covered = (last - date(year, 1, 1)).days + 1
        coverage[year] = {
            "first_observed_on": first.isoformat(),
            "last_observed_on": last.isoformat(),
            "days_covered": days_covered,
            "days_in_year": days_in_year,
            "coverage_pct": round(days_covered / days_in_year * 100, 1),
            "partial": last < date(year, 12, 31),
        }

    _coverage_cache = (now, coverage)
    return coverage


def _coverage_for(conn: psycopg.Connection, year: int) -> dict[str, Any]:
    """Cakupan satu tahun; tahun yang belum punya baris sama sekali dinyatakan terbuka."""
    return _year_coverage(conn).get(
        year,
        {
            "first_observed_on": None,
            "last_observed_on": None,
            "days_covered": 0,
            "days_in_year": 366 if calendar.isleap(year) else 365,
            "coverage_pct": None,
            "partial": False,
        },
    )


def _partial_year_notes(coverage: dict[int, dict[str, Any]], year: int | None = None) -> list[str]:
    """Sebut tahun yang datanya belum setahun penuh, beserta batas tanggalnya."""
    years = [year] if year is not None else sorted(coverage)
    notes: list[str] = []
    for current in years:
        info = coverage.get(current)
        if not info or not info["partial"]:
            continue
        notes.append(
            f"data {current} baru terukur sampai {info['last_observed_on']} "
            f"({info['days_covered']} dari {info['days_in_year']} hari, "
            f"{str(info['coverage_pct']).replace('.', ',')}% tahun), jadi angkanya "
            "belum bisa dibaca sebagai angka setahun penuh"
        )
    return notes


# --- A2 komposisi wilayah ----------------------------------------------------

# Dua metrik yang boleh dipilih (`SRS-F-51`). Tipe `Literal` membuat FastAPI
# membalas 422 untuk nilai lain tanpa penjagaan tambahan.
CompositionMetric = Literal["hotspot_count", "event_count"]

TOP_N = 10

# Nilai satu wilayah = jumlah seri arsip untuk titik panas (`main` + `fill`),
# `sum()` dipakai karena satu wilayah bisa punya dua baris seri. Jendela
# `sum(...) over ()` memberi total tingkat itu **sebelum** `limit`, jadi pangsa
# persen dihitung dari seluruh wilayah, bukan dari sepuluh baris teratas.
QUERY_COMPOSITION_REGENCY = """
with facts as (
    select f.region_code,
           sum(f.value) as value
      from region_facts f
     where f.metric_code = %(metric)s
       and f.year = %(year)s
       and f.month is null
       and f.confidence is null
       and f.region_code is not null
     group by f.region_code
)
select f.region_code,
       r.region_name,
       r.province_code,
       p.province_name,
       f.value,
       sum(f.value) over () as level_total
  from facts f
  join regions r on r.region_code = f.region_code
  left join provinces p on p.province_code = r.province_code
 order by f.value desc, r.region_name
 limit %(limit)s
"""

QUERY_COMPOSITION_PROVINCE = """
with facts as (
    select f.province_code,
           sum(f.value) as value
      from region_facts f
     where f.metric_code = %(metric)s
       and f.year = %(year)s
       and f.month is null
       and f.confidence is null
       and f.region_code is null
       and f.province_code is not null
     group by f.province_code
)
select f.province_code,
       p.province_name,
       f.value,
       sum(f.value) over () as level_total
  from facts f
  join provinces p on p.province_code = f.province_code
 order by f.value desc, p.province_name
 limit %(limit)s
"""

QUERY_METRIC_LABEL = """
select metric_name, unit
  from metrics
 where metric_code = %(metric)s
"""


def _share(value: float | None, total: float | None) -> float | None:
    """Pangsa persen; pembagi nol berarti `null`, bukan 0 %."""
    if value is None or not total:
        return None
    return round(value / total * 100, 2)


def _province_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        {
            "province_code": row["province_code"],
            "province_name": row["province_name"],
            "value": row["value"],
            "share_pct": _share(row["value"], row["level_total"]),
        }
        for row in rows
    ]


def _regency_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        {
            "region_code": row["region_code"],
            "region_name": row["region_name"],
            "province_name": row["province_name"],
            "value": row["value"],
            "share_pct": _share(row["value"], row["level_total"]),
        }
        for row in rows
    ]


@composition_router.get("/composition")
def composition(
    year: int = Query(..., ge=2020, le=2026, description="Tahun yang dibandingkan"),
    metric: CompositionMetric = Query(
        default="hotspot_count",
        description="Metrik komposisi: hotspot_count atau event_count",
    ),
    conn: psycopg.Connection = Depends(get_connection),
) -> dict[str, Any]:
    """Sepuluh provinsi dan sepuluh kabupaten/kota teratas pada satu tahun (`A2`)."""
    params = {"year": year, "metric": metric, "limit": TOP_N}
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(QUERY_COMPOSITION_REGENCY, params)
        regency_rows = cur.fetchall()
        cur.execute(QUERY_COMPOSITION_PROVINCE, params)
        province_rows = cur.fetchall()
        cur.execute(QUERY_METRIC_LABEL, {"metric": metric})
        label = cur.fetchone() or {}

    coverage = _coverage_for(conn, year)
    notes = [
        "komposisi membandingkan wilayah pada satu tahun; nilainya dihitung dari "
        "seluruh baris fakta tahun itu di tingkat masing-masing",
        (
            "titik panas satu wilayah adalah jumlah seri arsip main + fill; keduanya "
            "seri berbeda (bukan angka yang dihitung dua kali)"
            if metric == "hotspot_count"
            else "kejadian adalah pencatatan kejadian karhutla (BNPB), bukan deteksi satelit"
        ),
        "titik panas dan kejadian memakai alat ukur berbeda dan tidak boleh dijumlahkan",
        "pangsa persen dihitung terhadap total tingkat yang sama pada tahun itu, "
        "bukan terhadap angka nasional seri lain",
    ] + _partial_year_notes({year: coverage}, year)

    return {
        "year": year,
        "metric": metric,
        "metric_name": label.get("metric_name"),
        "unit": label.get("unit"),
        "province": {
            "total": province_rows[0]["level_total"] if province_rows else None,
            "rows": _province_rows(province_rows),
        },
        "regency": {
            "total": regency_rows[0]["level_total"] if regency_rows else None,
            "rows": _regency_rows(regency_rows),
        },
        "coverage": coverage,
        "notes": notes,
    }


# --- A3 peringkat kabupaten/kota ---------------------------------------------

# `hotspot_per_1000_km2` tidak bertahun (satu angka rata-rata 2020–2025 per wilayah),
# jadi nilainya sama untuk semua pilihan tahun — itu dinyatakan di `notes`
# (`SRS-F-55`). Wilayah tanpa baris fakta tetap muncul dengan nilai `null`
# (bukan 0): nol berarti nol deteksi terukur, `null` berarti belum dimuat.
QUERY_RANKING = """
with hotspot as (
    select f.region_code, sum(f.value) as value
      from region_facts f
     where f.metric_code = 'hotspot_count'
       and f.year = %(year)s
       and f.month is null
       and f.confidence is null
       and f.region_code is not null
     group by f.region_code
), events as (
    select f.region_code, sum(f.value) as value
      from region_facts f
     where f.metric_code = 'event_count'
       and f.year = %(year)s
       and f.month is null
       and f.confidence is null
       and f.region_code is not null
     group by f.region_code
), density as (
    select f.region_code, f.value
      from region_facts f
     where f.metric_code = 'hotspot_per_1000_km2'
       and f.year is null
       and f.month is null
       and f.confidence is null
       and f.region_code is not null
)
select r.region_code,
       r.region_name,
       r.region_type,
       r.province_code,
       p.province_name,
       h.value as hotspot_count,
       d.value as hotspot_per_1000_km2,
       e.value as event_count
  from regions r
  left join hotspot h on h.region_code = r.region_code
  left join events e on e.region_code = r.region_code
  left join density d on d.region_code = r.region_code
  left join provinces p on p.province_code = r.province_code
 order by r.region_name
"""


@ranking_router.get("/ranking")
def ranking(
    year: int = Query(..., ge=2020, le=2026, description="Tahun untuk kolom titik panas dan kejadian"),
    conn: psycopg.Connection = Depends(get_connection),
) -> dict[str, Any]:
    """Peringkat seluruh kabupaten/kota (`A3`); pengurutan dilakukan peramban."""
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(QUERY_RANKING, {"year": year})
        rows = cur.fetchall()

    coverage = _coverage_for(conn, year)
    notes = [
        "kepadatan titik panas adalah kepadatan deteksi (titik panas per 1.000 km²), "
        "bukan ukuran kerawanan",
        "kepadatan dihitung dari rata-rata tahun lengkap 2020–2025 sehingga tidak "
        "berubah saat tahun diganti; kolom titik panas dan kejadian mengikuti tahun "
        "yang dipilih",
        "nilai kosong berarti wilayah itu belum punya baris fakta untuk tahun tersebut; "
        "angka 0 berarti nol deteksi yang terukur",
        "pengurutan dan pencarian dilakukan di peramban atas 514 baris yang sama, "
        "bukan oleh server",
    ] + _partial_year_notes({year: coverage}, year)

    return {
        "year": year,
        "count": len(rows),
        "coverage": coverage,
        "regions": [
            {
                "region_code": row["region_code"],
                "region_name": row["region_name"],
                "region_type": row["region_type"],
                "province_code": row["province_code"],
                "province_name": row["province_name"],
                "hotspot_count": row["hotspot_count"],
                "hotspot_per_1000_km2": row["hotspot_per_1000_km2"],
                "event_count": row["event_count"],
            }
            for row in rows
        ],
        "notes": notes,
    }