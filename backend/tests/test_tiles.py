"""Uji endpoint tile MVT (P1) terhadap basis data hidup.

Tidak memakai pustaka pengurai MVT: yang diperiksa adalah kode balasan, jenis
media, ukuran muatan, dan nama layer yang tertulis di dalam protobuf.
"""

import psycopg
from fastapi.testclient import TestClient
from psycopg.rows import dict_row

from app.config import database_url
from app.main import app
from app.routers.maps import MEDIA_TYPE_MVT

client = TestClient(app)

# z=0, x=0, y=0 = satu tile yang menutupi seluruh dunia, jadi seluruh 514
# poligon kabupaten/kota masuk.
WORLD_TILE = "/tiles/regions/0/0/0.mvt"
# z=1, x=0, y=1 = separuh barat dan selatan bumi: tidak memuat Indonesia.
OCEAN_TILE = "/tiles/regions/1/0/1.mvt"


def test_world_tile_contains_regions_layer() -> None:
    response = client.get(WORLD_TILE, params={"year": 2020})

    assert response.status_code == 200
    assert response.headers["content-type"] == MEDIA_TYPE_MVT
    body = response.content
    assert len(body) > 10_000
    assert b"regions" in body  # nama layer ditulis di dalam MVT


def test_empty_tile_answers_204() -> None:
    response = client.get(OCEAN_TILE, params={"year": 2020})

    assert response.status_code == 204
    assert response.content == b""


def test_tile_carries_has_fact_property() -> None:
    """Wilayah tanpa baris fakta harus tetap terkirim, ditandai `has_fact`."""
    response = client.get(WORLD_TILE, params={"year": 2020})

    assert response.status_code == 200
    body = response.content
    assert b"has_fact" in body
    # Sebelum perbaikan, tile 2020 hanya 47.657 B karena 39 wilayah hilang.
    assert len(body) > 47_657


def test_database_holds_regions_without_fact_rows() -> None:
    """Menegaskan alasan LEFT JOIN: sebagian wilayah tidak punya baris tahun itu.

    Kalau suatu hari ETL menulis baris bernilai nol, uji ini akan gagal dan
    keputusan `has_fact` perlu ditinjau ulang — itu memang tujuannya.
    """
    with psycopg.connect(database_url(), row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute("select count(*) as region_count from regions")
            region_count = cur.fetchone()["region_count"]
            cur.execute(
                """
                select count(*) as fact_rows, count(distinct region_code) as regions
                  from region_facts
                 where metric_code = 'hotspot_count' and year = 2020
                   and month is null and confidence is null
                """
            )
            fact_rows = cur.fetchone()

    assert region_count == 514
    assert fact_rows["regions"] < region_count  # ada wilayah tanpa baris
    assert fact_rows["fact_rows"] > fact_rows["regions"]  # sebagian wilayah punya main + fill


def test_year_outside_range_is_rejected() -> None:
    assert client.get(WORLD_TILE, params={"year": 2019}).status_code == 422
    assert client.get(WORLD_TILE, params={"year": 2027}).status_code == 422
