"""Uji endpoint titik panas terkini (`P2` + `W1`) terhadap basis data hidup.

Panggilan ke FIRMS **disuntikkan** lewat `dependency_overrides`, jadi uji ini
tidak menembak layanan luar dan tidak memakan kuota kunci; penyimpangan aturan
"tidak ada mock" itu dicatat sebagai aturan 9 di `docs/CONVENTIONS.md`. Join titik
ke wilayah tetap dieksekusi sungguhan di PostgreSQL, dan itu yang diperiksa.

Kontrak yang diuji: `../planning-GeoSafe/docs/API-P2.md` — termasuk empat
keputusan penutup di bagian 9 (batas laju, `available` dari baris yang kembali,
bentuk snapshot, `top_provinces` apa adanya).
"""

import json
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.routers import latest
from app.routers.latest import (
    UpstreamAuthError,
    UpstreamHttpError,
    confidence_class,
    get_firms_fetcher,
    observed_at,
)

client = TestClient(app)

LATEST = "/api/v1/latest"
SUMMARY = "/api/v1/latest/summary"

# Satu titik di Kota Merauke (masuk Kabupaten Merauke 9301) dan satu di Samudra
# Hindia (di luar poligon mana pun → `region_code` null).
MERAUKE = (-8.4932, 140.4018, "9301")
OCEAN = (-5.0, 96.0, None)
# Kotak yang hanya memuat titik di sekitar Merauke (urutan kontrak: lon,lat,lon,lat).
BOX_MERAUKE = "139.5,-9.5,141.5,-7.5"


class StubFetcher:
    """Penarik palsu: mengembalikan baris CSV tiruan tanpa jaringan.

    Tidak punya metode `availability` sama sekali — kalau modul memanggilnya,
    ujinya gagal dengan `AttributeError`. Itu cara memaksa keputusan 9 #2
    ("tidak ada panggilan `data_availability` terpisah").
    """

    def __init__(self, galat: BaseException | None = None, sunyi: tuple[str, ...] = ()) -> None:
        self.galat = galat
        self.sunyi = sunyi  # sumber yang sengaja dibalas kosong
        self.area_calls: list[str] = []

    @staticmethod
    def _row(
        lat: float,
        lon: float,
        umur_jam: float,
        sumber: str,
        instrumen: str = "VIIRS",
        confidence: str = "h",
    ) -> dict[str, str]:
        waktu = datetime.now(timezone.utc) - timedelta(hours=umur_jam)
        kolom = {"latitude": str(lat), "longitude": str(lon)}
        # Nama kolom suhu berbeda antara VIIRS dan MODIS — persis seperti CSV FIRMS.
        kolom["bright_ti4" if instrumen == "VIIRS" else "brightness"] = "340.5" if instrumen == "VIIRS" else "312.67"
        return {
            **kolom,
            "acq_date": waktu.strftime("%Y-%m-%d"),
            "acq_time": waktu.strftime("%H%M"),
            "confidence": confidence,
            "instrument": instrumen,
            "satellite": sumber,
            "frp": "12.5",
        }

    def _baris(self, source: str) -> list[dict[str, str]]:
        if source in self.sunyi:
            return []
        if source == latest.PULL_SOURCES[0]:
            return [
                self._row(MERAUKE[0], MERAUKE[1], 1, "N20"),
                self._row(OCEAN[0], OCEAN[1], 2, "N20", confidence="n"),
                # Umur 30 jam: di luar jendela 24 jam, di dalam 48 jam.
                self._row(MERAUKE[0] + 0.01, MERAUKE[1] + 0.01, 30, "N20"),
            ]
        if source == latest.PULL_SOURCES[1]:
            return [self._row(MERAUKE[0] - 0.5, MERAUKE[1], 3, "N21", confidence="l")]
        return [
            self._row(MERAUKE[0] + 0.02, MERAUKE[1], 4, "Terra", instrumen="MODIS", confidence="48"),
        ]

    def area(self, source: str, start) -> list[dict[str, str]]:
        self.area_calls.append(source)
        if self.galat is not None:
            raise self.galat
        return self._baris(source)


