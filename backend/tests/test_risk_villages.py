"""Uji lapisan kelas kerawanan desa/kelurahan (P4 bagian kedua, `SRS-F-38`/`F-39`).

Yang diperiksa adalah sifat muatan tile dan angka nyata dari basis data hidup:
nama layer di dalam protobuf, kelas `tidak_ada_deteksi` yang tidak boleh disebut
"rendah", pagar zoom, dan daftar provinsi beserta jumlah desanya. Tidak ada
tiruan; kalau basis data mati, uji ini memang gagal.

Properti `has_score` di sini berarti hal yang sama seperti di lapisan
kabupaten/kota (kelas belum ada), dan berbeda dari `has_fact` di lapisan titik
panas (nol deteksi yang terukur).
"""

import psycopg
from fastapi.testclient import TestClient
from psycopg.rows import dict_row

from app.config import database_url
from app.main import app
from app.routers.risk import VILLAGE_MIN_ZOOM
from app.tiles import MEDIA_TYPE_MVT

client = TestClient(app)

# z=9 x=410 y=266 memuat 250 desa Provinsi Jawa Tengah (provinsi terpadat,
# 8.480 desa; diukur 2026-11-17) dan keempat kelas sekaligus.
VILLAGE_PATH = "/tiles/risk/villages/9/410/266.mvt"
VILLAGE_PARAMS = {"province": "33"}
# Tile paling barat laut dunia pada z=9: jauh dari provinsi mana pun di Indonesia.
EMPTY_PATH = "/tiles/risk/villages/9/0/0.mvt"


def test_village_tile_contains_risk_villages_layer() -> None:
    response = client.get(VILLAGE_PATH, params=VILLAGE_PARAMS)

    assert response.status_code == 200
    assert response.headers["content-type"] == MEDIA_TYPE_MVT
    body = response.content
    # 250 poligon desa; ambang di bawah angka terukur 22.313 B.
    assert len(body) > 15_000
    assert b"risk_villages" in body  # nama layer ditulis di dalam MVT
    assert b"village_code" in body
    assert b"village_name" in body
    assert b"risk_class" in body
    assert b"has_score" in body


def test_village_tile_carries_the_no_detection_class() -> None:
    """`tidak_ada_deteksi` harus ikut terkirim apa adanya (`SRS-F-39`).

    Kalau suatu hari ETL mengganti nama kelas ini — atau menulis `rendah` untuk
    desa tanpa deteksi — uji ini gagal dan antarmuka tidak lagi bisa membedakan
    "tidak terdeteksi satelit" dari "kerawanan rendah".
    """
    response = client.get(VILLAGE_PATH, params=VILLAGE_PARAMS)

    assert response.status_code == 200
    assert b"tidak_ada_deteksi" in response.content


def test_village_tile_requires_the_province_parameter() -> None:
    """Lapisan ini dimuat per provinsi (`SRS-F-38`), jadi kodenya wajib."""
    assert client.get(VILLAGE_PATH).status_code == 422


def test_village_tile_rejects_a_malformed_province_code() -> None:
    for province in ("3", "abc", "333"):
        response = client.get(VILLAGE_PATH, params={"province": province})

        assert response.status_code == 422, province


def test_village_tile_rejects_zoom_below_the_floor() -> None:
    """z<8 dijawab 422, bukan 204: permintaan salah alamat, bukan tile kosong.

    Koordinatnya sengaja yang sah pada z=7 (`0..127`) supaya yang diperiksa
    memang batas zoom, bukan penjaga rentang koordinat.
    """
    response = client.get(
        f"/tiles/risk/villages/{VILLAGE_MIN_ZOOM - 1}/100/42.mvt",
        params=VILLAGE_PARAMS,
    )

    assert response.status_code == 422
    assert "di bawah batas" in response.json()["detail"]


def test_village_tile_coordinates_outside_zoom_range_are_rejected() -> None:
    response = client.get("/tiles/risk/villages/9/9999/9999.mvt", params=VILLAGE_PARAMS)

    assert response.status_code == 422
    assert "di luar rentang" in response.json()["detail"]


def test_empty_village_tile_answers_204() -> None:
    response = client.get(EMPTY_PATH, params=VILLAGE_PARAMS)

    assert response.status_code == 204
    assert response.content == b""


def test_province_without_any_village_answers_204() -> None:
    """Kode provinsi yang tidak ada bukan galat tile: hasilnya kosong, `204`."""
    response = client.get(VILLAGE_PATH, params={"province": "99"})

    assert response.status_code == 204


def test_provinces_endpoint_lists_every_province_with_its_bbox() -> None:
    response = client.get("/api/v1/provinces")

    assert response.status_code == 200
    body = response.json()

    assert body["count"] == 38
    assert len(body["provinces"]) == 38
    assert body["min_zoom"] == VILLAGE_MIN_ZOOM

    # Kotak wilayah dipakai antarmuka untuk memperbesar peta; baris `national`
    # (kode `00`) tidak boleh ikut karena geometrinya kosong.
    for province in body["provinces"]:
        assert len(province["bbox"]) == 4
        min_x, min_y, max_x, max_y = province["bbox"]
        assert 94 <= min_x < max_x <= 142, province["province_name"]
        assert -12 <= min_y < max_y <= 7, province["province_name"]
        assert len(province["province_code"]) == 2
        assert province["province_name"]

    assert not any(province["province_code"] == "00" for province in body["provinces"])
    assert body["provinces"][0]["province_name"] == "Aceh"  # urut nama


def test_provinces_endpoint_reports_the_measured_class_counts() -> None:
    body = client.get("/api/v1/provinces").json()

    # Angka 2026-11-17: 83.315 desa berkelas, 43.753 di antaranya tanpa deteksi.
    assert body["class_counts"] == {
        "rendah": 8_881,
        "sedang": 24_293,
        "tinggi": 6_388,
        "tidak_ada_deteksi": 43_753,
    }
    assert sum(body["class_counts"].values()) == 83_315
    assert body["village_total"] == 83_530
    assert body["villages_without_class"] == 215
    # Celah ini harus dinyatakan, bukan disembunyikan: 812 desa belum punya kode
    # kecamatan induk di sumbernya, sehingga tidak masuk lapisan per provinsi.
    assert body["villages_without_province"] == 812


def test_village_class_rows_have_one_row_per_village_and_no_period() -> None:
    """Menegaskan alasan syarat `year`/`month`/`series is null` di join tile.

    Kalau suatu hari ETL menulis kelas desa per tahun, join tanpa syarat itu akan
    menggandakan poligon di dalam satu tile; uji ini gagal lebih dulu.
    """
    with psycopg.connect(database_url(), row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                select count(*) as rows_with_period
                  from village_facts
                 where metric_code = 'risk_class_desa'
                   and (year is not null or month is not null or series is not null)
                """
            )
            rows_with_period = cur.fetchone()["rows_with_period"]
            cur.execute(
                """
                select count(*) as duplicated
                  from (
                    select village_code
                      from village_facts
                     where metric_code = 'risk_class_desa'
                     group by village_code
                    having count(*) > 1
                  ) duplicated_villages
                """
            )
            duplicated = cur.fetchone()["duplicated"]

    assert rows_with_period == 0
    assert duplicated == 0
