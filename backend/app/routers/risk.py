"""P4 — peta kerawanan (skor susunan penelitian) tingkat kabupaten/kota.

Dua hal yang dijaga berkas ini:

1. **Skor kerawanan bukan angka resmi BNPB.** Skor disusun penelitian ini dari
   dua indikator yang sudah ada di `REGION_FACTS` (jumlah titik panas dan jumlah
   kejadian), memakai peringkat persentil supaya pencilan seperti Merauke tidak
   menghapus 500 wilayah lain. Skema bobotnya tiga — A (dipakai sebagai tampilan
   awal), B, dan C — dan uji sensitivitasnya dihitung ulang setiap permintaan
   dari data, bukan dibaca dari berkas.

2. **IRBI 2025 bukan komponen skema A.** Indeks itu gabungan semua jenis bahaya,
   jadi ia ditampilkan **sejajar** sebagai konteks (`SRS-F-35`); pada skema B dan
   C nilai IRBI ikut masuk 20% justru sebagai uji, bukan sebagai kebenaran.

Skor hanya ada di tingkat kabupaten/kota (`SRS-F-37`): tingkat provinsi dan
nasional tidak punya seluruh indikator, jadi tidak ada tile provinsi di sini.
"""

from typing import Any, Literal

import psycopg
from fastapi import APIRouter, Depends, Path, Query
from psycopg.rows import dict_row

from app.db import get_connection
from app.tiles import render_tile

router = APIRouter(tags=["P4 peta kerawanan"])

# Bobot skema = definisi metode (`SRS-F-33`/`SRS-F-34`), bukan angka hasil ukur,
# jadi tinggal di kode. Angka yang **diukur** (skor, kelas, korelasi, jumlah
# berpindah kelas) seluruhnya dibaca dari PostgreSQL saat permintaan.
RISK_SCHEMES: tuple[dict[str, Any], ...] = (
    {
        "scheme_code": "a",
        "scheme_name": "titik panas 50% + kejadian 50%",
        "weights": {"hotspot": 0.5, "event": 0.5, "irbi": None},
        "includes_irbi": False,
        "is_default": True,
    },
    {
        "scheme_code": "b",
        "scheme_name": "titik panas 50% + kejadian 30% + IRBI 20%",
        "weights": {"hotspot": 0.5, "event": 0.3, "irbi": 0.2},
        "includes_irbi": True,
        "is_default": False,
    },
    {
        "scheme_code": "c",
        "scheme_name": "titik panas 40% + kejadian 40% + IRBI 20%",
        "weights": {"hotspot": 0.4, "event": 0.4, "irbi": 0.2},
        "includes_irbi": True,
        "is_default": False,
    },
)

SCORE_METRIC = {"a": "risk_score_a", "b": "risk_score_b", "c": "risk_score_c"}
CLASS_METRIC = {"a": "risk_class_a", "b": "risk_class_b", "c": "risk_class_c"}
RISK_METRICS = tuple(SCORE_METRIC.values()) + tuple(CLASS_METRIC.values())

# Baris skor/kelas kerawanan tidak bertahun (`year` kosong): keduanya ringkasan
# satu periode, bukan seri tahunan. Wilayah tanpa baris tetap dikirim dengan
# `has_fact = 0`, aturan yang sama dengan tile jumlah titik panas.
QUERY_RISK_TILE = """
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
           s.value as risk_score,
           c.value_text as risk_class,
           case when s.metric_code is null then 0 else 1 end as has_fact
      from regions r
      left join region_facts s
        on s.region_code = r.region_code
       and s.metric_code = %(score_metric)s
      left join region_facts c
        on c.region_code = r.region_code
       and c.metric_code = %(class_metric)s
      cross join tile
     where r.geom is not null
       and st_intersects(r.geom, st_transform(tile.env_3857, 4326))
)
select st_asmvt(mvt_rows.*, 'risk', 4096, 'geom') as tile
  from mvt_rows
"""

