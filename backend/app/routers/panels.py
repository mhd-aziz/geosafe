"""W2 — panel kabupaten/kota; W4 — panel desa/kelurahan.

Satu permintaan = satu query agregat untuk satu wilayah, sesuai `ARSITEKTUR.md`
bagian 4 ("titik akhir berbentuk satu per tingkat wilayah"). Nilai dibaca apa
adanya dari `REGION_FACTS` (W2) atau `VILLAGE_FACTS` (W4):

- hanya baris **tahunan** (`month is null`) dan **total** (`confidence is null`);
- kolom `series` dikirim apa adanya — `main` (arsip), `fill` (hari bolong yang
  ditambal), `nrt` (pemrosesan berbeda) **tidak** digabung diam-diam;
- kelas risiko disimpan pada kolom `value_text`, bukan `value`.

`VILLAGE_FACTS` juga memuat baris **bulanan** untuk metrik yang sama (mis. desa
6271012003 tahun 2023 punya baris bulan 8, 9, 10, 11 di samping baris tahunan
128) — tanpa `month is null`, satu tahun akan tampil berkali-kali.

Wilayah yang tidak ada dibalas 404, bukan objek kosong.
"""

from typing import Any, cast

import psycopg
from fastapi import APIRouter, Depends, HTTPException, Path

from app.db import get_connection

# Skema bobot kerawanan milik `P4`; panel tidak mendefinisikan ulang namanya,
# supaya label di panel dan di peta tidak bisa berbeda.
from app.routers.risk import CLASS_METRIC, DEFAULT_SCHEME, SCORE_METRIC

router = APIRouter(prefix="/api/v1", tags=["W2 panel kabupaten/kota"])
# `W4` memakai berkas yang sama karena query dan bentuk balasannya sekeluarga
# dengan `W2`, tetapi tag-nya dipisah supaya `/docs` tetap menunjuk kode fiturnya.
village_router = APIRouter(prefix="/api/v1", tags=["W4 panel desa/kelurahan"])

# Rentang data proyek; dipakai untuk mengenali tahun yang tidak ada barisnya.
EXPECTED_YEARS: tuple[int, ...] = (2020, 2021, 2022, 2023, 2024, 2025, 2026)

# Metrik yang benar-benar ditampilkan panel. Menambah fitur = menambah daftar ini.
# Skor/kelas kerawanan (`risk_*`) tidak bertahun dan tidak berseri — sama seperti
# di `app/routers/risk.py`, barisnya dikunci tanpa `year`/`month`/`series`.
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
) + tuple(SCORE_METRIC.values()) + tuple(CLASS_METRIC.values())

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
            "hotspot_per_1000_km2 adalah kepadatan deteksi, bukan kerawanan: satu "
            "angka rata-rata tahun lengkap 2020–2025 tanpa seri nrt. Kepadatan 2026 "
            "tidak ikut karena tahun itu baru 198 hari terukur"
        )

    missing_series = []
    if set(EXPECTED_YEARS) - hotspot_years:
        missing_series.append("titik panas")
    if set(EXPECTED_YEARS) - event_years:
        missing_series.append("kejadian")
    if missing_series:
        notes.append(
            f"seri {' dan '.join(missing_series)} tidak memuat baris untuk semua tahun "
            "2020–2026; angka 0 berarti nol deteksi terukur, sedangkan tahun tanpa "
            "baris berarti angkanya belum dimuat"
        )
    if any(metric in grouped for metric in SCORE_METRIC.values()):
        notes.append(
            "skor kerawanan adalah susunan penelitian ini, bukan angka resmi BNPB; "
            "skema a (titik panas 50% + kejadian 50%) dipakai sebagai tampilan awal, "
            "sedangkan skema b dan c ikut memasukkan IRBI 20% sebagai uji sensitivitas"
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

    # Tiga skema dikirim sekaligus: panel menyebut skema mana yang dipakai peta
    # (`default_scheme`) dan dua lainnya sebagai pembanding uji sensitivitas.
    # Nama medan sama persis dengan `metric_code` di basis data.
    risk: dict[str, Any] = {"default_scheme": DEFAULT_SCHEME}
    for metric in SCORE_METRIC.values():
        risk[metric] = (_single_value(grouped.get(metric, []), metric) or {}).get("value")
    for metric in CLASS_METRIC.values():
        risk[metric] = (_single_value(grouped.get(metric, []), metric) or {}).get("value_text")

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
        "risk": risk,
        "notes": _panel_notes(
            grouped,
            {row["year"] for row in hotspot if row["year"]},
            {row["year"] for row in events if row["year"]},
        ),
    }


# Metrik `W4`. Tiga di antaranya bertahun dan berseries; dua sisanya
# (`hotspot_per_1000_km2`, `risk_class_desa`) tidak bertahun sama sekali — sama
# seperti `risk_*` di tingkat kabupaten/kota.
VILLAGE_METRICS: tuple[str, ...] = (
    "hotspot_count",
    "event_count",
    "hotspot_per_1000_km2",
    "risk_class_desa",
)