@pytest.fixture(autouse=True)
def _isolasi(tmp_path, monkeypatch):
    """Cache bersih, snapshot di folder sementara, penarik palsu terpasang."""
    monkeypatch.setenv("GEOSAFE_SNAPSHOT_PATH", str(tmp_path / "snapshot.json"))
    monkeypatch.setattr(latest, "CACHE_TTL_SECONDS", 900)
    monkeypatch.setattr(latest, "RATE_LIMIT_PER_MINUTE", 60)
    monkeypatch.setattr(latest, "FAILURE_COOLDOWN_SECONDS", 60)
    latest.clear_cache()
    fetcher = StubFetcher()
    app.dependency_overrides[get_firms_fetcher] = lambda: fetcher
    yield fetcher
    app.dependency_overrides.clear()
    latest.clear_cache()


def _pasang(fetcher: StubFetcher) -> None:
    app.dependency_overrides[get_firms_fetcher] = lambda: fetcher


# ----------------------------------------------------------------- join & jendela


def test_latest_joins_points_to_regions_at_request_time() -> None:
    body = client.get(LATEST, params={"window": 24}).json()

    assert body["series"] == "nrt"
    assert body["window_hours"] == 24
    assert body["point_count"] == 4  # titik 30 jam belum masuk jendela 24 jam
    # Dua titik di luar poligon: satu di laut, satu di selatan pesisir Papua
    # (diperiksa ke basis data, bukan ditebak dari koordinat).
    assert body["points_outside_polygon"] == 2

    merauke = next(p for p in body["points"] if p["latitude"] == MERAUKE[0])
    assert merauke["region_code"] == MERAUKE[2]
    assert merauke["confidence_class"] == "high"
    assert merauke["brightness"] == 340.5
    assert merauke["observed_at"].endswith("Z")

    laut = next(p for p in body["points"] if p["region_code"] is None)
    assert laut["latitude"] == OCEAN[0]
    assert laut["confidence_class"] == "nominal"


def test_modis_row_uses_its_own_columns() -> None:
    """MODIS: suhu di `brightness`, `confidence` angka 0–100, instrumen MODIS."""
    body = client.get(LATEST, params={"window": 24}).json()
    modis = next(p for p in body["points"] if p["instrument"] == "MODIS")

    assert modis["satellite"] == "Terra"
    assert modis["confidence"] == "48"
    assert modis["confidence_class"] == "nominal"
    assert modis["brightness"] == 312.67


def test_latest_widens_with_the_window() -> None:
    assert client.get(LATEST, params={"window": 24}).json()["point_count"] == 4
    assert client.get(LATEST, params={"window": 48}).json()["point_count"] == 5
    assert client.get(LATEST, params={"window": 72}).json()["point_count"] == 5


def test_bbox_narrows_only_when_asked() -> None:
    sempit = client.get(LATEST, params={"window": 72, "bbox": BOX_MERAUKE}).json()

    assert sempit["point_count"] == 4  # titik laut (-5, 96) di luar kotak
    assert all(p["longitude"] > 139.5 for p in sempit["points"])
    # Satu titik di dalam kotak tetap di luar poligon (selatan pesisir Papua).
    assert sum(1 for p in sempit["points"] if p["region_code"] is None) == 1


def test_window_start_is_measured_from_fetched_at() -> None:
    """Kontrak bagian 1: `window_start` = `fetched_at` − jam jendela."""
    body = client.get(LATEST, params={"window": 24}).json()
    diambil = datetime.fromisoformat(body["fetched_at"].replace("Z", "+00:00"))
    mulai = datetime.fromisoformat(body["window_start"].replace("Z", "+00:00"))

    assert diambil - mulai == timedelta(hours=24)


