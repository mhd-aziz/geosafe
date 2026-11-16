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


def test_panel_memuat_identitas_wilayah_dan_seri_titik_panas() -> None:
    response = client.get(MERAUKE)

    assert response.status_code == 200
    body = response.json()

    assert body["region"]["region_name"] == "Merauke"
    assert body["region"]["province_name"] == "Papua Selatan"
    assert body["region"]["area_km2"] > 40_000

    tahun = {row["year"] for row in body["hotspot_by_year"]}
    assert tahun == {2020, 2021, 2022, 2023, 2024, 2025, 2026}
    # seri dikirim apa adanya: 2026 memuat seri arsip dan seri nrt
    seri_2026 = {row["series"] for row in body["hotspot_by_year"] if row["year"] == 2026}
    assert {"main", "nrt"} <= seri_2026


def test_panel_memuat_kejadian_status_darurat_dan_irbi() -> None:
    body = client.get(MERAUKE).json()

    tahun_kejadian = {row["year"] for row in body["event_by_year"]}
    assert tahun_kejadian <= set(range(2020, 2027))
    assert 2026 in tahun_kejadian  # satu-satunya tahun yang tercatat untuk Merauke

    assert set(body["emergency_2025"]) == {
        "emergency_sk_karhutla_2025",
        "emergency_sk_mentions_2025",
    }
    assert body["irbi_2025"]["irbi_class"] == "Sedang"
    assert len(body["irbi_karhutla_by_year"]) == 6
    assert body["hotspot_per_1000_km2"] is not None


def test_panel_menyebut_batasan_data() -> None:
    catatan = " ".join(client.get(MERAUKE).json()["notes"])

    assert "korban dan kerusakan" in catatan
    assert "nrt" in catatan  # peringatan seri tidak sebanding ikut terkirim
    assert "tidak menulis baris bernilai nol" in catatan  # tahun tanpa baris fakta dijelaskan


def test_wilayah_tidak_dikenal_balas_404() -> None:
    response = client.get("/api/v1/panel/kabupaten_kota/9999")

    assert response.status_code == 404
    assert "9999" in response.json()["detail"]
