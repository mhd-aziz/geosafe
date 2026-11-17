"""P4 — peta kerawanan (skor susunan penelitian) tingkat kabupaten/kota.

Tiga hal yang dijaga berkas ini:

1. **Skor kerawanan bukan angka resmi BNPB.** Skor disusun penelitian ini dari
   dua indikator yang sudah ada di `REGION_FACTS` (jumlah titik panas dan jumlah
   kejadian), memakai peringkat persentil supaya pencilan seperti Merauke tidak
   menghapus 500 wilayah lain. Skema bobotnya tiga — A (dipakai sebagai tampilan
   awal), B, dan C — dan uji sensitivitasnya dihitung ulang setiap permintaan
   dari data, bukan dibaca dari berkas.

2. **IRBI 2025 bukan komponen skema A.** Indeks itu gabungan semua jenis bahaya,
   jadi ia ditampilkan **sejajar** sebagai konteks (`SRS-F-35`); pada skema B dan
   C nilai IRBI ikut masuk 20% justru sebagai uji, bukan sebagai kebenaran.

3. **Skor hanya ada di tingkat kabupaten/kota (`SRS-F-37`)**: tingkat provinsi dan
   nasional tidak punya seluruh indikator, jadi tidak ada tile provinsi di sini.
   Kelas kerawanan desa/kelurahan (`SRS-F-38`) adalah lapisan terpisah: ia bukan
   skor 0–100 melainkan kelas, dan dimuat **per provinsi** pada zoom 8 ke atas,
   karena 83.530 poligon desa tidak masuk akal dikirim sekaligus.
"""

from typing import Any, Literal

import psycopg
from fastapi import APIRouter, Depends, Path, Query, Response
from psycopg.rows import dict_row

from app.db import get_connection
from app.tiles import check_tile_bounds, check_zoom_floor, render_tile

router = APIRouter(tags=["P4 peta kerawanan"])

# Skema yang dipakai sebagai tampilan awal (`SRS-F-33`).
DEFAULT_SCHEME = "a"

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

# Baris skor/kelas kerawanan tidak bertahun dan tidak berseri: pada pemeriksaan
# 2026-11-17 seluruh 3.084 baris metrik `risk_*` punya `year`, `month`, `series`,
# dan `confidence` kosong. Syarat itu diulang di kedua join supaya baris
# bertahun — kalau suatu saat ETL menambahkannya — tidak menggandakan poligon
# di dalam satu tile.
#
# Properti `has_score` sengaja tidak bernama `has_fact` seperti di lapisan titik
# panas: di sana `0` berarti **nol deteksi yang terukur**, di sini `0` berarti
# **skor tidak diketahui**. Dua arti itu tidak boleh tertukar di antarmuka.
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
           %(scheme)s::text as scheme_code,
           case when s.metric_code is null then 0 else 1 end as has_score
      from regions r
      left join region_facts s
        on s.region_code = r.region_code
       and s.metric_code = %(score_metric)s
       and s.year is null
       and s.month is null
       and s.series is null
       and s.confidence is null
      left join region_facts c
        on c.region_code = r.region_code
       and c.metric_code = %(class_metric)s
       and c.year is null
       and c.month is null
       and c.series is null
       and c.confidence is null
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

# Kelas kerawanan desa satu-satunya metrik di `village_facts` yang tidak bertahun
# (83.315 baris, seluruhnya tanpa `year`/`month`/`series`). Baris seperti itu
# ditulis `kelas` oleh ETL, dan desa yang tidak punya baris sama sekali (215 desa)
# tetap ikut dikirim dengan `has_score = 0`.
VILLAGE_CLASS_METRIC = "risk_class_desa"

# Lapisan desa dimuat per provinsi dan baru pada zoom 8 ke atas. Diukur lewat HTTP
# (`:8080`) untuk provinsi terpadat, Jawa Tengah (8.480 desa), 2026-11-17: z=8 enam
# tile total 753 kB dengan tile terbesar 334 kB; z=9 dua puluh tile total 787 kB
# dengan terbesar 146 kB; z=10 delapan puluh tile total 891 kB dengan terbesar
# 47 kB. Di bawah itu seluruh provinsi jatuh ke segelintir tile raksasa.
VILLAGE_MIN_ZOOM = 8

