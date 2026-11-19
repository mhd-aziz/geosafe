"""Uji endpoint tile MVT (P1) terhadap basis data hidup.

Tidak memakai pustaka pengurai MVT: yang diperiksa adalah kode balasan, jenis
media, ukuran muatan, dan nama layer yang tertulis di dalam protobuf.
"""

import psycopg
from fastapi.testclient import TestClient
from psycopg.rows import dict_row

from app.config import database_url
from app.main import app
from app.tiles import MEDIA_TYPE_MVT

client = TestClient(app)

# z=0, x=0, y=0 = satu tile yang menutupi seluruh dunia, jadi seluruh 514
# poligon kabupaten/kota masuk.
WORLD_TILE = "/tiles/regions/0/0/0.mvt"
# z=1, x=0, y=1 = separuh barat dan selatan bumi: tidak memuat Indonesia.
OCEAN_TILE = "/tiles/regions/1/0/1.mvt"
# Tingkat provinsi (saklar tampilan `SRS-F-13`): 38 provinsi pada satu tile dunia.
WORLD_PROVINCE_TILE = "/tiles/provinces/0/0/0.mvt"
OCEAN_PROVINCE_TILE = "/tiles/provinces/1/0/1.mvt"


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


def test_tile_coordinates_outside_zoom_range_are_rejected() -> None:
    """Koordinat salah dijawab 422 oleh penjaga bersama di `app/tiles.py`.

    Sebelum penjaga itu ada, koordinat seperti ini menjalar ke `ST_TileEnvelope`
    dan pengguna menerima `500` untuk permintaan yang sekadar salah alamat.
    """
    for path in ("/tiles/regions/0/5/5.mvt", "/tiles/provinces/0/5/5.mvt"):
        response = client.get(path, params={"year": 2020})

        assert response.status_code == 422, path
        assert "di luar rentang" in response.json()["detail"]


def test_tile_carries_has_fact_property() -> None:
    """Wilayah tanpa baris fakta harus tetap terkirim, ditandai `has_fact`."""
    response = client.get(WORLD_TILE, params={"year": 2020})

    assert response.status_code == 200
    body = response.content
    assert b"has_fact" in body
    # Sebelum perbaikan, tile 2020 hanya 47.657 B karena 39 wilayah hilang.
    assert len(body) > 47_657


def test_database_writes_explicit_zero_rows() -> None:
    """Nol ditulis eksplisit, bukan diwakili "tidak ada baris".

    Sejak data dibangun ulang 2026-11-19 ETL menulis baris bernilai 0 untuk
    wilayah yang tidak punya deteksi. Kalau suatu hari ETL berhenti menulis nol,
    uji ini gagal dan arti properti `has_fact` perlu ditinjau ulang.
    """
    with psycopg.connect(database_url(), row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute("select count(*) as region_count from regions")
            region_count = cur.fetchone()["region_count"]
            cur.execute(
                """
                select count(*) as fact_rows,
                       count(distinct region_code) as regions,
                       count(*) filter (where value = 0) as zero_rows
                  from region_facts
                 where metric_code = 'hotspot_count' and year = 2020
                   and month is null and confidence is null and series = 'main'
                   and region_code is not null
                """
            )
            fact_rows = cur.fetchone()

    assert region_count == 514
    assert fact_rows["regions"] == region_count  # semua wilayah punya baris
    assert fact_rows["zero_rows"] == 39  # 2020: 39 wilayah nol deteksi terukur
    assert fact_rows["fact_rows"] == region_count


def test_year_outside_range_is_rejected() -> None:
    assert client.get(WORLD_TILE, params={"year": 2019}).status_code == 422
    assert client.get(WORLD_TILE, params={"year": 2027}).status_code == 422


def test_province_tile_contains_provinces_layer() -> None:
    response = client.get(WORLD_PROVINCE_TILE, params={"year": 2020})

    assert response.status_code == 200
    assert response.headers["content-type"] == MEDIA_TYPE_MVT
    body = response.content
    assert len(body) > 5_000  # 38 poligon provinsi
    assert b"provinces" in body


def test_province_tile_reuses_province_fact_rows() -> None:
    """Tile provinsi membaca baris tingkat provinsi, bukan menjumlahkan kabupaten/kota.

    Kalau suatu hari ETL berhenti menulis baris tingkat provinsi, uji ini gagal
    dan keputusan memakai baris itu perlu ditinjau ulang.
    """
    with psycopg.connect(database_url(), row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                select count(*) as province_rows, count(distinct province_code) as provinces
                  from region_facts
                 where region_code is null and province_code is not null
                  and metric_code = 'hotspot_count' and series = 'main' and year = 2020
                  and month is null and confidence is null
                """
            )
            rows = cur.fetchone()
            cur.execute("select count(*) as n from provinces where level = 'province'")
            province_count = cur.fetchone()["n"]

    assert rows["province_rows"] == 38
    assert rows["provinces"] == province_count == 38


def test_empty_province_tile_answers_204() -> None:
    assert client.get(OCEAN_PROVINCE_TILE, params={"year": 2020}).status_code == 204


def test_penyaring_confidence_mengubah_isi_tile_kabupaten_kota() -> None:
    semua = client.get(WORLD_TILE, params={"year": 2020})
    kelas_h = client.get(WORLD_TILE, params={"year": 2020, "confidence": "h"})

    assert semua.status_code == 200
    assert kelas_h.status_code == 200
    assert kelas_h.headers["content-type"] == MEDIA_TYPE_MVT
    # kelas h hanya sebagian kecil deteksi 2020 (2.186 dari 91.348), jadi tile-nya
    # harus lebih kecil daripada tile tanpa penyaring
    assert len(kelas_h.content) < len(semua.content)


def test_kelas_confidence_kabupaten_kota_menjumlah_ke_angka_tanpa_penyaring() -> None:
    """Kelas `h` + `n` + `l` harus sama dengan angka tanpa penyaring setiap tahun.

    Kalau suatu hari ETL berhenti memecah baris per kelas, atau salah satu kelas
    tidak lagi ditulis, uji ini gagal dan penyaring `confidence` perlu ditinjau.
    """
    with psycopg.connect(database_url(), row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                select year,
                       sum(value) filter (where confidence is null) as tanpa_kelas,
                       sum(value) filter (where confidence = 'h') as kelas_h,
                       sum(value) filter (where confidence = 'n') as kelas_n,
                       sum(value) filter (where confidence = 'l') as kelas_l
                  from region_facts
                 where metric_code = 'hotspot_count' and series = 'main'
                   and month is null and region_code is not null
                 group by year
                 order by year
                """
            )
            rows = cur.fetchall()

    assert len(rows) == 7
    for row in rows:
        assert row["kelas_h"] + row["kelas_n"] + row["kelas_l"] == row["tanpa_kelas"]
    assert rows[0]["tanpa_kelas"] == 91_401  # 2020


def test_penyaring_confidence_ditolak_di_tingkat_provinsi() -> None:
    """Tingkat provinsi tidak punya baris per kelas; permintaan harus gagal jelas."""
    response = client.get(WORLD_PROVINCE_TILE, params={"year": 2020, "confidence": "h"})

    assert response.status_code == 422
    assert "kabupaten/kota" in response.json()["detail"]


def test_kelas_confidence_tak_dikenal_ditolak_validasi() -> None:
    response = client.get(WORLD_TILE, params={"year": 2020, "confidence": "x"})

    assert response.status_code == 422
