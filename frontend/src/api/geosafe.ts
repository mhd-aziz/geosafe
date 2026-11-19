/** Panggilan ke API GeoSafe, satu fungsi per endpoint yang dipakai antarmuka. */

import { API_BASE, fetchJson } from './client';
import type {
  CompositionData,
  CompositionMetric,
  DownloadsResponse,
  LatestResponse,
  LatestSummary,
  LatestWindow,
  MapLevel,
  PointCoverage,
  RankingData,
  RegionPanelData,
  RiskSchemeCode,
  RiskSchemesResponse,
  SearchResponse,
  SourcesResponse,
  TrendData,
  VillagePanelData,
  VillageProvincesResponse,
} from '../types/geosafe';

/** Templat URL tile MVT untuk MapLibre (placeholder `{z}`, `{x}`, `{y}`). */
export function tileUrlTemplate(level: MapLevel, year: number): string {
  const path = level === 'province' ? 'provinces' : 'regions';
  return `${API_BASE}/tiles/${path}/{z}/{x}/{y}.mvt?year=${year}`;
}

/** Nama layer di dalam MVT; berbeda per tingkat wilayah. */
export function tileSourceLayer(level: MapLevel): string {
  return level === 'province' ? 'provinces' : 'regions';
}

/** Templat URL tile kerawanan (`P4`). Skema bobot ikut di URL, bukan di klien. */
export function riskTileUrlTemplate(scheme: RiskSchemeCode): string {
  return `${API_BASE}/tiles/risk/{z}/{x}/{y}.mvt?scheme=${scheme}`;
}

export function fetchRiskSchemes(): Promise<RiskSchemesResponse> {
  return fetchJson<RiskSchemesResponse>('/api/v1/risk/schemes');
}

/** Templat URL tile kelas kerawanan desa (`P4`, `SRS-F-38`).
 *
 * Kode provinsi wajib: lapisan ini dimuat per provinsi, dan API menolak
 * permintaan tanpa `province` maupun pada zoom di bawah `min_zoom` (8).
 */
export function villageRiskTileUrlTemplate(provinceCode: string): string {
  return `${API_BASE}/tiles/risk/villages/{z}/{x}/{y}.mvt?province=${encodeURIComponent(provinceCode)}`;
}

/** Nama layer desa di dalam tile MVT (dibuat endpoint `P4`). */
export function villageTileSourceLayer(): string {
  return 'risk_villages';
}

export function fetchVillageProvinces(): Promise<VillageProvincesResponse> {
  return fetchJson<VillageProvincesResponse>('/api/v1/provinces');
}

export function fetchRegionPanel(regionCode: string): Promise<RegionPanelData> {
  return fetchJson<RegionPanelData>(`/api/v1/panel/kabupaten_kota/${regionCode}`);
}

/** Panel desa/kelurahan (`W4`). Kode BPS desa selalu sepuluh digit; API membalas
 * `422` untuk kode lain dan `404` untuk desa yang tidak ada. */
export function fetchVillagePanel(villageCode: string): Promise<VillagePanelData> {
  return fetchJson<VillagePanelData>(`/api/v1/panel/desa/${encodeURIComponent(villageCode)}`);
}

export function searchRegions(keyword: string): Promise<SearchResponse> {
  return fetchJson<SearchResponse>(
    `/api/v1/search/regions?q=${encodeURIComponent(keyword)}`,
  );
}

export function fetchSources(): Promise<SourcesResponse> {
  return fetchJson<SourcesResponse>('/api/v1/sources');
}

export function fetchPointCoverage(year?: number): Promise<PointCoverage> {
  const query = year === undefined ? '' : `?year=${year}`;
  return fetchJson<PointCoverage>(`/api/v1/point_coverage${query}`);
}

export function fetchDownloads(): Promise<DownloadsResponse> {
  return fetchJson<DownloadsResponse>('/api/v1/downloads');
}

/** URL unduhan langsung; berkasnya disajikan API dari folder data di luar repo. */
export function downloadFileUrl(fileName: string): string {
  return `${API_BASE}/api/v1/downloads/${encodeURIComponent(fileName)}`;
}

export function fetchNationalTrend(): Promise<TrendData> {
  return fetchJson<TrendData>('/api/v1/analysis/national_trend');
}

/** Komposisi wilayah (`A2`): sepuluh provinsi + sepuluh kabupaten/kota teratas. */
export function fetchComposition(year: number, metric: CompositionMetric): Promise<CompositionData> {
  return fetchJson<CompositionData>(
    `/api/v1/analysis/composition?year=${year}&metric=${metric}`,
  );
}

/** Peringkat seluruh kabupaten/kota (`A3`). Seluruh baris datang sekali;
 * pengurutan dan pencarian dilakukan di peramban atas data yang sama. */
export function fetchRanking(year: number): Promise<RankingData> {
  return fetchJson<RankingData>(`/api/v1/analysis/ranking?year=${year}`);
}

/** Titik panas terkini untuk lapisan peta (`P2`).
 *
 * `bbox` opsional (`min_lon,min_lat,max_lon,max_lat`) mempersempit titik yang
 * dikirim. Kontrak `API-P2.md` bagian 1 mewajibkan klien mengulang permintaan
 * dengan kotak yang lebih sempit saat balasan menyatakan `truncated` (`points`
 * bernilai `null` karena muatan melewati 2 MB); antarmuka melakukannya lewat
 * kendali "Batasi ke area tampak" yang mengirim kotak peta yang sedang tampil.
 */
export function fetchLatest(windowHours: LatestWindow, bbox: string | null = null): Promise<LatestResponse> {
  return fetchJson<LatestResponse>(`/api/v1/latest${latestQuery(windowHours, bbox)}`);
}

/** Ringkasan nasional terkini untuk panel `W1`.
 *
 * `bbox` hanya menyaring `top_provinces`; `point_count` tetap nasional
 * (`API-P2.md` bagian 2), jadi angka nasional di panel tidak berubah karena kotak peta.
 */
export function fetchLatestSummary(
  windowHours: LatestWindow,
  bbox: string | null = null,
): Promise<LatestSummary> {
  return fetchJson<LatestSummary>(`/api/v1/latest/summary${latestQuery(windowHours, bbox)}`);
}

/** Kueri bersama kedua endpoint `latest`: jendela jam wajib, `bbox` tidak. */
function latestQuery(windowHours: LatestWindow, bbox: string | null): string {
  const query = `?window=${windowHours}`;
  return bbox === null ? query : `${query}&bbox=${bbox}`;
}