def test_duplicate_rows_are_collapsed() -> None:
    fetcher = StubFetcher()
    asli = fetcher._baris

    def ganda(source: str):
        baris = asli(source)
        return baris + baris  # setiap baris dikirim dua kali

    fetcher._baris = ganda  # type: ignore[method-assign]
    _pasang(fetcher)

    assert client.get(LATEST, params={"window": 24}).json()["point_count"] == 4


# ------------------------------------------------------- ketersediaan & snapshot


def test_satellites_come_from_returned_rows() -> None:
    """Keputusan 9 #2: `available` dari baris yang benar-benar kembali."""
    _pasang(StubFetcher(sunyi=(latest.PULL_SOURCES[1],)))
    body = client.get(SUMMARY, params={"window": 24}).json()

    status = {s["name"]: s for s in body["satellites"]}
    assert set(status) == set(latest.REPORTED_SATELLITES)
    assert status[latest.PULL_SOURCES[0]]["available"] is True
    assert status[latest.PULL_SOURCES[1]]["available"] is False  # tidak ada baris
    assert status[latest.PULL_SOURCES[1]]["last_acq_date"] is None
    assert status[latest.PULL_SOURCES[0]]["last_acq_date"] is not None


def test_snapshot_holds_the_joined_result(_isolasi: StubFetcher, tmp_path) -> None:
    """Keputusan 9 #3: snapshot berisi hasil join, bentuknya seperti badan `/latest`."""
    client.get(LATEST, params={"window": 24})

    isi = json.loads((tmp_path / "snapshot.json").read_text(encoding="utf-8"))
    assert set(isi) == {"fetched_at", "window_hours", "satellites", "points"}
    assert isi["window_hours"] == 72
    assert any(p["region_code"] == MERAUKE[2] for p in isi["points"])
    # Tidak ada berkas sementara yang tertinggal dari penulisan atomik.
    assert not list(tmp_path.glob(".snapshot-*.tmp"))


def test_summary_drops_bbox_filtering_for_national_numbers() -> None:
    """`bbox` hanya menyaring `top_provinces`; angka nasional tetap."""
    nasional = client.get(SUMMARY, params={"window": 24}).json()
    barat = client.get(SUMMARY, params={"window": 24, "bbox": "105,-7,107,-6"}).json()

    assert barat["point_count"] == nasional["point_count"] == 4
    assert barat["top_provinces"] == []  # tidak ada titik di Jawa Barat


def test_latest_and_summary_share_one_generation(_isolasi: StubFetcher) -> None:
    terinci = client.get(LATEST, params={"window": 24}).json()
    ringkas = client.get(SUMMARY, params={"window": 24}).json()

    assert terinci["fetched_at"] == ringkas["fetched_at"]
    assert terinci["point_count"] == ringkas["point_count"]
    assert ringkas["regions_with_points"] == 1  # semua titik darat jatuh di 9301
    assert ringkas["points_outside_polygon"] == 2
    assert ringkas["top_provinces"][0]["province_name"]
    # Satu penyegaran = satu permintaan per satelit; permintaan kedua tanpa tarikan.
    assert _isolasi.area_calls == list(latest.PULL_SOURCES)


# ------------------------------------------------------------------- header


def test_headers_describe_cache_state(_isolasi: StubFetcher) -> None:
    pertama = client.get(LATEST, params={"window": 24})
    assert pertama.headers["X-Cache"] == "MISS"
    assert pertama.headers["X-Snapshot"] == "false"
    assert pertama.headers["Cache-Control"] == "public, max-age=60"
    assert pertama.headers["X-Fetched-At"] == pertama.json()["fetched_at"]

    kedua = client.get(LATEST, params={"window": 24})
    assert kedua.headers["X-Cache"] == "HIT"
    assert len(_isolasi.area_calls) == len(latest.PULL_SOURCES)  # tanpa tarikan baru


