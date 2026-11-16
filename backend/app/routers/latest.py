"""P2 — titik panas terkini (near real time) dan ringkasan `W1`.

Titik panas terbaru ditarik dari FIRMS **Area API** lalu dipetakan ke
kabupaten/kota **saat permintaan diproses**, bukan dari angka yang sudah
dihitung sebelumnya (`SRS-F-22`). Satu generasi data disimpan di cache memori
(15 menit) dan di `snapshot.json`, sehingga tarikan yang gagal tidak
mengosongkan peta (`SRS-F-24`, `SRS-F-25`).

Kontrak: `../planning-GeoSafe/docs/API-P2.md`, termasuk empat keputusan penutup di
bagian 9 yang mengikat:

1. Batas laju 60 permintaan/menit per IP, dihitung di server.
2. `satellites[].available` **ditentukan dari baris yang benar-benar kembali** pada
   tarikan itu; tidak ada panggilan `data_availability` terpisah, dan
   `last_acq_date` diambil dari tanggal terbaru yang pernah terlihat.
3. `snapshot.json` menyimpan **hasil join** dengan bentuk badan `/latest`
   (`{fetched_at, window_hours, satellites[], points[]}`), jadi saat tarikan gagal
   snapshot disajikan tanpa query spasial.
4. `top_provinces` yang kurang dari sepuluh dikirim apa adanya, tanpa pengisi.

Dua hal yang tidak boleh terjadi dan dijaga di sini: seri terkini tidak pernah
dijumlahkan dengan arsip 2020–2026 (tidak ada medan `hotspot_count` di namespace
ini), dan titik di luar poligon tetap terkirim dengan `region_code: null`
(`SRS-F-26`, `SRS-F-22`).

Catatan API FIRMS yang terukur (2026-11-17): Area API melayani **satu satelit per
permintaan** (daftar berkoma maupun `all` dijawab `400`), dan pengiriman data
Suomi-NPP berhenti 2026-11-02 sehingga `VIIRS_SNPP_NRT` tidak lagi ditarik.
"""

import csv
import io
import json
import logging
import os
import tempfile
import threading
import time
from collections import Counter
from collections.abc import Iterator
from datetime import date, datetime, timedelta, timezone
from typing import Any, Protocol

import httpx
import psycopg
from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import JSONResponse, Response
from psycopg.rows import dict_row

from app.config import database_url, firms_map_key, snapshot_path

router = APIRouter(prefix="/api/v1/latest", tags=["P2 titik panas terkini"])
logger = logging.getLogger("geosafe.latest")

FIRMS_API = "https://firms.modaps.eosdis.nasa.gov/api"
# Batas sah parameter `bbox` pengguna sekaligus bbox permintaan ke FIRMS — kalau
# keduanya berbeda, ada bbox yang lolos validasi tetapi mustahil dipenuhi.
LON_MIN, LAT_MIN, LON_MAX, LAT_MAX = 94.5, -11.5, 141.5, 6.5
FIRMS_BBOX = f"{LON_MIN},{LAT_MIN},{LON_MAX},{LAT_MAX}"

# Sumber yang ditarik. `VIIRS_SNPP_NRT` tidak ikut: NASA menghentikan pengiriman
# data Suomi-NPP pada 2026-11-02 (`data_availability` berhenti di tanggal itu) dan
# permintaannya selalu kosong. Karena keputusan 9 #2 melarang panggilan
# ketersediaan terpisah, satelit yang berhenti tidak bisa dilaporkan tanggalnya —
# yang dilaporkan adalah sumber yang benar-benar dicoba.
PULL_SOURCES = ("VIIRS_NOAA20_NRT", "VIIRS_NOAA21_NRT", "MODIS_NRT")
REPORTED_SATELLITES = PULL_SOURCES

# Area API melayani maksimum 5 hari per permintaan; 4 hari cukup untuk jendela
# 72 jam bahkan ketika permintaan datang pagi hari.
DAY_RANGE = 4

