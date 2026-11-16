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
TILE_DUNIA = "/tiles/regions/0/0/0.mvt"
# z=1, x=0, y=1 = separuh barat dan selatan bumi: tidak memuat Indonesia.
TILE_LAUT = "/tiles/regions/1/0/1.mvt"


def test_tile_dunia_berisi_layer_regions() -> None:
    response = client.get(TILE_DUNIA, params={"year": 2020})

    assert response.status_code == 200
    assert response.headers["content-type"] == MEDIA_TYPE_MVT
    body = response.content
    assert len(body) > 10_000
    assert b"regions" in body  # nama layer ditulis di dalam MVT


def test_tile_kosong_balas_204() -> None:
    response = client.get(TILE_LAUT, params={"year": 2020})

    assert response.status_code == 204
    assert response.content == b""


def test_tile_memuat_properti_penanda_baris_fakta() -> None:
    """Wilayah tanpa baris fakta harus tetap terkirim, ditandai `has_fact`."""
    response = client.get(TILE_DUNIA, params={"year": 2020})

    assert response.status_code == 200
    body = response.content
    assert b"has_fact" in body
    # Sebelum perbaikan, tile 2020 hanya 47.657 B karena 39 wilayah hilang.
    assert len(body) > 47_657


def test_basis_data_memang_punya_wilayah_tanpa_baris_fakta() -> None:
    """Menegaskan alasan LEFT JOIN: sebagian wilayah tidak punya baris tahun itu.

    Kalau suatu hari ETL menulis baris bernilai nol, uji ini akan gagal dan
    keputusan `has_fact` perlu ditinjau ulang — itu memang tujuannya.
    """
    with psycopg.connect(database_url(), row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute("select count(*) as n from regions")
            jumlah_wilayah = cur.fetchone()["n"]
            cur.execute(
                """
                select count(*) as baris, count(distinct region_code) as wilayah
                  from region_facts
                 where metric_code = 'hotspot_count' and year = 2020
                   and month is null and confidence is null
                """
            )
            baris = cur.fetchone()

    assert jumlah_wilayah == 514
    assert baris["wilayah"] < jumlah_wilayah  # ada wilayah tanpa baris
    assert baris["baris"] > baris["wilayah"]  # sebagian wilayah punya main + fill


def test_tahun_di_luar_rentang_ditolak() -> None:
    assert client.get(TILE_DUNIA, params={"year": 2019}).status_code == 422
    assert client.get(TILE_DUNIA, params={"year": 2027}).status_code == 422
