"""Uji CORS untuk pratinjau Vercel.

Pratinjau Vercel memanggil API di domain lain (`https://geosafe-api.zisaltech.site`),
jadi peramban menuntut header CORS. Yang dijaga di sini: origin pratinjau boleh,
origin asing tidak, dan tidak ada metode tulis yang diizinkan.
"""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

PREVIEW_ORIGIN = "https://geosafe-git-main-muhamad-azizs.vercel.app"


def test_preview_origin_is_allowed_to_read() -> None:
    response = client.get("/health", headers={"Origin": PREVIEW_ORIGIN})

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == PREVIEW_ORIGIN


def test_unknown_origin_is_not_granted() -> None:
    response = client.get("/health", headers={"Origin": "https://contoh-asing.example"})

    assert response.status_code == 200
    assert "access-control-allow-origin" not in response.headers


def test_preflight_allows_only_get() -> None:
    response = client.options(
        "/api/v1/panel/kabupaten_kota/9301",
        headers={
            "Origin": PREVIEW_ORIGIN,
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == PREVIEW_ORIGIN
    allowed = response.headers["access-control-allow-methods"].upper()
    assert "GET" in allowed
    assert "POST" not in allowed and "DELETE" not in allowed and "PUT" not in allowed