# ------------------------------------------------------------------- kesalahan


def test_recent_series_never_carries_archive_numbers() -> None:
    """`SRS-F-26`: tidak ada medan yang bisa dijumlahkan dengan arsip 2020–2026."""
    body = client.get(LATEST, params={"window": 24}).json()

    assert "hotspot_count" not in body
    assert all("hotspot_count" not in p for p in body["points"])
    assert body["series"] == "nrt"


@pytest.mark.parametrize("nilai", ["12", "abc", "24.0", ""])
def test_invalid_window_is_rejected_in_contract_shape(nilai: str) -> None:
    for jalur in (LATEST, SUMMARY):
        response = client.get(jalur, params={"window": nilai})

        assert response.status_code == 422
        assert response.json()["error"] == "invalid_parameter"


@pytest.mark.parametrize(
    "bbox",
    ["94.5,-11.5,141.5", "a,b,c,d", "141,6,94,-11", "80,-11,90,6"],
)
def test_invalid_bbox_is_rejected(bbox: str) -> None:
    response = client.get(LATEST, params={"window": 72, "bbox": bbox})

    assert response.status_code == 422
    assert response.json()["error"] == "invalid_parameter"


def test_oversized_answer_is_truncated_whole(monkeypatch) -> None:
    monkeypatch.setattr(latest, "MAX_RESPONSE_BYTES", 300)
    body = client.get(LATEST, params={"window": 24}).json()

    assert body["truncated"] is True
    assert body["points"] is None
    assert body["point_count"] == 4  # field lain tetap dikirim
    assert body["satellites"]


def test_fetch_failure_falls_back_to_snapshot(_isolasi: StubFetcher, monkeypatch, tmp_path) -> None:
    pertama = client.get(LATEST, params={"window": 24})
    assert pertama.headers["X-Snapshot"] == "false"
    assert (tmp_path / "snapshot.json").exists()

    monkeypatch.setattr(latest, "CACHE_TTL_SECONDS", 0)
    _isolasi.galat = UpstreamHttpError(429)
    kedua = client.get(LATEST, params={"window": 24})

    assert kedua.status_code == 200
    body = kedua.json()
    assert body["using_snapshot"] is True
    assert body["fetched_at"] == pertama.json()["fetched_at"]
    assert kedua.headers["X-Snapshot"] == "true"


def test_auth_failure_also_uses_the_snapshot(monkeypatch) -> None:
    _pasang(StubFetcher())
    client.get(LATEST, params={"window": 24})

    monkeypatch.setattr(latest, "CACHE_TTL_SECONDS", 0)
    _pasang(StubFetcher(galat=UpstreamAuthError("upstream_auth (401)")))
    response = client.get(LATEST, params={"window": 24})

    assert response.status_code == 200
    assert response.json()["using_snapshot"] is True


def test_fetch_failure_without_snapshot_answers_503_in_safe_shape() -> None:
    rahasia = "KUNCI-RAHASIA-JANGAN-BOCOR"
    _pasang(StubFetcher(galat=RuntimeError(f"gagal memuat https://firms/?key={rahasia}")))

    response = client.get(LATEST, params={"window": 24})
    isi = response.json()

    assert response.status_code == 503
    assert isi["error"] == "no_snapshot"
    # Pesannya menyebut JENIS galat, bukan pesan hulu yang membawa URL + kunci.
    assert rahasia not in response.text
    assert "RuntimeError" in isi["message"]


def test_repeated_requests_during_outage_do_not_hammer_upstream(_isolasi: StubFetcher, monkeypatch) -> None:
    """Setelah gagal, ada jeda 60 detik sebelum FIRMS disentuh lagi."""
    monkeypatch.setattr(latest, "CACHE_TTL_SECONDS", 0)
    _pasang(StubFetcher(galat=UpstreamHttpError(500)))

    assert client.get(LATEST, params={"window": 24}).status_code == 503
    panggilan_setelah_gagal = len(_isolasi.area_calls)
    assert client.get(LATEST, params={"window": 24}).status_code == 503

    assert len(_isolasi.area_calls) == panggilan_setelah_gagal  # tanpa percobaan baru


