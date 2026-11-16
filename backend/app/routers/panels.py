"""W2 — panel kabupaten/kota.

Satu permintaan = satu query agregat untuk satu wilayah, sesuai `ARSITEKTUR.md`
bagian 4 ("titik akhir berbentuk satu per tingkat wilayah"). Nilai dibaca apa
adanya dari `REGION_FACTS`:

- hanya baris **tahunan** (`month is null`) dan **total** (`confidence is null`);
- kolom `series` dikirim apa adanya — `main` (arsip), `fill` (hari bolong yang
  ditambal), `nrt` (pemrosesan berbeda) **tidak** digabung diam-diam;
- kelas risiko disimpan pada kolom `value_text`, bukan `value`.

Wilayah yang tidak ada dibalas 404, bukan objek kosong.
"""

from typing import Any

import psycopg
from fastapi import APIRouter, Depends, HTTPException, Path

from app.db import get_connection

router = APIRouter(prefix="/api/v1", tags=["W2 panel kabupaten/kota"])

# Rentang data proyek; dipakai untuk mengenali tahun yang tidak ada barisnya.
EXPECTED_YEARS: tuple[int, ...] = (2020, 2021, 2022, 2023, 2024, 2025, 2026)

# Metrik yang benar-benar ditampilkan panel. Menambah fitur = menambah daftar ini.
METRICS: tuple[str, ...] = (
    "hotspot_count",
    "hotspot_per_1000_km2",
    "event_count",
    "emergency_sk_karhutla",
    "emergency_sk_mentions",
    "irbi_score",
    "irbi_class",
    "irbi_karhutla_score",
    "irbi_karhutla_class",
)

QUERY_PANEL = """
select r.region_code,
       r.region_name,
       r.region_type,
       r.province_code,
       p.province_name,
       r.area_km2,
       f.metric_code,
       f.year,
       f.series,
       f.value,
       f.value_text
  from regions r
  left join provinces p on p.province_code = r.province_code
  left join region_facts f
    on f.region_code = r.region_code
   and f.month is null
   and f.confidence is null
   and f.metric_code = any(%(metrics)s)
 where r.region_code = %(code)s
 order by f.metric_code, f.year, f.series
"""


def _rows_per_metric(rows: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    """Kelompokkan baris fakta menurut `metric_code`."""
    grouped: dict[str, list[dict[str, Any]]] = {}
    for row in rows:
        if row["metric_code"] is None:  # wilayah ada, fakta belum dimuat
            continue
        grouped.setdefault(row["metric_code"], []).append(row)
    return grouped


def _single_value(rows: list[dict[str, Any]], metric: str) -> dict[str, Any] | None:
    """Ambil satu baris fakta (dipakai untuk metrik tanpa tahun)."""
    for row in rows:
        if row["metric_code"] == metric:
            return {"value": row["value"], "value_text": row["value_text"]}
    return None


def _panel_notes(
    grouped: dict[str, list[dict[str, Any]]],
    hotspot_years: set[int],
    event_years: set[int],
) -> list[str]:
    """Batasan data yang harus ikut tampil, bukan disembunyikan."""
    notes = [
        "korban dan kerusakan tidak tersedia untuk karhutla; indikator utamanya "
        "jumlah titik panas dan jumlah kejadian",
        "luas terbakar hanya tersedia tingkat nasional, bukan per kabupaten/kota",
    ]
    if any(row["series"] == "nrt" for row in grouped.get("hotspot_count", [])):
        notes.insert(
            0,
            "seri nrt tahun 2026 berasal dari pemrosesan berbeda dan tidak "
            "sebanding dengan seri arsip (main)",
        )
    if "hotspot_per_1000_km2" in grouped:
        notes.append(
            "hotspot_per_1000_km2 mencakup seluruh seri tanpa tahun tertentu; "
            "angkanya diambil dari tabel siap pakai"
        )

    missing_series = []
    if set(EXPECTED_YEARS) - hotspot_years:
        missing_series.append("titik panas")
    if set(EXPECTED_YEARS) - event_years:
        missing_series.append("kejadian")
    if missing_series:
        notes.append(
            f"seri {' dan '.join(missing_series)} tidak memuat baris untuk semua tahun "
            "2020–2026 karena ETL tidak menulis baris bernilai nol; tahun yang "
            "hilang berarti nol deteksi titik panas atau nol kejadian tercatat"
        )
    return notes


@router.get("/panel/kabupaten_kota/{region_code}")
def panel_kabupaten_kota(
    region_code: str = Path(min_length=4, max_length=4, description="Kode BPS kabupaten/kota"),
    conn: psycopg.Connection = Depends(get_connection),
) -> dict[str, Any]:
    """Panel satu kabupaten/kota: titik panas, kejadian, status darurat 2025, IRBI."""
    with conn.cursor() as cur:
        cur.execute(QUERY_PANEL, {"code": region_code, "metrics": list(METRICS)})
        rows = cur.fetchall()

    if not rows:
        raise HTTPException(status_code=404, detail=f"wilayah {region_code} tidak ada")

    head = rows[0]
    grouped = _rows_per_metric(rows)

    hotspot = [
        {"year": row["year"], "series": row["series"], "hotspot_count": row["value"]}
        for row in grouped.get("hotspot_count", [])
    ]
    events = [
        {"year": row["year"], "event_count": row["value"]}
        for row in grouped.get("event_count", [])
    ]
    irbi_karhutla = [
        {"year": row["year"], "irbi_karhutla_score": row["value"], "irbi_karhutla_class": row["value_text"]}
        for row in grouped.get("irbi_karhutla_score", [])
    ]

    def status_2025(metric: str) -> Any:
        for row in grouped.get(metric, []):
            if row["year"] == 2025:
                return row["value"]
        return None

    irbi_2025 = _single_value(grouped.get("irbi_score", []), "irbi_score") or {}
    irbi_class_2025 = _single_value(grouped.get("irbi_class", []), "irbi_class") or {}
    density = _single_value(grouped.get("hotspot_per_1000_km2", []), "hotspot_per_1000_km2") or {}

    return {
        "region": {
            "region_code": head["region_code"],
            "region_name": head["region_name"],
            "region_type": head["region_type"],
            "province_code": head["province_code"],
            "province_name": head["province_name"],
            "area_km2": head["area_km2"],
        },
        "hotspot_by_year": hotspot,
        "event_by_year": events,
        "emergency_2025": {
            "emergency_sk_karhutla_2025": status_2025("emergency_sk_karhutla"),
            "emergency_sk_mentions_2025": status_2025("emergency_sk_mentions"),
        },
        "irbi_2025": {
            "irbi_score": irbi_2025.get("value"),
            "irbi_class": irbi_class_2025.get("value_text"),
        },
        "irbi_karhutla_by_year": irbi_karhutla,
        "hotspot_per_1000_km2": density.get("value"),
        "notes": _panel_notes(
            grouped,
            {row["year"] for row in hotspot if row["year"]},
            {row["year"] for row in events if row["year"]},
        ),
    }