# `VILLAGE_FACTS` memuat baris bulanan **dan** tahunan untuk metrik yang sama,
# jadi `month is null` wajib: tanpa itu satu tahun muncul beberapa kali dan
# angkanya terbaca lebih besar daripada seharusnya. Tidak ada kolom `confidence`
# di tabel ini (keputusan ETL: kelas keyakinan agregat hanya sampai tingkat
# kabupaten/kota), sehingga tidak ada syarat tambahan di sini.
QUERY_VILLAGE_PANEL = """
select v.village_code,
       v.village_name,
       v.area_km2,
       d.district_code,
       d.district_name,
       r.region_code,
       r.region_name,
       p.province_code,
       p.province_name,
       f.metric_code,
       f.year,
       f.series,
       f.value,
       f.value_text
  from villages v
  left join districts d on d.district_code = v.district_code
  left join regions r on r.region_code = d.region_code
  left join provinces p on p.province_code = r.province_code
  left join village_facts f
    on f.village_code = v.village_code
   and f.month is null
   and f.metric_code = any(%(metrics)s)
 where v.village_code = %(code)s
 order by f.metric_code, f.year, f.series
"""

# Angka cakupan yang disebut di `notes`, diukur 2026-11-19: 2.181 dari 83.530
# desa punya baris kejadian, dan kelas kerawanan desa hanya tersusun untuk 83.315
# desa. Dua celah itu disebut apa adanya, bukan ditampilkan sebagai nol.
VILLAGES_WITH_EVENTS = 2_181
VILLAGES_TOTAL = 83_530


def _village_notes(grouped: dict[str, list[dict[str, Any]]]) -> list[str]:
    """Batasan data `W4`; `SRS-F-66` mewajibkan status kelas kerawanan desa disebut."""
    hotspot_years = {row["year"] for row in grouped.get("hotspot_count", []) if row["year"]}
    event_years = {row["year"] for row in grouped.get("event_count", []) if row["year"]}

    # Pemisah ribuan gaya Indonesia: `2.181`, bukan `2,181`.
    coverage = (
        f"jumlah kejadian per desa hanya tersedia untuk {VILLAGES_WITH_EVENTS:,} dari "
        f"{VILLAGES_TOTAL:,} desa"
    ).replace(",", ".")

    notes = [
        "kelas kerawanan desa adalah susunan penelitian ini, bukan kelas resmi BNPB, "
        "dan dihitung dari titik panas serta luas wilayah desa",
        coverage + "; desa tanpa baris berarti angkanya belum dimuat, bukan berarti nol kejadian",
        "angka 0 pada titik panas berarti nol deteksi yang terukur untuk tahun itu",
    ]
    if any(row["series"] == "fill" for row in grouped.get("hotspot_count", [])):
        notes.append(
            "seri fill adalah hari bolong pada seri arsip yang ditambal, bukan hasil "
            "pemrosesan baru; seri main dan fill tidak dijumlahkan"
        )
    missing = sorted(set(EXPECTED_YEARS) - hotspot_years)
    if missing:
        notes.append(
            "titik panas belum punya baris untuk tahun "
            + ", ".join(str(year) for year in missing)
        )
    if not event_years:
        notes.append("desa ini tidak punya baris kejadian sama sekali pada 2020–2026")
    return notes


@village_router.get("/panel/desa/{village_code}")
def panel_desa(
    village_code: str = Path(
        min_length=10,
        max_length=10,
        description="Kode BPS desa/kelurahan (10 digit)",
    ),
    conn: psycopg.Connection = Depends(get_connection),
) -> dict[str, Any]:
    """Panel satu desa/kelurahan: identitas, titik panas, kejadian, kelas kerawanan (`W4`)."""
    with conn.cursor() as cur:
        cur.execute(QUERY_VILLAGE_PANEL, {"code": village_code, "metrics": list(VILLAGE_METRICS)})
        rows = cast(list[dict[str, Any]], cur.fetchall())

    if not rows:
        raise HTTPException(status_code=404, detail=f"desa {village_code} tidak ada")

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
    density = _single_value(grouped.get("hotspot_per_1000_km2", []), "hotspot_per_1000_km2") or {}
    risk_class = _single_value(grouped.get("risk_class_desa", []), "risk_class_desa") or {}

    return {
        "village": {
            "village_code": head["village_code"],
            "village_name": head["village_name"],
            "district_code": head["district_code"],
            "district_name": head["district_name"],
            "region_code": head["region_code"],
            "region_name": head["region_name"],
            "province_code": head["province_code"],
            "province_name": head["province_name"],
            "area_km2": head["area_km2"],
        },
        "hotspot_by_year": hotspot,
        "event_by_year": events,
        "risk_class_desa": risk_class.get("value_text"),
        "hotspot_per_1000_km2": density.get("value"),
        "notes": _village_notes(grouped),
    }
