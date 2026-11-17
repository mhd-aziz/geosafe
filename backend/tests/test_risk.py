"""Uji endpoint kerawanan (P4) terhadap basis data hidup.

Yang diperiksa adalah angka nyata yang keluar dari data: ukuran tile, sifat
properti di dalam protobuf, dan hasil uji sensitivitas yang dihitung ulang dari
baris `risk_score_*`/`risk_class_*`. Tidak ada tiruan; kalau basis data mati, uji
ini memang gagal.
"""

import psycopg
from fastapi.testclient import TestClient
from psycopg.rows import dict_row

from app.config import database_url
from app.main import app
from app.tiles import MEDIA_TYPE_MVT

client = TestClient(app)

WORLD_TILE = "/tiles/risk/0/0/0.mvt"
OCEAN_TILE = "/tiles/risk/1/0/1.mvt"


def test_world_risk_tile_contains_risk_layer() -> None:
    response = client.get(WORLD_TILE)

    assert response.status_code == 200
    assert response.headers["content-type"] == MEDIA_TYPE_MVT
    body = response.content
    # 514 poligon + dua properti nilai: jauh di atas tile provinsi (12,8 kB).
    assert len(body) > 50_000
    assert b"risk" in body  # nama layer ditulis di dalam MVT
    assert b"risk_score" in body
    assert b"risk_class" in body
    assert b"has_fact" in body


def test_empty_risk_tile_answers_204() -> None:
    response = client.get(OCEAN_TILE)

    assert response.status_code == 204
    assert response.content == b""


def test_scheme_choices_answer_different_tiles() -> None:
    default = client.get(WORLD_TILE)
    scheme_b = client.get(WORLD_TILE, params={"scheme": "b"})
    scheme_c = client.get(WORLD_TILE, params={"scheme": "c"})

    assert default.status_code == scheme_b.status_code == scheme_c.status_code == 200
    assert default.content != scheme_b.content
    assert default.content != scheme_c.content


def test_unknown_scheme_is_rejected() -> None:
    assert client.get(WORLD_TILE, params={"scheme": "x"}).status_code == 422


def test_default_scheme_excludes_irbi() -> None:
    """`SRS-F-33`/`SRS-F-35`: skema awal = titik panas + kejadian, IRBI sejajar."""
    body = client.get("/api/v1/risk/schemes").json()

    assert body["default_scheme"] == "a"
    scheme_a = body["schemes"][0]
    assert scheme_a["scheme_code"] == "a"
    assert scheme_a["weights"] == {"hotspot": 0.5, "event": 0.5, "irbi": None}
    assert scheme_a["includes_irbi"] is False
    assert [row["includes_irbi"] for row in body["schemes"]] == [False, True, True]


def test_schemes_state_the_data_limits() -> None:
    """`SRS-F-36`/`SRS-F-37`: skor susunan penelitian, hanya tingkat kabupaten/kota."""
    notes = " ".join(client.get("/api/v1/risk/schemes").json()["notes"])

    assert "bukan angka resmi BNPB" in notes
    assert "kabupaten/kota" in notes
    assert "IRBI" in notes


def test_sensitivity_is_computed_from_live_rows() -> None:
    body = client.get("/api/v1/risk/schemes").json()

    assert body["region_total"] == 514
    assert body["regions_without_score"] == 0
    rows = {f"{row['scheme_a']}{row['scheme_b']}": row for row in body["sensitivity"]}
    assert set(rows) == {"ab", "ac", "bc"}
    # Angka uji sensitivitas dari `risk_sensitivity.csv`: 106 / 75 / 53 wilayah
    # berpindah kelas. Kalau bobot atau kelas di basis data berubah, uji ini gagal
    # dan dokumen keputusan perlu ditinjau ulang — itu memang tujuannya.
    assert rows["ab"]["regions_class_changed"] == 106
    assert rows["ac"]["regions_class_changed"] == 75
    assert rows["bc"]["regions_class_changed"] == 53
    assert abs(rows["ab"]["spearman_rho"] - 0.9252) < 0.001
    assert abs(rows["ac"]["spearman_rho"] - 0.9590) < 0.001
    assert abs(rows["bc"]["spearman_rho"] - 0.9823) < 0.001
    assert rows["ab"]["pct_class_changed"] == 20.6


def test_database_holds_risk_rows_for_every_region() -> None:
    """Skor dan kelas harus berpasangan untuk seluruh 514 wilayah."""
    with psycopg.connect(database_url(), row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                select metric_code, count(*) as n, count(distinct region_code) as regions
                  from region_facts
                 where metric_code in ('risk_score_a', 'risk_class_a')
                 group by metric_code
                 order by metric_code
                """
            )
            rows = {row["metric_code"]: row for row in cur.fetchall()}
            cur.execute(
                """
                select value_text as risk_class, count(*) as n
                  from region_facts
                 where metric_code = 'risk_class_a'
                 group by value_text
                 order by n desc
                """
            )
            classes = {row["risk_class"]: row["n"] for row in cur.fetchall()}

    assert rows["risk_score_a"]["n"] == rows["risk_class_a"]["n"] == 514
    assert rows["risk_score_a"]["regions"] == 514
    # Sebaran kelas skema A yang tercatat di dokumen data siap pakai.
    assert classes == {"sedang": 239, "tinggi": 138, "rendah": 137}