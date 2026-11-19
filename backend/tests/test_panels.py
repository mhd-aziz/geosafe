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