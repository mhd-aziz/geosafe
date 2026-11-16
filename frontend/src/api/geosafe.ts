/** Panggilan ke API GeoSafe, satu fungsi per endpoint yang dipakai antarmuka. */

import { API_BASE, fetchJson } from './client';
import type {
  DownloadsResponse,
  MapLevel,
  PointCoverage,
  RegionPanelData,
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