# Uji sensitivitas dihitung dari baris yang sama dengan yang digambar peta.
# Korelasi peringkat Spearman = korelasi Pearson atas peringkat; `rank()`
# memberi peringkat terendah untuk nilai kembar, sedangkan `bangun_kerawanan.py`
# memakai peringkat rata-rata — itulah sebabnya angka A–B di sini bisa berbeda
# pada digit keempat (0,9252 vs 0,9251). Jumlah wilayah berpindah kelas tidak
# terpengaruh, karena ia membandingkan teks kelas apa adanya.
QUERY_SENSITIVITY = """
with scores as (
    select r.region_code,
           max(f.value)      filter (where f.metric_code = 'risk_score_a') as score_a,
           max(f.value)      filter (where f.metric_code = 'risk_score_b') as score_b,
           max(f.value)      filter (where f.metric_code = 'risk_score_c') as score_c,
           max(f.value_text) filter (where f.metric_code = 'risk_class_a') as class_a,
           max(f.value_text) filter (where f.metric_code = 'risk_class_b') as class_b,
           max(f.value_text) filter (where f.metric_code = 'risk_class_c') as class_c
      from regions r
      left join region_facts f
        on f.region_code = r.region_code
       and f.metric_code = any(%(metrics)s)
     group by r.region_code
),
ranked as (
    select class_a, class_b, class_c, score_a, score_b, score_c,
           rank() over (order by score_a) as rank_a,
           rank() over (order by score_b) as rank_b,
           rank() over (order by score_c) as rank_c
      from scores
)
select count(*) as region_total,
       count(*) filter (where score_a is null) as regions_without_score,
       round(corr(rank_a, rank_b)::numeric, 4) as rho_ab,
       round(corr(rank_a, rank_c)::numeric, 4) as rho_ac,
       round(corr(rank_b, rank_c)::numeric, 4) as rho_bc,
       count(*) filter (where class_a is distinct from class_b) as changed_ab,
       count(*) filter (where class_a is distinct from class_c) as changed_ac,
       count(*) filter (where class_b is distinct from class_c) as changed_bc
  from ranked
"""

SENSITIVITY_NOTES = (
    "skor kerawanan adalah susunan penelitian ini, bukan angka resmi BNPB",
    "skor kerawanan hanya dihitung untuk kabupaten/kota (514 wilayah), karena "
    "hanya tingkat itu yang punya seluruh indikator",
    "IRBI 2025 ditampilkan sejajar sebagai konteks dan tidak masuk skema a; pada "
    "skema b dan c nilai IRBI ikut 20% — persis yang diuji uji sensitivitas",
    "korelasi peringkat dan jumlah wilayah berpindah kelas dihitung ulang saat "
    "permintaan dari baris risk_score/risk_class; nilai kembar memakai peringkat "
    "terendah, sehingga dapat berbeda pada digit keempat dari risk_sensitivity.csv",
)


def _sensitivity_rows(row: dict[str, Any]) -> list[dict[str, Any]]:
    """Susun tiga pasangan skema dari satu baris agregat."""
    total = row["region_total"]
    pairs = (
        ("a", "b", row["rho_ab"], row["changed_ab"]),
        ("a", "c", row["rho_ac"], row["changed_ac"]),
        ("b", "c", row["rho_bc"], row["changed_bc"]),
    )
    return [
        {
            "scheme_a": scheme_a,
            "scheme_b": scheme_b,
            "spearman_rho": float(rho) if rho is not None else None,
            "regions_class_changed": changed,
            "pct_class_changed": round(changed / total * 100, 1) if total else None,
            "region_total": total,
        }
        for scheme_a, scheme_b, rho, changed in pairs
    ]


@router.get("/tiles/risk/{z}/{x}/{y:int}.mvt")
def risk_tile(
    scheme: Literal["a", "b", "c"] = Query(
        default="a",
        description=(
            "Skema bobot skor kerawanan. `a` dipakai sebagai tampilan awal "
            "(titik panas 50% + kejadian 50%)."
        ),
    ),
    z: int = Path(ge=0, le=14),
    x: int = Path(ge=0),
    y: int = Path(ge=0),
    conn: psycopg.Connection = Depends(get_connection),
) -> Any:
    """Tile kabupaten/kota dengan skor dan kelas kerawanan satu skema bobot.

    Tile tanpa poligon dibalas **204 tanpa isi**, sama seperti tile titik panas.
    Hanya tingkat kabupaten/kota (`SRS-F-37`): tidak ada varian provinsi.
    """
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            QUERY_RISK_TILE,
            {
                "z": z,
                "x": x,
                "y": y,
                "score_metric": SCORE_METRIC[scheme],
                "class_metric": CLASS_METRIC[scheme],
            },
        )
        row = cur.fetchone()

    return render_tile(row["tile"] if row else None)


@router.get("/api/v1/risk/schemes")
def risk_schemes(
    conn: psycopg.Connection = Depends(get_connection),
) -> dict[str, Any]:
    """Tiga skema bobot, uji sensitivitasnya, dan batasan yang harus dibaca.

    Bentuk balasan mengikuti kontrak tile di atas: `scheme_code` sama dengan
    parameter `scheme`, sehingga antarmuka bisa memakai satu nilai untuk keduanya.
    """
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(QUERY_SENSITIVITY, {"metrics": list(RISK_METRICS)})
        row = cur.fetchone()

    return {
        "default_scheme": "a",
        "schemes": list(RISK_SCHEMES),
        "sensitivity": _sensitivity_rows(row),
        "region_total": row["region_total"],
        "regions_without_score": row["regions_without_score"],
        "notes": list(SENSITIVITY_NOTES),
    }