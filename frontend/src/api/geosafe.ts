/** Panggilan ke API GeoSafe, satu fungsi per endpoint yang dipakai antarmuka. */

import { API_BASE, fetchJson } from './client';
import type {
  MapLevel,
  RegionPanelData,
  SearchResponse,
  SourcesResponse,
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
