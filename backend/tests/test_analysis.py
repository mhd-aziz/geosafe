"""Uji tren nasional dua seri (A1) terhadap basis data hidup.

Angka yang diperiksa diambil dari basis data apa adanya setelah data dibangun
ulang 2026-11-19: titik panas puncak 2023 (253.345 deteksi seri main), kejadian
puncak 2023 (2.153 kejadian), dan tabel tahunan yang **tidak lagi memuat** seri
nrt (NRT hanya dipakai fitur terkini, 621.100 baris dipisah).
"""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

TREND = "/api/v1/analysis/national_trend"


def _trend() -> dict:
    response = client.get(TREND)
    assert response.status_code == 200, response.text
    return response.json()


def test_trend_covers_both_series_for_every_year_in_range() -> None:
    body = _trend()

    hotspot_years = {row["year"] for row in body["hotspot_by_year"]}
    event_years = {row["year"] for row in body["event_by_year"]}
    assert hotspot_years == {2020, 2021, 2022, 2023, 2024, 2025, 2026}
    assert event_years == {2020, 2021, 2022, 2023, 2024, 2025, 2026}
    assert body["scope"] == "national"
    assert body["years"] == [2020, 2021, 2022, 2023, 2024, 2025, 2026]


def test_trend_carries_real_2023_peak_numbers() -> None:
    body = _trend()

    hotspot_2023 = next(row for row in body["hotspot_by_year"] if row["year"] == 2023)
    events_2023 = next(row for row in body["event_by_year"] if row["year"] == 2023)

    assert hotspot_2023["series"]["main"] == 253_345
    assert hotspot_2023["archive_total"] == 253_345 + 2_877
    assert events_2023["event_count"] == 2_153
    assert body["units"]["hotspot_count"] == "titik"
    assert body["units"]["event_count"] == "kejadian"


def test_annual_series_carries_no_nrt_rows() -> None:
    """NRT tidak masuk tabel tahunan: 2026 = arsip main + fill saja."""
    body = _trend()

    row_2026 = next(row for row in body["hotspot_by_year"] if row["year"] == 2026)
    assert row_2026["series"] == {"main": 54_084, "fill": 7_093}
    assert row_2026["archive_total"] == 54_084 + 7_093
    assert row_2026["nrt"] is None
    assert all(row["nrt"] is None for row in body["hotspot_by_year"])

    notes = " ".join(body["notes"])
    assert "tidak memuat seri nrt" in notes
    assert "tidak boleh dijumlahkan dengan angka arsip" in notes


def test_burned_area_stops_at_2025_and_is_labelled_context() -> None:
    body = _trend()

    burned_years = [row["year"] for row in body["burned_area_by_year"]]
    assert burned_years == [2020, 2021, 2022, 2023, 2024, 2025]
    assert body["burned_area_by_year"][3]["burned_area_ha"] > 1_000_000  # 2023 GWIS

    notes = " ".join(body["notes"])
    assert "hanya konteks, bukan seri ketiga" in notes
    assert "hanya tersedia sampai 2025" in notes
    assert "2026 tidak tersedia" in notes


def test_notes_state_both_series_use_different_instruments() -> None:
    notes = " ".join(_trend()["notes"])

    assert "alat ukur berbeda" in notes
    assert "tidak boleh dijumlahkan" in notes
    assert "sumbu terpisah" in notes


def test_notes_state_fill_series_covers_only_some_years() -> None:
    body = _trend()

    notes = " ".join(body["notes"])
    assert "archive_total = seri main + seri fill" in notes
    assert "hanya punya baris untuk tahun 2022, 2023, 2024, 2025, 2026" in notes

    row_2020 = next(row for row in body["hotspot_by_year"] if row["year"] == 2020)
    assert "fill" not in row_2020["series"]  # 2020 hanya seri main
    assert row_2020["archive_total"] == 91_401
