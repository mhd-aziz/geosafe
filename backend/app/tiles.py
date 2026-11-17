"""Bentuk balasan tile MVT yang dipakai bersama oleh semua lapisan peta.

Dua lapisan (`maps.py` untuk jumlah titik panas, `risk.py` untuk skor kerawanan)
mengirim muatan protobuf dengan aturan yang sama, jadi aturannya tinggal di satu
tempat: tile tanpa poligon dibalas **204 tanpa isi**, bukan muatan kosong yang
harus diurai peramban.
"""

from fastapi import Response

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