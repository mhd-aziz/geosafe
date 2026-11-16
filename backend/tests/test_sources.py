"""Uji endpoint T1 terhadap basis data `geosafe` yang hidup.

Butuh `GEOSAFE_DATABASE_URL` (lihat app/config.py). Uji ini sengaja gagal kalau
basis datanya tidak bisa dihubungi, supaya kegagalan tidak tertutup.
"""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_sources_lists_all_datasets() -> None:
    response = client.get("/api/v1/sources")

    assert response.status_code == 200
    body = response.json()
    codes = {row["source_code"] for row in body["sources"]}

    assert body["count"] == len(codes) == 7
    assert "FIRMS" in codes
    assert "BNPB-EVENT" in codes
