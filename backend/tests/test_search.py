"""Uji pencarian wilayah (C1) terhadap basis data hidup.

Kata kunci uji dipilih karena datanya nyata: **Bogor** dan **Bandung** punya
nama kembar kabupaten/kota dalam satu provinsi (`SRS-F-69`), **Sido** menyentuh
ratusan desa sehingga batas 20 baris (`SRS-F-68`) benar-benar terpakai, dan
**9301** adalah kode Kabupaten Merauke (provinsi Papua Selatan).
"""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

SEARCH = "/api/v1/search/regions"


def _search(q: str) -> dict:
    response = client.get(SEARCH, params={"q": q})
    assert response.status_code == 200, response.text
    return response.json()


def test_search_distinguishes_twin_names_by_type_and_province() -> None:
    body = _search("bogor")

    twins = {(row["code"], row["region_type"]) for row in body["results"] if row["level"] == "regency"}
    assert ("3201", "REGENCY") in twins
    assert ("3271", "CITY") in twins
    assert all(
        row["province_name"] == "Jawa Barat"
        for row in body["results"]
        if row["level"] == "regency" and row["name"].endswith("Bogor")
    )


def test_search_by_code_returns_regency_and_province() -> None:
    body = _search("9301")

    first_row = body["results"][0]
    assert first_row["level"] == "regency"
    assert first_row["name"] == "Merauke"
    assert first_row["province_name"] == "Papua Selatan"
    assert first_row["bbox"] is not None


def test_search_covers_four_levels_and_caps_at_twenty_rows() -> None:
    levels = set()
    for q in ("jawa", "bandung", "bogor", "sido"):
        body = _search(q)
        assert len(body["results"]) <= 20
        levels |= {row["level"] for row in body["results"]}

    assert levels == {"province", "regency", "district", "village"}

    capped = _search("sido")
    assert capped["count"] == 20  # 509 desa bernama "sido..." dipotong di batas saran
    assert any("batas maksimal" in note for note in capped["notes"])


def test_search_ranks_exact_name_first() -> None:
    names = [row["name"] for row in _search("merauke")["results"]]

    assert names[0].lower() == "merauke"


def test_keyword_without_match_states_the_reason() -> None:
    body = _search("zzqqxx")

    assert body["count"] == 0
    assert body["results"] == []
    notes = " ".join(body["notes"])
    assert "zzqqxx" in notes
    assert "tidak menemukan wilayah" in notes
    assert "BPS" in notes  # sebabnya disebut, bukan disembunyikan


def test_wildcard_keyword_is_treated_as_text() -> None:
    body = _search("__")

    assert body["count"] == 0  # tanpa escape, "_" mencocokkan hampir semua nama


def test_too_short_keyword_fails_validation() -> None:
    assert client.get(SEARCH, params={"q": "b"}).status_code == 422