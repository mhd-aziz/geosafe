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


# --- penanda tahun parsial ---------------------------------------------------
#
# Diturunkan dari `point_observations` (tanggal deteksi terakhir), bukan dari
# metadata sumber: sampai 2026-11-19 titik panas 2026 hanya terukur sampai
# 31 Juli 2026 = 212 dari 365 hari.

COMPOSITION = "/api/v1/analysis/composition"
RANKING = "/api/v1/analysis/ranking"


def test_trend_marks_the_partial_year_with_measured_dates() -> None:
    body = _trend()

    partial_2026 = body["coverage_by_year"]["2026"]
    assert partial_2026["last_observed_on"] == "2026-07-31"
    assert partial_2026["days_covered"] == 212
    assert partial_2026["coverage_pct"] == 58.1
    assert partial_2026["partial"] is True

    # Tahun yang sudah lewat 31 Desember bukan tahun parsial.
    assert body["coverage_by_year"]["2025"]["partial"] is False
    assert body["coverage_by_year"]["2023"]["days_covered"] == 365

    assert "data 2026 baru terukur sampai 2026-07-31" in " ".join(body["notes"])


# --- A2 komposisi wilayah ----------------------------------------------------


def test_composition_ranks_ten_regions_per_level_for_2023() -> None:
    body = client.get(COMPOSITION, params={"year": 2023, "metric": "hotspot_count"}).json()

    assert len(body["province"]["rows"]) == 10
    assert len(body["regency"]["rows"]) == 10
    # Kedua tingkat memakai total yang sama: jumlah kabupaten/kota = jumlah provinsi.
    assert body["province"]["total"] == 256_222
    assert body["regency"]["total"] == 256_222

    assert body["province"]["rows"][0]["province_name"] == "Kalimantan Tengah"
    assert body["province"]["rows"][0]["value"] == 33_437
    assert body["regency"]["rows"][0]["region_name"] == "Merauke"
    assert body["regency"]["rows"][0]["value"] == 22_474
    assert body["regency"]["rows"][0]["province_name"] == "Papua Selatan"


def test_composition_share_is_computed_against_the_whole_level() -> None:
    """Pangsa dihitung dari seluruh wilayah, bukan dari sepuluh baris teratas."""
    body = client.get(COMPOSITION, params={"year": 2023, "metric": "hotspot_count"}).json()

    merauke = body["regency"]["rows"][0]
    assert merauke["share_pct"] == round(22_474 / 256_222 * 100, 2)
    assert sum(row["share_pct"] for row in body["regency"]["rows"]) < 100


def test_composition_switches_to_event_count() -> None:
    body = client.get(COMPOSITION, params={"year": 2023, "metric": "event_count"}).json()

    assert body["metric"] == "event_count"
    assert body["unit"] == "kejadian"
    assert body["regency"]["total"] == 2_153
    assert body["regency"]["rows"][0]["region_name"] == "Kota Banjarbaru"
    assert body["regency"]["rows"][0]["value"] == 79
    assert "bukan deteksi satelit" in " ".join(body["notes"])


def test_composition_states_the_partial_year_it_reports() -> None:
    body = client.get(COMPOSITION, params={"year": 2026}).json()

    assert body["coverage"]["partial"] is True
    assert "terukur sampai 2026-07-31" in " ".join(body["notes"])


def test_composition_rejects_unknown_year_and_metric() -> None:
    assert client.get(COMPOSITION, params={"year": 2019}).status_code == 422
    assert client.get(COMPOSITION, params={"year": 2023, "metric": "irbi_score"}).status_code == 422


# --- A3 peringkat kabupaten/kota ---------------------------------------------


def _ranking(year: int = 2023) -> dict:
    response = client.get(RANKING, params={"year": year})
    assert response.status_code == 200, response.text
    return response.json()


def test_ranking_carries_every_regency_once() -> None:
    body = _ranking()

    assert body["count"] == 514
    assert len(body["regions"]) == 514
    codes = [row["region_code"] for row in body["regions"]]
    assert len(set(codes)) == 514


def test_ranking_carries_the_three_sort_keys_for_one_regency() -> None:
    body = _ranking(2023)
    merauke = next(row for row in body["regions"] if row["region_code"] == "9301")

    assert merauke["region_name"] == "Merauke"
    assert merauke["province_name"] == "Papua Selatan"
    assert merauke["hotspot_count"] == 22_474
    # Kepadatan tidak bertahun: satu angka rata-rata 2020–2025 per wilayah.
    assert merauke["hotspot_per_1000_km2"] == 128.03
    # Merauke tidak punya baris kejadian 2023: null, bukan 0.
    assert merauke["event_count"] is None


def test_ranking_states_density_is_detection_not_susceptibility() -> None:
    notes = " ".join(_ranking(2023)["notes"])

    assert "kepadatan deteksi" in notes
    assert "bukan ukuran kerawanan" in notes
    assert "tidak berubah saat tahun diganti" in notes
    assert "angka 0 berarti nol deteksi yang terukur" in notes


def test_ranking_marks_a_partial_year_and_rejects_unknown_year() -> None:
    body = _ranking(2026)
    assert body["coverage"]["partial"] is True
    assert "terukur sampai 2026-07-31" in " ".join(body["notes"])

    assert client.get(RANKING, params={"year": 2030}).status_code == 422