# Properti `has_score` juga dipakai di lapisan kabupaten/kota, dengan arti yang
# sama: `0` = kelasnya belum ada, bukan "nol deteksi" seperti `has_fact` di
# lapisan titik panas (`SRS-F-39` melarang membacanya sebagai kerawanan rendah).
QUERY_VILLAGE_TILE = """
with tile as (
    select st_tileenvelope(%(z)s, %(x)s, %(y)s) as env_3857
),
mvt_rows as (
    select st_asmvtgeom(
               st_transform(v.geom, 3857),
               tile.env_3857,
               4096,
               256,
               true
           ) as geom,
           v.village_code,
           v.village_name,
           v.district_code,
           d.district_name,
           d.region_code,
           r.region_name,
           r.province_code,
           f.value_text as risk_class,
           case when f.metric_code is null then 0 else 1 end as has_score
      from villages v
      join districts d on d.district_code = v.district_code
      join regions r on r.region_code = d.region_code
      left join village_facts f
        on f.village_code = v.village_code
       and f.metric_code = %(class_metric)s
       and f.year is null
       and f.month is null
       and f.series is null
      cross join tile
     where r.province_code = %(province)s
       and v.geom is not null
       and st_intersects(v.geom, st_transform(tile.env_3857, 4326))
)
select st_asmvt(mvt_rows.*, 'risk_villages', 4096, 'geom') as tile
  from mvt_rows
"""

# Daftar provinsi untuk pemilih lapisan desa: kode, nama, dan kotak wilayah.
# Kotak wilayah diambil dari geometri provinsi (bukan dari desa) supaya peta bisa
# diperbesar ke seluruh provinsi sebelum tile diminta. `level = 'province'`
# penting: `provinces` juga memuat satu baris `national` (`00`, INDONESIA) tanpa
# geometri.
#
# Jumlah desa **per provinsi** sengaja tidak diambil di sini: agregatnya menelusuri
# 82.718 desa dan berbiaya 0,689 dtk di Aiven, sementara angka itu hanya keterangan
# tambahan pada pemilih. Angka per kelas dan kedua celah data tetap dikirim.
QUERY_PROVINCES = """
select p.province_code,
       p.province_name,
       array[st_xmin(p.geom), st_ymin(p.geom),
             st_xmax(p.geom), st_ymax(p.geom)] as bbox
  from provinces p
 where p.level = 'province'
 order by p.province_name
"""

QUERY_VILLAGE_CLASS_COUNTS = """
select f.value_text as risk_class, count(*) as village_count
  from village_facts f
 where f.metric_code = %(class_metric)s
   and f.year is null
   and f.month is null
   and f.series is null
 group by f.value_text
 order by f.value_text
"""

# Jumlah desa seluruhnya (83.530), dipakai untuk menyatakan celah apa adanya: desa
# tanpa baris kelas sama sekali (215) tidak boleh terbaca sebagai nol deteksi.
QUERY_VILLAGE_TOTAL = "select count(*) as village_total from villages"

# Desa yang belum punya kode kecamatan induk di sumbernya (812). Desa seperti itu
# tidak bisa dihitung ke provinsi mana pun, jadi lapisan per provinsi tidak
# memuatnya — pencarian wilayah (`C1`) tetap menemukannya. Dihitung lewat
# `not exists` (indeks `districts_district_code_key`) supaya tidak menelusuri
# seluruh pasangan desa-kecamatan seperti agregat per provinsi di atas.
QUERY_VILLAGES_WITHOUT_PROVINCE = """
select count(*) as villages_without_province
  from villages v
 where not exists (
     select 1 from districts d where d.district_code = v.district_code
 )
"""

VILLAGE_NOTES = (
    "kelas kerawanan desa adalah susunan penelitian ini, bukan kelas resmi BNPB "
    "— tidak ada kelas resmi karhutla untuk desa (SRS-F-66)",
    "kelas `tidak_ada_deteksi` berarti tidak ada satu pun deteksi titik panas di "
    "desa itu, dan itu BUKAN kerawanan rendah: nol deteksi bisa berarti tidak "
    "terdeteksi satelit (SRS-F-39)",
    "desa yang sama sekali belum punya baris kelas dikirim dengan properti "
    "`has_score = 0` (lihat `villages_without_class`), jadi angkanya tidak "
    "dibaca sebagai nol deteksi",
    "sebagian desa belum punya kode kecamatan induk di sumbernya, sehingga tidak "
    "masuk lapisan per provinsi (lihat `villages_without_province`); pencarian "
    "wilayah tetap menemukannya",
    "lapisan ini hanya dimuat per provinsi, pada zoom 8 ke atas: 83.530 poligon "
    "desa tidak masuk akal dikirim sekaligus",
    "angka desa/kelurahan bersifat pendukung, bukan unit analisis penelitian ini",
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
        default=DEFAULT_SCHEME,
        description=(
            "Skema bobot skor kerawanan. `a` dipakai sebagai tampilan awal "
            "(titik panas 50% + kejadian 50%)."
        ),
    ),
    z: int = Path(ge=0, le=14),
    x: int = Path(ge=0),
    y: int = Path(ge=0),
    conn: psycopg.Connection = Depends(get_connection),
) -> Response:
    """Tile kabupaten/kota dengan skor dan kelas kerawanan satu skema bobot.

    Tile tanpa poligon dibalas **204 tanpa isi**, sama seperti tile titik panas.
    Hanya tingkat kabupaten/kota (`SRS-F-37`): tidak ada varian provinsi.
    """
    check_tile_bounds(z, x, y)

    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            QUERY_RISK_TILE,
            {
                "z": z,
                "x": x,
                "y": y,
                "scheme": scheme,
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
        "default_scheme": DEFAULT_SCHEME,
        "schemes": list(RISK_SCHEMES),
        "sensitivity": _sensitivity_rows(row),
        "region_total": row["region_total"],
        "regions_without_score": row["regions_without_score"],
        "notes": list(SENSITIVITY_NOTES),
    }


