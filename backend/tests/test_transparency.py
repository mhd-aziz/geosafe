"""Uji halaman Sumber & Batas Data (T1) terhadap basis data dan berkas nyata.

Dua hal yang diuji di sini sengaja tidak nyaman: jumlah titik panas yang **tidak**
masuk poligon wilayah mana pun (`SRS-F-76`), dan unduhan tabel siap pakai
(`SRS-F-75`) — berkasnya tinggal di folder data di luar repo aplikasi.
"""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

COVERAGE = "/api/v1/point_coverage"
DOWNLOADS = "/api/v1/downloads"


def test_sumber_data_memuat_tujuh_dataset() -> None:
    body = client.get("/api/v1/sources").json()

    assert body["count"] == 7
    kode = {row["source_code"] for row in body["sources"]}
    assert kode == {
        "BNPB-EVENT",
        "BNPB-REKAP",
        "BNPB-STATUS",
        "FIRMS",
        "GEOPORTAL-BNPB",
        "GWIS",
        "INARISK-IRBI",
    }


def test_penempatan_titik_2023_dipisah_masuk_dan_luar_poligon() -> None:
    body = client.get(COVERAGE, params={"year": 2023}).json()

    # 270.179 seri main + 3.112 seri fill = 273.291 titik
    assert body["totals"]["point_count"] == 273_291
    assert body["totals"]["placed_count"] == 255_520
    assert body["totals"]["outside_count"] == 17_771
    assert body["totals"]["outside_share_percent"] == 6.5

    assert [row["year"] for row in body["by_year"]] == [2023]
    seri = body["by_year"][0]["series"]
    assert seri["main"] == 270_179
    assert seri["fill"] == 3_112


def test_penempatan_titik_seluruh_rentang_menyebut_luar_poligon() -> None:
    body = client.get(COVERAGE).json()

    assert [row["year"] for row in body["by_year"]] == [2020, 2021, 2022, 2023, 2024, 2025, 2026]
    assert body["totals"]["point_count"] == 1_452_263
    assert body["totals"]["outside_count"] == 106_800
    assert body["totals"]["outside_share_percent"] == 7.35

    catatan = " ".join(body["notes"])
    assert "di luar poligon" in catatan
    assert "geometri" in catatan  # alasan selisih angka disebutkan


def test_daftar_unduhan_memuat_tabel_siap_pakai() -> None:
    body = client.get(DOWNLOADS).json()

    assert body["count"] >= 25
    nama = {row["file_name"] for row in body["files"]}
    assert "panel_kabupaten_kota.csv" in nama
    assert all(int(row["size_bytes"]) > 0 for row in body["files"])
    assert body["notes"] == []


def test_unduh_berkas_tabel_siap_pakai_berisi_csv_nyata() -> None:
    response = client.get(f"{DOWNLOADS}/panel_kabupaten_kota.csv")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    baris_pertama = response.text.splitlines()[0]
    assert baris_pertama.startswith("bps_code,name,type,province")
    assert len(response.content) > 10_000


def test_unduh_berkas_tidak_dikenal_balas_404() -> None:
    response = client.get(f"{DOWNLOADS}/tidak-ada.csv")

    assert response.status_code == 404
    assert "tidak ada di folder unduhan" in response.json()["detail"]


def test_unduh_tidak_bisa_keluar_dari_folder_unduhan() -> None:
    response = client.get("/api/v1/downloads/..%2F..%2F..%2Fetc%2Fpasswd")

    assert response.status_code == 404
