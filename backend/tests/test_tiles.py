"""Uji endpoint tile MVT (P1) terhadap basis data hidup.

Tidak memakai pustaka pengurai MVT: yang diperiksa adalah kode balasan, jenis
media, ukuran muatan, dan nama layer yang tertulis di dalam protobuf.
"""

from fastapi.testclient import TestClient

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


def test_tahun_di_luar_rentang_ditolak() -> None:
    assert client.get(TILE_DUNIA, params={"year": 2019}).status_code == 422
    assert client.get(TILE_DUNIA, params={"year": 2027}).status_code == 422
