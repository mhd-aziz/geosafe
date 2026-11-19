"""Uji panel kabupaten/kota (W2) terhadap basis data hidup.

Wilayah uji: Merauke (kode 9301). Provinsinya **Papua Selatan** — pemekaran
2022, jadi bukan "Papua". Merauke juga sengaja dipakai karena kejadian
karhutlanya hanya tercatat pada 2026, sehingga perilaku "tahun tanpa baris
fakta" ikut teruji.
"""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

MERAUKE = "/api/v1/panel/kabupaten_kota/9301"


def test_panel_carries_region_identity_and_hotspot_series() -> None:
    response = client.get(MERAUKE)

    assert response.status_code == 200
    body = response.json()

    assert body["region"]["region_name"] == "Merauke"
    assert body["region"]["province_name"] == "Papua Selatan"
    assert body["region"]["area_km2"] > 40_000

    years = {row["year"] for row in body["hotspot_by_year"]}
    assert years == {2020, 2021, 2022, 2023, 2024, 2025, 2026}
    # seri dikirim apa adanya: 2026 hanya seri arsip (main + fill). NRT dipisah
    # dari tabel tahunan sejak data dibangun ulang 2026-11-19.
    series_2026 = {row["series"] for row in body["hotspot_by_year"] if row["year"] == 2026}
    assert series_2026 == {"main", "fill"}
    assert all(row["series"] != "nrt" for row in body["hotspot_by_year"])


def test_panel_carries_events_emergency_status_and_irbi() -> None:
    body = client.get(MERAUKE).json()

    event_years = {row["year"] for row in body["event_by_year"]}
    assert event_years <= set(range(2020, 2027))
    assert 2026 in event_years  # satu-satunya tahun yang tercatat untuk Merauke

    assert set(body["emergency_2025"]) == {
        "emergency_sk_karhutla_2025",
        "emergency_sk_mentions_2025",
    }
    assert body["irbi_2025"]["irbi_class"] == "Sedang"
    assert len(body["irbi_karhutla_by_year"]) == 6
    assert body["hotspot_per_1000_km2"] is not None


def test_panel_carries_risk_scores_for_every_scheme() -> None:
    """Skor kerawanan masuk panel `W2`; ketiga skema dikirim, `a` jadi acuan."""
    risk = client.get(MERAUKE).json()["risk"]

    assert risk["default_scheme"] == "a"
    for scheme in ("a", "b", "c"):
        assert 0 < risk[f"risk_score_{scheme}"] <= 100
        assert risk[f"risk_class_{scheme}"] in {"tinggi", "sedang", "rendah"}


def test_panel_states_data_limits() -> None:
    notes = " ".join(client.get(MERAUKE).json()["notes"])

    assert "korban dan kerusakan" in notes
    # kepadatan: satu rata-rata tahun lengkap, tanpa NRT, bukan ukuran kerawanan
    assert "rata-rata tahun lengkap 2020–2025" in notes
    assert "tanpa seri nrt" in notes
    assert "nol deteksi terukur" in notes  # nol eksplisit sejak data dibangun ulang
    assert "bukan angka resmi BNPB" in notes  # skor kerawanan susunan penelitian


def test_unknown_region_answers_404() -> None:
    response = client.get("/api/v1/panel/kabupaten_kota/9999")

    assert response.status_code == 404
    assert "9999" in response.json()["detail"]


# --- W4 panel desa/kelurahan -------------------------------------------------
#
# Desa uji: Bukit Tunggal (6271012003, Kecamatan Jekan Raya, Kota Palangkaraya).
# Dipilih karena datanya lengkap dan tidak rata: titik panas tujuh tahun (2022,
# 2024, 2025 nol terukur; 2023 = 128), kejadian enam tahun (2025 tidak ada
# barisnya), dan tabel `village_facts` juga memuat baris **bulanan** untuk desa
# ini (2023: bulan 8, 9, 10, 11) sehingga penyaring `month is null` ikut teruji.

VILLAGE = "/api/v1/panel/desa/6271012003"


def test_village_panel_carries_identity_and_area() -> None:
    response = client.get(VILLAGE)

    assert response.status_code == 200
    village = response.json()["village"]

    assert village["village_code"] == "6271012003"
    assert village["village_name"] == "Bukit Tunggal"
    assert village["district_name"] == "Jekan Raya"
    assert village["region_name"] == "Kota Palangkaraya"
    assert village["province_name"] == "Kalimantan Tengah"
    assert 270 < village["area_km2"] < 280


def test_village_panel_returns_one_row_per_year_not_the_monthly_rows() -> None:
    hotspot = client.get(VILLAGE).json()["hotspot_by_year"]

    # Baris bulanan 2023 (5, 37, 85, 1) tidak boleh ikut: yang dikirim hanya
    # baris tahunan 128.
    tahun_2023 = [row for row in hotspot if row["year"] == 2023]
    assert len(tahun_2023) == 1
    assert tahun_2023[0]["hotspot_count"] == 128

    assert {row["year"] for row in hotspot} == set(range(2020, 2027))
    assert {row["series"] for row in hotspot} == {"main"}
    nilai = {row["year"]: row["hotspot_count"] for row in hotspot}
    assert nilai[2022] == 0  # nol terukur, bukan "tidak ada baris"
    assert nilai[2026] == 21


def test_village_panel_carries_events_where_they_exist() -> None:
    events = client.get(VILLAGE).json()["event_by_year"]

    assert [row["year"] for row in events] == [2020, 2021, 2022, 2023, 2024, 2026]
    assert {row["year"]: row["event_count"] for row in events}[2026] == 5


def test_village_panel_carries_class_density_and_limits() -> None:
    body = client.get(VILLAGE).json()

    assert body["risk_class_desa"] == "tinggi"
    assert body["hotspot_per_1000_km2"] is not None

    notes = " ".join(body["notes"])
    # `SRS-F-66`: kelas kerawanan desa wajib dinyatakan sebagai susunan penelitian.
    assert "bukan kelas resmi BNPB" in notes
    assert "2.181 dari 83.530 desa" in notes
    assert "nol deteksi yang terukur" in notes
    # Tahun tanpa baris tidak boleh terbaca sebagai nol kejadian.
    assert "belum dimuat, bukan berarti nol kejadian" in notes


def test_village_panel_states_a_village_without_event_rows() -> None:
    # Sungai Ambawang Kuala (6112080011): punya titik panas, tidak punya satu pun
    # baris kejadian.
    body = client.get("/api/v1/panel/desa/6112080011").json()

    assert body["event_by_year"] == []
    assert "tidak punya baris kejadian" in " ".join(body["notes"])


def test_unknown_village_answers_404_and_short_code_answers_422() -> None:
    assert client.get("/api/v1/panel/desa/9999999999").status_code == 404
    # Kode desa BPS selalu sepuluh digit; kode pendek bukan wilayah yang "tidak ada".
    assert client.get("/api/v1/panel/desa/6271").status_code == 422