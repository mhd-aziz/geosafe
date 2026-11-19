"""Titik masuk aplikasi FastAPI GeoSafe.

Hanya berisi pembuatan aplikasi dan endpoint dasar. Router per kelompok fitur
(P1-P5, W1-W4, A1-A3, C1, T1) ditambahkan menyusul, satu berkas per kelompok.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import VERCEL_PREVIEW_ORIGIN_REGEX, allowed_origins
from app.db import get_pool
from app.routers import analysis, latest, maps, panels, risk, search, transparency


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Tutup kolam koneksi saat proses berhenti (`systemctl restart geosafe-api`).

    Tanpa ini koneksi ke Aiven menunggu batas waktu server sampai dilepas, dan
    jumlah koneksi yang diizinkan server itu kecil (15).
    """
    yield
    pool = get_pool()
    get_pool.cache_clear()
    pool.close()


app = FastAPI(
    title="GeoSafe API",
    version="0.1.0",
    description=(
        "API purwarupa GeoSafe: sebaran titik panas (hotspot) sebagai indikator "
        "kerawanan kebakaran hutan dan lahan."
    ),
    lifespan=lifespan,
)

# CORS: pratinjau Vercel memanggil API di domain lain (tunnel Cloudflare), jadi
# peramban menuntut izin eksplisit. Hanya metode baca yang diizinkan — aplikasi
# ini tidak punya endpoint tulis (SRS-C-07).
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins(),
    allow_origin_regex=VERCEL_PREVIEW_ORIGIN_REGEX,
    allow_methods=["GET"],
    allow_headers=["*"],
    max_age=600,
)

# Satu router per kelompok fitur; ditambah seiring fiturnya dikerjakan.
app.include_router(transparency.router)
app.include_router(maps.router)
app.include_router(maps.event_router)
app.include_router(panels.router)
app.include_router(panels.district_router)
app.include_router(panels.village_router)
app.include_router(search.router)
app.include_router(analysis.router)
app.include_router(analysis.composition_router)
app.include_router(analysis.ranking_router)
app.include_router(latest.router)
app.include_router(risk.router)


@app.get("/health", tags=["internal"])
async def health() -> dict[str, str]:
    """Cek sederhana bahwa proses API hidup. Dipakai uji dan pemantauan."""
    return {"status": "ok", "service": "geosafe-api", "version": app.version}