@router.get("/tiles/risk/villages/{z}/{x}/{y:int}.mvt")
def village_risk_tile(
    province: str = Query(
        pattern=r"^\d{2}$",
        description=(
            "Kode provinsi dua digit (`SRS-F-38`: lapisan ini dimuat per provinsi). "
            "Kode yang tidak ada di basis data dijawab `204` seperti tile kosong lain."
        ),
    ),
    z: int = Path(ge=0, le=14),
    x: int = Path(ge=0),
    y: int = Path(ge=0),
    conn: psycopg.Connection = Depends(get_connection),
) -> Response:
    """Tile desa/kelurahan dengan kelas kerawanannya, satu provinsi.

    Dua pagar berlaku sebelum basis data disentuh: koordinat di luar rentang dan
    zoom di bawah `VILLAGE_MIN_ZOOM` sama-sama dijawab `422`, bukan `500` maupun
    `204`. Tile tanpa poligon desa tetap dijawab `204` tanpa isi.
    """
    check_tile_bounds(z, x, y)
    check_zoom_floor(z, VILLAGE_MIN_ZOOM)

    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            QUERY_VILLAGE_TILE,
            {
                "z": z,
                "x": x,
                "y": y,
                "province": province,
                "class_metric": VILLAGE_CLASS_METRIC,
            },
        )
        row = cur.fetchone()

    return render_tile(row["tile"] if row else None)


@router.get("/api/v1/provinces")
def provinces(
    conn: psycopg.Connection = Depends(get_connection),
) -> dict[str, Any]:
    """Daftar 38 provinsi untuk pemilih lapisan desa (`SRS-F-38`).

    Kotak wilayah (`bbox`) ikut dikirim supaya antarmuka bisa memperbesar peta ke
    seluruh provinsi **sebelum** tile diminta — lapisan desa tidak masuk akal
    ditarik pada zoom nasional.

    Ikut dikirim: sebaran kelas kerawanan desa seluruh Indonesia dan dua celah
    datanya (desa tanpa kelas, desa tanpa kecamatan induk), karena angka itulah
    yang dibaca di legenda dan catatan lapisan. Jumlah desa per provinsi tidak
    diambil: biayanya 0,689 dtk di Aiven demi keterangan tambahan saja.

    Tidak ada endpoint daftar provinsi lain di API ini, dan yang ini tidak
    menggantikan pencarian wilayah (`C1`): ia hanya menyediakan kode, nama, kotak,
    dan sebaran kelasnya.
    """
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(QUERY_PROVINCES)
        province_rows = cur.fetchall()
        cur.execute(QUERY_VILLAGE_CLASS_COUNTS, {"class_metric": VILLAGE_CLASS_METRIC})
        class_rows = cur.fetchall()
        cur.execute(QUERY_VILLAGE_TOTAL)
        total_row = cur.fetchone() or {"village_total": 0}
        cur.execute(QUERY_VILLAGES_WITHOUT_PROVINCE)
        missing_row = cur.fetchone() or {"villages_without_province": 0}

    village_total = total_row["village_total"]
    class_counts = {row["risk_class"]: row["village_count"] for row in class_rows}

    return {
        "count": len(province_rows),
        "min_zoom": VILLAGE_MIN_ZOOM,
        "provinces": [
            {
                "province_code": row["province_code"],
                "province_name": row["province_name"],
                "bbox": [float(value) for value in row["bbox"]],
            }
            for row in province_rows
        ],
        "class_counts": class_counts,
        "village_total": village_total,
        "villages_without_class": village_total - sum(class_counts.values()),
        "villages_without_province": missing_row["villages_without_province"],
        "notes": list(VILLAGE_NOTES),
    }