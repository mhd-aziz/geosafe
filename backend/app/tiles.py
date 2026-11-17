"""Aturan tile MVT yang dipakai bersama oleh semua lapisan peta.

Tiga lapisan (`maps.py` untuk jumlah titik panas, `risk.py` untuk skor kerawanan)
mengirim muatan protobuf dengan aturan yang sama, jadi aturannya tinggal di satu
tempat: tile tanpa poligon dibalas **204 tanpa isi**, bukan muatan kosong yang
harus diurai peramban, dan koordinat tile yang di luar rentang ditolak sebelum
menyentuh basis data.
"""

from fastapi import HTTPException, Response

MEDIA_TYPE_MVT = "application/vnd.mapbox-vector-tile"


def render_tile(tile: bytes | None) -> Response:
    """Bungkus muatan MVT; tile kosong dibalas 204 tanpa isi."""
    if not tile:
        return Response(status_code=204)

    return Response(
        content=bytes(tile),
        media_type=MEDIA_TYPE_MVT,
        headers={"Cache-Control": "public, max-age=3600"},
    )


def check_tile_bounds(z: int, x: int, y: int) -> None:
    """Tolak koordinat tile di luar rentang dengan `422`, bukan `500`.

    Pada zoom `z`, `x` dan `y` yang sah hanya `0..2^z-1`. Tanpa pemeriksaan ini
    nilainya menjalar ke `ST_TileEnvelope`, PostgreSQL melempar
    `Invalid tile x value`, dan pengguna menerima `500` untuk permintaan yang
    sebenarnya sekadar salah alamat.
    """
    limit = 2**z - 1
    if x > limit or y > limit:
        raise HTTPException(
            status_code=422,
            detail=(
                f"koordinat tile di luar rentang: pada z={z}, x dan y sah "
                f"hanya 0..{limit}"
            ),
        )
