/** Panggilan ke API GeoSafe, satu fungsi per endpoint yang dipakai antarmuka. */

import { API_BASE, fetchJson } from './client';
import type {
  DownloadsResponse,
  LatestResponse,
  LatestSummary,
  LatestWindow,
  MapLevel,
  PointCoverage,
  RegionPanelData,
  RiskSchemeCode,
  RiskSchemesResponse,
  SearchResponse,
  SourcesResponse,
  TrendData,
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

export function fetchRegionPanel(regionCode: string): Promise<RegionPanelData> {
  return fetchJson<RegionPanelData>(`/api/v1/panel/kabupaten_kota/${regionCode}`);
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

/** Titik panas terkini untuk lapisan peta (`P2`).
 *
 * `bbox` tidak dikirim: antarmuka selalu menyajikan seluruh Indonesia dan tidak
 * punya kendali kotak wilayah. Bila balasan menyatakan `truncated` (`points`
 * bernilai `null` karena muatan melewati 2 MB), lapisan tidak menggambar titik dan
 * pengguna diberi tahu apa adanya — penyempitan `bbox` yang disebut kontrak
 * `API-P2.md` bagian 1 belum dikerjakan di antarmuka.
 */
export function fetchLatest(windowHours: LatestWindow): Promise<LatestResponse> {
  return fetchJson<LatestResponse>(`/api/v1/latest?window=${windowHours}`);
}

/** Ringkasan nasional terkini untuk panel `W1`. */
export function fetchLatestSummary(windowHours: LatestWindow): Promise<LatestSummary> {
  return fetchJson<LatestSummary>(`/api/v1/latest/summary?window=${windowHours}`);
}