def test_snapshot_is_served_without_a_database(_isolasi: StubFetcher, monkeypatch) -> None:
    """Keputusan 9 #3: snapshot bisa disajikan saat basis data mati."""
    client.get(LATEST, params={"window": 24})  # tulis snapshot

    monkeypatch.setattr(latest, "CACHE_TTL_SECONDS", 0)
    _isolasi.galat = UpstreamHttpError(503)
    monkeypatch.setenv(
        "GEOSAFE_DATABASE_URL",
        "host=127.0.0.1 port=5999 dbname=tidak-ada user=tidak-ada connect_timeout=1",
    )

    response = client.get(LATEST, params={"window": 24})

    assert response.status_code == 200
    assert response.json()["using_snapshot"] is True
    assert response.json()["point_count"] == 4


def test_summary_without_a_database_still_reports_national_numbers(monkeypatch) -> None:
    client.get(SUMMARY, params={"window": 24})  # tulis snapshot lewat generasi pertama

    monkeypatch.setattr(latest, "CACHE_TTL_SECONDS", 0)
    _pasang(StubFetcher(galat=UpstreamHttpError(503)))
    monkeypatch.setenv(
        "GEOSAFE_DATABASE_URL",
        "host=127.0.0.1 port=5999 dbname=tidak-ada user=tidak-ada connect_timeout=1",
    )

    body = client.get(SUMMARY, params={"window": 24}).json()

    assert body["point_count"] == 4  # angka nasional tidak butuh basis data
    assert body["top_provinces"] == []  # daftar provinsi dilewati, bukan mengarang


def test_rate_limit_answers_429_with_retry_after(monkeypatch) -> None:
    monkeypatch.setattr(latest, "RATE_LIMIT_PER_MINUTE", 2)

    assert client.get(LATEST, params={"window": 24}).status_code == 200
    assert client.get(LATEST, params={"window": 24}).status_code == 200
    ketiga = client.get(LATEST, params={"window": 24})

    assert ketiga.status_code == 429
    assert ketiga.headers["Retry-After"] == "60"
    assert ketiga.json()["error"] == "rate_limited"


def test_invalid_parameter_does_not_consume_rate_limit(monkeypatch) -> None:
    """Validasi lebih dulu: masukan salah tidak menghabiskan kuota permintaan."""
    monkeypatch.setattr(latest, "RATE_LIMIT_PER_MINUTE", 1)

    assert client.get(LATEST, params={"window": 12}).status_code == 422
    assert client.get(LATEST, params={"window": 24}).status_code == 200


# --------------------------------------------------------------- fungsi murni


def test_confidence_class_normalises_both_scales() -> None:
    assert confidence_class("VIIRS", "h") == "high"
    assert confidence_class("VIIRS", "n") == "nominal"
    assert confidence_class("VIIRS", "l") == "low"
    assert confidence_class("MODIS", "29") == "low"
    assert confidence_class("MODIS", "30") == "nominal"
    assert confidence_class("MODIS", "79") == "nominal"
    assert confidence_class("MODIS", "80") == "high"
    assert confidence_class("MODIS", "100") == "high"
    # "tidak diketahui" bukan "keyakinan rendah"
    assert confidence_class("MODIS", "") is None
    assert confidence_class("VIIRS", None) is None
    assert confidence_class("VIIRS", "x") is None


def test_observed_at_pads_three_digit_time() -> None:
    waktu = observed_at({"acq_date": "2026-11-16", "acq_time": "416"})

    assert waktu is not None
    assert waktu.hour == 4
    assert waktu.minute == 16
    assert observed_at({"acq_date": "", "acq_time": "416"}) is None
