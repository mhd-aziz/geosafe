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

    # Setelah unduh ulang 2026-11-18: 288.756 seri main + 3.215 seri fill.
    assert body["totals"]["point_count"] == 291_971
    assert body["totals"]["placed_count"] == 255_748
    assert body["totals"]["outside_count"] == 36_223
    assert body["totals"]["outside_share_percent"] == 12.41

    assert [row["year"] for row in body["by_year"]] == [2023]
    seri = body["by_year"][0]["series"]
    assert seri["main"] == 288_756
    assert seri["fill"] == 3_215


def test_penempatan_titik_seluruh_rentang_menyebut_luar_poligon() -> None:
    body = client.get(COVERAGE).json()

    assert [row["year"] for row in body["by_year"]] == [2020, 2021, 2022, 2023, 2024, 2025, 2026]
    # 918.319 titik arsip; NRT 621.100 tidak dimuat ke `point_observations`.
    assert body["totals"]["point_count"] == 918_319
    assert body["totals"]["outside_count"] == 172_047
    assert body["totals"]["outside_share_percent"] == 18.73

    catatan = " ".join(body["notes"])
    assert "di luar poligon" in catatan
    assert "geometri" in catatan  # alasan selisih angka disebutkan


def test_penempatan_memisahkan_seri_arsip_dari_seri_nrt() -> None:
    """Tabel titik panas hanya memuat arsip; NRT hidup di endpoint terkini."""
    body = client.get(COVERAGE).json()

    assert set(body["totals"]["series"]) == {"main", "fill"}
    assert (
        body["totals"]["series"]["main"] + body["totals"]["series"]["fill"]
        == body["totals"]["point_count"]
    )

    catatan = " ".join(body["notes"])
    assert "hanya memuat seri arsip" in catatan
    assert "nrt" in catatan
    assert "tidak boleh dijumlahkan" in catatan


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
