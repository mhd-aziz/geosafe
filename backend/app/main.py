"""Titik masuk aplikasi FastAPI GeoSafe.

Hanya berisi pembuatan aplikasi dan endpoint dasar. Router per kelompok fitur
(P1-P5, W1-W4, A1-A3, C1, T1) ditambahkan menyusul, satu berkas per kelompok.
"""

from fastapi import FastAPI

from app.routers import analysis, latest, maps, panels, search, transparency

app = FastAPI(
    title="GeoSafe API",
    version="0.1.0",
    description=(
        "API purwarupa GeoSafe: sebaran titik panas (hotspot) sebagai indikator "
        "kerawanan kebakaran hutan dan lahan."
    ),
)

# Satu router per kelompok fitur; ditambah seiring fiturnya dikerjakan.
app.include_router(transparency.router)
app.include_router(maps.router)
app.include_router(panels.router)
app.include_router(search.router)
app.include_router(analysis.router)
app.include_router(latest.router)


@app.get("/health", tags=["internal"])
async def health() -> dict[str, str]:
    """Cek sederhana bahwa proses API hidup. Dipakai uji dan pemantauan."""
    return {"status": "ok", "service": "geosafe-api", "version": app.version}