CACHE_TTL_SECONDS = 900
# Setelah tarikan gagal, jangan menembak FIRMS lagi selama ini: gangguan hulu
# tidak boleh berubah menjadi percobaan sebanyak jumlah permintaan pengguna.
FAILURE_COOLDOWN_SECONDS = 60
# Pagar memori: cache menyimpan satu generasi (bukan satu tahun), tetapi musim
# puncak bisa berkali-kali lipat hari biasa.
MAX_CACHED_POINTS = 120_000
MAX_RESPONSE_BYTES = 2_097_152
WINDOWS = (24, 48, 72)
RATE_LIMIT_PER_MINUTE = 60
USER_AGENT = "GeoSafe-api/1.0 (tugas akhir mata kuliah SIG; repo mhd-aziz/geosafe)"


def _now() -> datetime:
    """Waktu sekarang dalam UTC (kontrak: ISO-8601 bersufiks `Z`)."""
    return datetime.now(timezone.utc)


def _iso(moment: datetime) -> str:
    return moment.astimezone(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _dari_iso(teks: str) -> datetime:
    return datetime.fromisoformat(teks.replace("Z", "+00:00"))


def confidence_class(instrument: str, confidence: str | None) -> str | None:
    """Kelas keyakinan yang menormalkan dua skala berbeda (`API-P2.md` bagian 3).

    VIIRS memakai huruf (`l`/`n`/`h`), MODIS memakai angka 0–100. Nilai kosong
    atau tak dikenal menjadi `None` — bukan `low`, karena "tidak diketahui" bukan
    "keyakinan rendah".
    """
    nilai = (confidence or "").strip().lower()
    if instrument == "MODIS":
        if not nilai.isdigit():
            return None
        angka = int(nilai)
        return "low" if angka < 30 else "nominal" if angka < 80 else "high"
    return {"l": "low", "n": "nominal", "h": "high"}.get(nilai)


def observed_at(row: dict[str, str]) -> datetime | None:
    """Waktu pengamatan dari `acq_date` + `acq_time` (`HHMM` UTC, bisa 3 digit)."""
    tanggal = (row.get("acq_date") or "").strip()
    jam = (row.get("acq_time") or "").strip().zfill(4)
    if not tanggal or len(jam) != 4 or not jam.isdigit():
        return None
    try:
        return datetime.fromisoformat(f"{tanggal}T{jam[:2]}:{jam[2:]}:00+00:00")
    except ValueError:
        return None


def _angka(teks: str | None) -> float | None:
    try:
        return float(teks) if teks not in (None, "") else None
    except ValueError:
        return None


def brightness(row: dict[str, str], instrument: str) -> float | None:
    """Suhu kecerahan: VIIRS di `bright_ti4`, MODIS di `brightness`."""
    kolom = "brightness" if instrument == "MODIS" else "bright_ti4"
    return _angka(row.get(kolom))


class UpstreamAuthError(RuntimeError):
    """FIRMS menolak kunci atau permintaan (401/403) — bukan kegagalan jaringan."""


class UpstreamHttpError(RuntimeError):
    """Kegagalan hulu yang **tidak** membawa URL, karena URL memuat kunci API."""

    def __init__(self, status: int | None, jenis: str = "HTTPStatusError") -> None:
        self.status = status
        super().__init__(f"upstream_http {status}" if status else f"upstream_{jenis}")


class FirmsFetcher(Protocol):
    """Penarik data FIRMS.

    Disuntikkan sebagai dependensi supaya uji tidak menembak layanan luar dan
    tidak memakan kuota kunci — penyimpangan aturan "tidak ada mock" itu dicatat
    sebagai aturan 9 di `docs/CONVENTIONS.md`.
    """

    def area(self, source: str, start: date) -> list[dict[str, str]]: ...


class HttpFirmsFetcher:
    """Penarik sungguhan: satu klien HTTP untuk seluruh penyegaran.

    Satu penyegaran memanggil tiga satelit; satu klien berarti satu jabat tangan
    TLS, bukan tiga.
    """

    def __init__(self, key: str, timeout: float = 30.0) -> None:
        self._key = key
        self._client = httpx.Client(timeout=timeout, headers={"User-Agent": USER_AGENT})

    def close(self) -> None:
        self._client.close()

    def _csv(self, url: str) -> str:
        try:
            respons = self._client.get(url)
            respons.raise_for_status()
            return respons.text
        except httpx.HTTPStatusError as galat:
            kode = galat.response.status_code
            if kode in (401, 403):
                raise UpstreamAuthError(f"upstream_auth ({kode})") from None
            raise UpstreamHttpError(kode) from None
        except httpx.HTTPError as galat:
            raise UpstreamHttpError(None, jenis=type(galat).__name__) from None

    def area(self, source: str, start: date) -> list[dict[str, str]]:
        """Titik panas satu satelit untuk `DAY_RANGE` hari mulai `start`.

        `start` adalah hari **pertama** jendela, bukan hari terakhir — jebakan
        yang sudah terbukti di pengunduh repo perencanaan.
        """
        url = f"{FIRMS_API}/area/csv/{self._key}/{source}/{FIRMS_BBOX}/{DAY_RANGE}/{start.isoformat()}"
        return list(csv.DictReader(io.StringIO(self._csv(url))))


def get_firms_fetcher() -> Iterator[FirmsFetcher]:
    """Dependensi FastAPI: penarik FIRMS dengan kunci dari lingkungan."""
    fetcher = HttpFirmsFetcher(firms_map_key())
    try:
        yield fetcher
    finally:
        fetcher.close()


# ---------------------------------------------------------------- join wilayah

# Satu implementasi join, di SQL (aturan repo nomor 4). `LEFT JOIN` supaya titik
# di laut/luar poligon tetap terkirim dengan `region_code` NULL, bukan dibuang.
QUERY_JOIN_REGIONS = """
with titik as (
    select ord, lon, lat
      from unnest(%(longitudes)s::float8[], %(latitudes)s::float8[])
           with ordinality as t(lon, lat, ord)
)
select t.ord, r.region_code
  from titik t
  left join regions r
    on st_contains(r.geom, st_setsrid(st_makepoint(t.lon, t.lat), 4326))
"""

# Sepuluh provinsi terbanyak; `bbox` pengguna hanya menyaring daftar ini.
QUERY_TOP_PROVINCES = """
with titik as (
    select ord, lon, lat
      from unnest(%(longitudes)s::float8[], %(latitudes)s::float8[])
           with ordinality as t(lon, lat, ord)
)
select p.province_code, p.province_name, count(*) as point_count
  from titik t
  join regions r on st_contains(r.geom, st_setsrid(st_makepoint(t.lon, t.lat), 4326))
  join provinces p on p.province_code = r.province_code
 group by p.province_code, p.province_name
 order by point_count desc
 limit 10
"""


def _parse_point(row: dict[str, str], source: str) -> dict[str, Any] | None:
    """Ubah satu baris CSV FIRMS menjadi titik internal; `None` bila tak layak."""
    lintang = _angka(row.get("latitude"))
    bujur = _angka(row.get("longitude"))
    waktu = observed_at(row)
    if lintang is None or bujur is None or waktu is None:
        return None
    if not (LAT_MIN <= lintang <= LAT_MAX and LON_MIN <= bujur <= LON_MAX):
        return None
    instrumen = (row.get("instrument") or "").strip() or "VIIRS"
    return {
        "latitude": lintang,
        "longitude": bujur,
        "observed_at": _iso(waktu),
        "_observed_at": waktu,
        "confidence": (row.get("confidence") or "").strip() or None,
        "confidence_class": confidence_class(instrumen, row.get("confidence")),
        "satellite": (row.get("satellite") or "").strip() or source,
        "instrument": instrumen,
        "brightness": brightness(row, instrumen),
        "frp": _angka(row.get("frp")),
        "region_code": None,
    }


def _pull(fetcher: FirmsFetcher, now: datetime) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Tarik semua satelit penyedia, buang duplikat, hitung ketersediaan dari baris.

    Ketersediaan tidak memakai endpoint lain (keputusan 9 #2): satelit dianggap
    tersedia bila ia benar-benar mengirim baris pada tarikan ini.
    """
    mulai = now.date() - timedelta(days=DAY_RANGE - 1)
    titik: list[dict[str, Any]] = []
    terlihat: set[tuple] = set()
    jumlah: Counter[str] = Counter()
    tanggal_terbaru: dict[str, str] = dict(_terakhir_terlihat)

    for sumber in PULL_SOURCES:
        for baris in fetcher.area(sumber, mulai):
            bersih = _parse_point(baris, sumber)
            if bersih is None:
                continue
            kunci = (
                bersih["latitude"],
                bersih["longitude"],
                bersih["observed_at"],
                bersih["satellite"],
                bersih["instrument"],
                bersih["confidence"],
                bersih["frp"],
            )
            if kunci in terlihat:
                continue
            terlihat.add(kunci)
            titik.append(bersih)
            jumlah[sumber] += 1
            tanggal = bersih["observed_at"][:10]
            if tanggal > tanggal_terbaru.get(sumber, ""):
                tanggal_terbaru[sumber] = tanggal

    if len(titik) > MAX_CACHED_POINTS:
        logger.warning(
            "titik terkini %s melebihi pagar memori %s; sisanya dibuang",
            len(titik),
            MAX_CACHED_POINTS,
        )
        titik.sort(key=lambda p: p["_observed_at"], reverse=True)
        titik = titik[:MAX_CACHED_POINTS]

    satelit = [
        {
            "name": nama,
            "available": jumlah[nama] > 0,
            "last_acq_date": tanggal_terbaru.get(nama),
        }
        for nama in REPORTED_SATELLITES
    ]
    _terakhir_terlihat.update({k: v for k, v in tanggal_terbaru.items() if v})
    return titik, satelit


class _NoSnapshot(RuntimeError):
    """Tarikan gagal dan belum ada snapshot untuk dipakai."""


class _Cache:
    """Satu generasi data dipakai bersama semua jendela waktu."""

    def __init__(self) -> None:
        self.lock = threading.Lock()
        self.clear()

    def clear(self) -> None:
        self.fetched_at: datetime | None = None
        self.points: list[dict[str, Any]] = []
        self.satellites: list[dict[str, Any]] = []
        self.using_snapshot = False
        self.pulls = 0


_cache = _Cache()
_refresh_lock = threading.Lock()
_failure_lock = threading.Lock()
_failure_at: datetime | None = None
_terakhir_terlihat: dict[str, str] = {}

_rate_lock = threading.Lock()
_rate_hits: dict[str, list[float]] = {}


def clear_cache() -> None:
    """Kosongkan cache memori dan status kegagalan (dipakai uji dan manual)."""
    global _failure_at
    with _cache.lock:
        _cache.clear()
    with _failure_lock:
        _failure_at = None
    with _rate_lock:
        _rate_hits.clear()
    _terakhir_terlihat.clear()


def _snapshot_write(fetched_at: datetime, points: list[dict[str, Any]], satellites: list[dict[str, Any]]) -> None:
    """Tulis snapshot hasil join; bentuknya sama dengan badan `/latest` (keputusan 9 #3)."""
    isi = {
        "fetched_at": _iso(fetched_at),
        "window_hours": max(WINDOWS),
        "satellites": satellites,
        "points": [{k: v for k, v in p.items() if k != "_observed_at"} for p in points],
    }
    tujuan = snapshot_path()
    tujuan.parent.mkdir(parents=True, exist_ok=True)
    # Tulis ke berkas sementara lalu `os.replace`: penulisan yang terputus tidak
    # boleh meninggalkan JSON setengah jadi yang lalu dianggap "tidak ada snapshot".
    fd, sementara = tempfile.mkstemp(dir=str(tujuan.parent), prefix=".snapshot-", suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as berkas:
            json.dump(isi, berkas)
        os.replace(sementara, tujuan)
    except BaseException:
        try:
            os.unlink(sementara)
        except OSError:
            pass
        raise


def _snapshot_read() -> tuple[datetime, list[dict[str, Any]], list[dict[str, Any]]] | None:
    berkas = snapshot_path()
    if not berkas.exists():
        return None
    try:
        isi = json.loads(berkas.read_text(encoding="utf-8"))
        waktu = _dari_iso(str(isi["fetched_at"]))
        titik = []
        for p in isi.get("points", []):
            p["_observed_at"] = _dari_iso(str(p["observed_at"]))
            titik.append(p)
    except (ValueError, KeyError, TypeError, OSError):
        logger.warning("snapshot %s tidak bisa dibaca; dianggap tidak ada", berkas)
        return None
    return waktu, titik, isi.get("satellites", [])


def _pesan_kegagalan(galat: BaseException) -> str:
    """Pesan galat hulu tanpa URL — URL memuat kunci API."""
    if isinstance(galat, (UpstreamAuthError, UpstreamHttpError)):
        return str(galat)
    return f"upstream_{type(galat).__name__}"


def _dalam_cooldown(now: datetime) -> bool:
    with _failure_lock:
        return _failure_at is not None and (now - _failure_at).total_seconds() < FAILURE_COOLDOWN_SECONDS


def _catat_kegagalan(now: datetime, galat: BaseException) -> None:
    global _failure_at
    with _failure_lock:
        _failure_at = now
    logger.warning("tarikan FIRMS gagal: %s", _pesan_kegagalan(galat))


def _pakai_snapshot(now: datetime) -> _Cache | None:
    snapshot = _snapshot_read()
    if snapshot is None:
        return None
    waktu, titik, satelit = snapshot
    with _cache.lock:
        _cache.fetched_at = waktu
        _cache.points = titik
        _cache.satellites = satelit
        _cache.using_snapshot = True
    return _cache


def _generation(fetcher: FirmsFetcher) -> tuple[_Cache, str]:
    """Ambil generasi data: cache segar, tarikan baru, atau snapshot terakhir."""
    now = _now()
    with _cache.lock:
        umur = (now - _cache.fetched_at).total_seconds() if _cache.fetched_at else None
        if umur is not None and umur < CACHE_TTL_SECONDS and not _cache.using_snapshot:
            return _cache, "HIT"

    # Satu tarikan melayani semua penunggu: permintaan yang datang saat tarikan
    # berjalan menunggu di sini lalu mendapat HIT (kontrak bagian 5, NF-11).
    with _refresh_lock:
        now = _now()
        with _cache.lock:
            umur = (now - _cache.fetched_at).total_seconds() if _cache.fetched_at else None
            if umur is not None and umur < CACHE_TTL_SECONDS and not _cache.using_snapshot:
                return _cache, "HIT"

        if _dalam_cooldown(now):
            cache = _pakai_snapshot(now)
            if cache is None:
                raise _NoSnapshot("upstream_cooldown dan belum ada snapshot")
            return cache, "MISS"

        try:
            titik, satelit = _pull(fetcher, now)
            # Join sekali per generasi; hasilnya ikut disimpan di snapshot
            # (keputusan 9 #3) sehingga kegagalan tarikan maupun basis data yang
            # sibuk tidak memerlukan query spasial saat menyajikan.
            with _koneksi() as conn:
                titik = _with_regions(conn, titik)
        except Exception as galat:  # noqa: BLE001 — apa pun kegagalannya, snapshot menjawab
            _catat_kegagalan(now, galat)
            cache = _pakai_snapshot(now)
            if cache is None:
                raise _NoSnapshot(_pesan_kegagalan(galat)) from None
            return cache, "MISS"

        with _cache.lock:
            _cache.fetched_at = now
            _cache.points = titik
            _cache.satellites = satelit
            _cache.using_snapshot = False
            _cache.pulls += 1
        try:
            _snapshot_write(now, titik, satelit)
        except OSError as galat:
            # Snapshot hanya jaring pengaman; permintaan tetap dilayani dari memori,
            # tetapi kegagalannya harus terlihat di jurnal.
            logger.warning("snapshot tidak bisa ditulis: %s", galat)
        return _cache, "MISS"


def _window(points: list[dict[str, Any]], window_hours: int, acuan: datetime) -> list[dict[str, Any]]:
    """Titik dalam jendela, dihitung dari `fetched_at` (kontrak bagian 1)."""
    batas = acuan - timedelta(hours=window_hours)
    return [p for p in points if p["_observed_at"] >= batas]


def _in_box(points: list[dict[str, Any]], box: tuple[float, float, float, float]) -> list[dict[str, Any]]:
    min_lon, min_lat, max_lon, max_lat = box
    return [
        p for p in points if min_lon <= p["longitude"] <= max_lon and min_lat <= p["latitude"] <= max_lat
    ]


def _with_regions(conn: psycopg.Connection, points: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Isi `region_code` lewat satu query join (`API-P2.md` bagian 6)."""
    if not points:
        return points
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            QUERY_JOIN_REGIONS,
            {
                "longitudes": [p["longitude"] for p in points],
                "latitudes": [p["latitude"] for p in points],
            },
        )
        peta: dict[int, str | None] = {}
        for baris in cur.fetchall():
            peta.setdefault(int(baris["ord"]) - 1, baris["region_code"])
    for nomor, titik in enumerate(points):
        titik["region_code"] = peta.get(nomor)
    return points


def _koneksi() -> psycopg.Connection:
    """Koneksi basis data untuk join dan ringkasan provinsi.

    Sengaja **bukan** dependensi FastAPI: kedua endpoint ini harus tetap menjawab
    dari snapshot ketika basis data sibuk atau mati (keputusan 9 #3), dan
    dependensi akan melempar sebelum badan endpoint sempat berjalan.
    """
    conn = psycopg.connect(database_url(), autocommit=True, connect_timeout=5)
    conn.row_factory = dict_row
    return conn


def _provinsi_teratas(conn: psycopg.Connection, points: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not points:
        return []
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            QUERY_TOP_PROVINCES,
            {
                "longitudes": [p["longitude"] for p in points],
                "latitudes": [p["latitude"] for p in points],
            },
        )
        return [
            {
                "province_code": b["province_code"],
                "province_name": b["province_name"],
                "point_count": int(b["point_count"]),
            }
            for b in cur.fetchall()
        ]


def _tanpa_garis_bawah(titik: dict[str, Any]) -> dict[str, Any]:
    return {k: v for k, v in titik.items() if not k.startswith("_")}


def _invalid(detail: str) -> JSONResponse:
    return JSONResponse(status_code=422, content={"error": "invalid_parameter", "detail": detail})


def _cek_bbox(bbox: str | None) -> tuple[float, float, float, float] | JSONResponse:
    """Validasi `bbox`; kembalikan batasnya atau balasan 422 bergaya kontrak."""
    if bbox is None:
        return LON_MIN, LAT_MIN, LON_MAX, LAT_MAX
    bagian = [b.strip() for b in bbox.split(",")]
    if len(bagian) != 4:
        return _invalid("bbox harus empat angka: min_lon,min_lat,max_lon,max_lat")
    try:
        min_lon, min_lat, max_lon, max_lat = (float(b) for b in bagian)
    except ValueError:
        return _invalid("bbox harus berisi angka")
    if min_lon >= max_lon or min_lat >= max_lat:
        return _invalid("bbox tidak sah: nilai minimum harus lebih kecil dari maksimum")
    if not (LON_MIN <= min_lon and max_lon <= LON_MAX and LAT_MIN <= min_lat and max_lat <= LAT_MAX):
        return _invalid(f"bbox di luar wilayah Indonesia ({LON_MIN},{LAT_MIN},{LON_MAX},{LAT_MAX})")
    return min_lon, min_lat, max_lon, max_lat


def _cek_window(window: str | None) -> int | JSONResponse:
    """Validasi `window`; menerima teks supaya 422-nya bergaya kontrak.

    Tidak dikirim (`None`) berarti bawaan 72 jam; dikirim tetapi kosong atau bukan
    salah satu nilai sah berarti `422`.
    """
    teks = str(max(WINDOWS)) if window is None else window.strip()
    if not teks.isdigit() or int(teks) not in WINDOWS:
        return _invalid(f"window harus salah satu dari {', '.join(map(str, WINDOWS))}")
    return int(teks)


def _laju_terlampaui(request: Request) -> JSONResponse | None:
    """Batas 60 permintaan/menit per IP (`SRS-NF-01`, keputusan 9 #1)."""
    ip = request.client.host if request.client else "tidak-dikenal"
    sekarang = time.monotonic()
    with _rate_lock:
        riwayat = [t for t in _rate_hits.get(ip, []) if sekarang - t < 60]
        if len(riwayat) >= RATE_LIMIT_PER_MINUTE:
            _rate_hits[ip] = riwayat
            return JSONResponse(
                status_code=429,
                content={"error": "rate_limited", "message": "terlalu banyak permintaan"},
                headers={"Retry-After": "60"},
            )
        riwayat.append(sekarang)
        _rate_hits[ip] = riwayat
        # Buang IP yang sudah tidak aktif supaya peta tidak tumbuh tanpa batas.
        if len(_rate_hits) > 512:
            for kunci in [k for k, v in _rate_hits.items() if not v or sekarang - v[-1] >= 60]:
                _rate_hits.pop(kunci, None)
    return None


def _headers(cache: _Cache, state: str) -> dict[str, str]:
    return {
        "X-Cache": state,
        "X-Fetched-At": _iso(cache.fetched_at) if cache.fetched_at else "",
        "X-Snapshot": "true" if cache.using_snapshot else "false",
        "Cache-Control": "public, max-age=60",
    }


def _base(cache: _Cache, window_hours: int) -> dict[str, Any]:
    acuan = cache.fetched_at or _now()
    umur_snapshot = int((_now() - acuan).total_seconds()) if cache.using_snapshot else 0
    return {
        "fetched_at": _iso(acuan),
        "window_hours": window_hours,
        # Jendela dihitung dari `fetched_at`, bukan dari jam permintaan, supaya
        # `/latest` dan `/latest/summary` tidak bisa berbeda di batas jendela.
        "window_start": _iso(acuan - timedelta(hours=window_hours)),
        "series": "nrt",
        "using_snapshot": cache.using_snapshot,
        "snapshot_age_seconds": max(umur_snapshot, 0),
    }


def _siapkan(request: Request, window: str | None, bbox: str | None):
    """Validasi parameter lebih dulu, baru batas laju: masukan salah tidak memakan kuota."""
    jendela = _cek_window(window)
    if isinstance(jendela, JSONResponse):
        return jendela
    kotak = _cek_bbox(bbox)
    if isinstance(kotak, JSONResponse):
        return kotak
    laju = _laju_terlampaui(request)
    if laju is not None:
        return laju
    return jendela, kotak


def _generasi_atau_galat(fetcher: FirmsFetcher):
    try:
        return _generation(fetcher)
    except _NoSnapshot as galat:
        return JSONResponse(
            status_code=503,
            content={
                "error": "no_snapshot",
                "message": f"tarikan ke FIRMS gagal dan belum ada snapshot: {galat}",
            },
        )


@router.get("")
def latest(
    request: Request,
    window: str | None = Query(default=None, description="Jendela jam ke belakang: 24, 48, atau 72"),
    bbox: str | None = Query(default=None, description="min_lon,min_lat,max_lon,max_lat"),
    fetcher: FirmsFetcher = Depends(get_firms_fetcher),
) -> Response:
    """Titik panas terkini + kabupaten/kota hasil join saat permintaan."""
    siap = _siapkan(request, window, bbox)
    if isinstance(siap, JSONResponse):
        return siap
    jendela, kotak = siap
    hasil = _generasi_atau_galat(fetcher)
    if isinstance(hasil, JSONResponse):
        return hasil
    cache, state = hasil

    acuan = cache.fetched_at or _now()
    titik = _window(cache.points, jendela, acuan)
    if bbox is not None:
        titik = _in_box(titik, kotak)

    isi = _base(cache, jendela)
    isi.update(
        {
            "point_count": len(titik),
            "points_outside_polygon": sum(1 for p in titik if p.get("region_code") is None),
            "truncated": False,
            "satellites": cache.satellites,
            "points": [_tanpa_garis_bawah(p) for p in titik],
        }
    )

    muatan = json.dumps(isi, ensure_ascii=False).encode("utf-8")
    if len(muatan) > MAX_RESPONSE_BYTES:
        # Dipotong seluruhnya, bukan sebagian: daftar setengah jadi menyesatkan
        # peta, sedangkan `null` memaksa klien mempersempit `bbox`.
        isi["points"] = None
        isi["truncated"] = True
        muatan = json.dumps(isi, ensure_ascii=False).encode("utf-8")

    return Response(content=muatan, media_type="application/json", headers=_headers(cache, state))


@router.get("/summary")
def latest_summary(
    request: Request,
    window: str | None = Query(default=None, description="Jendela jam ke belakang: 24, 48, atau 72"),
    bbox: str | None = Query(default=None, description="min_lon,min_lat,max_lon,max_lat"),
    fetcher: FirmsFetcher = Depends(get_firms_fetcher),
) -> Response:
    """Ringkasan nasional + sepuluh provinsi terbanyak (`W1`), tanpa titik mentah."""
    siap = _siapkan(request, window, bbox)
    if isinstance(siap, JSONResponse):
        return siap
    jendela, kotak = siap
    hasil = _generasi_atau_galat(fetcher)
    if isinstance(hasil, JSONResponse):
        return hasil
    cache, state = hasil

    acuan = cache.fetched_at or _now()
    titik = _window(cache.points, jendela, acuan)
    # Angka nasional dari generasi yang sama; `bbox` hanya menyaring sepuluh
    # provinsi terbanyak (`API-P2.md` bagian 2).
    ditunjuk = _in_box(titik, kotak) if bbox is not None else titik

    provinsi: list[dict[str, Any]] = []
    if ditunjuk:
        try:
            with _koneksi() as conn:
                provinsi = _provinsi_teratas(conn, ditunjuk)
        except psycopg.Error as galat:
            # Angka nasional tetap dilaporkan karena tidak butuh basis data;
            # hanya daftar provinsi yang dilewati, dan sebabnya masuk jurnal.
            logger.warning("daftar provinsi dilewati: %s", type(galat).__name__)

    isi = _base(cache, jendela)
    isi.update(
        {
            "point_count": len(titik),
            "points_outside_polygon": sum(1 for p in titik if p.get("region_code") is None),
            "regions_with_points": len({p["region_code"] for p in titik if p.get("region_code")}),
            "satellites": cache.satellites,
            "top_provinces": provinsi,
        }
    )
    return Response(
        content=json.dumps(isi, ensure_ascii=False).encode("utf-8"),
        media_type="application/json",
        headers=_headers(cache, state),
    )