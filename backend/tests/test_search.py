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


def _cari(q: str) -> dict:
    response = client.get(SEARCH, params={"q": q})
    assert response.status_code == 200, response.text
    return response.json()


def test_pencarian_nama_kembar_membedakan_jenis_dan_provinsi() -> None:
    body = _cari("bogor")

    bogor = {(row["code"], row["region_type"]) for row in body["results"] if row["level"] == "regency"}
    assert ("3201", "REGENCY") in bogor
    assert ("3271", "CITY") in bogor
    assert all(
        row["province_name"] == "Jawa Barat"
        for row in body["results"]
        if row["level"] == "regency" and row["name"].endswith("Bogor")
    )


def test_pencarian_lewat_kode_mengembalikan_kabupaten_dan_provinsinya() -> None:
    body = _cari("9301")

    pertama = body["results"][0]
    assert pertama["level"] == "regency"
    assert pertama["name"] == "Merauke"
    assert pertama["province_name"] == "Papua Selatan"
    assert pertama["bbox"] is not None


def test_pencarian_mencakup_empat_tingkat_dan_dibatasi_dua_puluh_baris() -> None:
    tingkat = set()
    for q in ("jawa", "bandung", "bogor", "sido"):
        body = _cari(q)
        assert len(body["results"]) <= 20
        tingkat |= {row["level"] for row in body["results"]}

    assert tingkat == {"province", "regency", "district", "village"}

    penuh = _cari("sido")
    assert penuh["count"] == 20  # 509 desa bernama "sido…" dipotong di batas saran
    assert any("batas maksimal" in note for note in penuh["notes"])


def test_pencarian_nama_persis_didahulukan() -> None:
    nama = [row["name"] for row in _cari("merauke")["results"]]

    assert nama[0].lower() == "merauke"


def test_kata_kunci_tanpa_hasil_menyatakan_sebabnya() -> None:
    body = _cari("zzqqxx")

    assert body["count"] == 0
    assert body["results"] == []
    catatan = " ".join(body["notes"])
    assert "zzqqxx" in catatan
    assert "tidak menemukan wilayah" in catatan
    assert "BPS" in catatan  # sebabnya disebut, bukan disembunyikan


def test_kata_kunci_dengan_wildcard_diperlakukan_sebagai_teks() -> None:
    body = _cari("__")

    assert body["count"] == 0  # tanpa escape, "_" mencocokkan hampir semua nama


def test_kata_kunci_terlalu_pendek_ditolak_validasi() -> None:
    assert client.get(SEARCH, params={"q": "b"}).status_code == 422
