"""Uji daftar titik kejadian (P5) terhadap basis data hidup.

Angka yang dipakai di sini terukur 2026-11-19: 6.390 kejadian karhutla 2020–2026,
dengan 2023 sebagai tahun terbesar (2.153 kejadian: 637 berkoordinat desa, 384
kecamatan, 1.132 kabupaten/kota). Tahun 2025 dan 2026 tidak punya kode identitas
BNPB sama sekali (545 + 1.110), sehingga `point_id` cadangan ikut teruji.
"""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

POINTS = "/api/v1/events/points"


def test_event_points_answers_one_year_with_counts() -> None:
    response = client.get(POINTS, params={"year": 2023})

    assert response.status_code == 200
    body = response.json()

    assert body["year"] == 2023
    assert body["count"] == 2_153
    assert len(body["points"]) == body["count"]
    assert body["coord_level_counts"] == {"village": 637, "district": 384, "region": 1_132}


def test_event_point_carries_detail_needed_by_the_panel() -> None:
    """`SRS-F-42`: tanggal, wilayah, `point_id`, dan nilai dampak bila ada."""
    body = client.get(POINTS, params={"year": 2023}).json()
    point = next(row for row in body["points"] if row["point_id"] == "1403 107 2023 01 01 1")

    assert point["event_date"] == "2023-01-01"
    assert point["coord_level"] == "village"
    assert point["region_code"] == "1403"
    assert point["region_name"] == "Bengkalis"
    assert point["province_name"] == "Riau"
    # Nama mentah dari sumber memuat beberapa kemungkinan dipisah " | "; aplikasi
    # menampilkannya apa adanya karena tidak boleh memilih salah satu.
    assert point["district_name"] == "Talang Mandau | Bukit Batu"
    assert point["village_name"] == "Dompas | Tanjung Belit"
    assert round(point["latitude"], 4) == 1.3104
    assert round(point["longitude"], 4) == 102.0502
    assert point["deaths"] is None  # tidak dilaporkan, bukan nol
    assert point["houses_damaged"] == 0  # dilaporkan nol


def test_event_points_supply_a_fallback_id_where_bnpb_code_is_missing() -> None:
    """`SRS-D-06`: kunci unik tetap ada walau kode identitas BNPB kosong."""
    body = client.get(POINTS, params={"year": 2026}).json()

    assert body["count"] == 1_110
    assert all(point["point_id"].startswith("EVT-") for point in body["points"])
    # Bentuk cadangannya `EVT-<event_id>`, bukan nomor urut baru.
    assert all(point["point_id"][4:].isdigit() for point in body["points"])


def test_event_points_states_coordinate_precision_and_limits() -> None:
    """`SRS-F-41` menuntut arti tingkat ketelitian koordinat dinyatakan."""
    notes = " ".join(client.get(POINTS, params={"year": 2023}).json()["notes"])

    assert "bukan deteksi satelit" in notes
    assert "ketelitian koordinat 2023" in notes
    assert "titik pusat kecamatan" in notes
    assert "titik pusat kabupaten/kota" in notes
    assert "EVT-<event_id>" in notes
    assert "berarti tidak dilaporkan" in notes
    # 2026 adalah angka berjalan (`SRS-AS-06`).
    notes_2026 = " ".join(client.get(POINTS, params={"year": 2026}).json()["notes"])
    assert "angka berjalan" in notes_2026


def test_event_points_reject_year_outside_range() -> None:
    assert client.get(POINTS, params={"year": 2019}).status_code == 422
    assert client.get(POINTS, params={"year": 2027}).status_code == 422
