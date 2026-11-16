"""Uji tren nasional dua seri (A1) terhadap basis data hidup.

Angka yang diperiksa diambil dari basis data apa adanya: titik panas puncak 2023
(253.127 deteksi), kejadian puncak 2023 (2.153 kejadian), dan seri nrt 2026
(600.323) yang tidak sebanding dengan arsip.
"""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

TREND = "/api/v1/analysis/national_trend"


def _trend() -> dict:
    response = client.get(TREND)
    assert response.status_code == 200, response.text
    return response.json()


def test_tren_memuat_dua_seri_untuk_seluruh_rentang_tahun() -> None:
    body = _trend()

    tahun_titik_panas = {row["year"] for row in body["hotspot_by_year"]}
    tahun_kejadian = {row["year"] for row in body["event_by_year"]}
    assert tahun_titik_panas == {2020, 2021, 2022, 2023, 2024, 2025, 2026}
    assert tahun_kejadian == {2020, 2021, 2022, 2023, 2024, 2025, 2026}
    assert body["scope"] == "national"
    assert body["years"] == [2020, 2021, 2022, 2023, 2024, 2025, 2026]


def test_tren_memuat_angka_nyata_puncak_2023() -> None:
    body = _trend()

    titik_panas_2023 = next(row for row in body["hotspot_by_year"] if row["year"] == 2023)
    kejadian_2023 = next(row for row in body["event_by_year"] if row["year"] == 2023)

    assert titik_panas_2023["series"]["main"] == 253_127
    assert titik_panas_2023["archive_total"] == 253_127 + 2_876
    assert kejadian_2023["event_count"] == 2_153
    assert body["units"]["hotspot_count"] == "titik"
    assert body["units"]["event_count"] == "kejadian"


def test_seri_nrt_dikirim_terpisah_dan_tidak_masuk_total_arsip() -> None:
    body = _trend()

    baris_2026 = next(row for row in body["hotspot_by_year"] if row["year"] == 2026)
    assert baris_2026["series"]["nrt"] == 600_323
    assert baris_2026["archive_total"] == 54_065 + 7_092  # nrt tidak ikut dihitung
    assert baris_2026["nrt"] == 600_323

    baris_2025 = next(row for row in body["hotspot_by_year"] if row["year"] == 2025)
    assert baris_2025["nrt"] is None  # tahun tanpa baris nrt dikosongkan, bukan nol


def test_luas_terbakar_hanya_sampai_2025_dan_disebut_sebagai_konteks() -> None:
    body = _trend()

    tahun = [row["year"] for row in body["burned_area_by_year"]]
    assert tahun == [2020, 2021, 2022, 2023, 2024, 2025]
    assert body["burned_area_by_year"][3]["burned_area_ha"] > 1_000_000  # 2023 GWIS

    catatan = " ".join(body["notes"])
    assert "hanya konteks, bukan seri ketiga" in catatan
    assert "hanya tersedia sampai 2025" in catatan
    assert "2026 tidak tersedia" in catatan


def test_menyatakan_dua_seri_memakai_alat_ukur_berbeda() -> None:
    catatan = " ".join(_trend()["notes"])

    assert "alat ukur berbeda" in catatan
    assert "tidak boleh dijumlahkan" in catatan
    assert "sumbu terpisah" in catatan


def test_menyatakan_seri_fill_hanya_punya_sebagian_tahun() -> None:
    body = _trend()

    catatan = " ".join(body["notes"])
    assert "archive_total = seri main + seri fill" in catatan
    assert "hanya punya baris untuk tahun 2022, 2023, 2024, 2025, 2026" in catatan

    baris_2020 = next(row for row in body["hotspot_by_year"] if row["year"] == 2020)
    assert "fill" not in baris_2020["series"]  # 2020 hanya seri main
    assert baris_2020["archive_total"] == 91_348