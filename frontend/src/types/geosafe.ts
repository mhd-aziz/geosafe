/** Bentuk balasan API GeoSafe yang dipakai antarmuka.
 *
 * Nama medan sama persis dengan kolom basis data (aturan repo: kolom JSON identik
 * dengan kolom DB), jadi tipe di sini tidak boleh mengganti nama apa pun.
 */

export type MapLevel = 'regency' | 'province';

export type SearchLevel = 'province' | 'regency' | 'district' | 'village';

export type RegionType = 'REGENCY' | 'CITY';

export interface SearchResult {
  level: SearchLevel;
  code: string | null;
  name: string;
  region_type: RegionType | null;
  parent_code: string | null;
  parent_name: string | null;
  province_code: string | null;
  province_name: string | null;
  latitude: number | null;
  longitude: number | null;
  has_geometry: number;
  bbox: [number, number, number, number] | null;
}

export interface SearchResponse {
  query: string;
  limit: number;
  count: number;
  results: SearchResult[];
  notes: string[];
}

export interface HotspotSeriesRow {
  year: number;
  series: string;
  hotspot_count: number | null;
}

export interface EventSeriesRow {
  year: number;
  event_count: number | null;
}

export interface IrbiKarhutlaRow {
  year: number;
  irbi_karhutla_score: number | null;
  irbi_karhutla_class: string | null;
}

export interface RegionPanelData {
  region: {
    region_code: string;
    region_name: string;
    region_type: RegionType | null;
    province_code: string | null;
    province_name: string | null;
    area_km2: number | null;
  };
  hotspot_by_year: HotspotSeriesRow[];
  event_by_year: EventSeriesRow[];
  emergency_2025: {
    emergency_sk_karhutla_2025: number | null;
    emergency_sk_mentions_2025: number | null;
  };
  irbi_2025: {
    irbi_score: number | null;
    irbi_class: string | null;
  };
  irbi_karhutla_by_year: IrbiKarhutlaRow[];
  hotspot_per_1000_km2: number | null;
  notes: string[];
}

export interface DataSource {
  source_code: string;
  source_name: string;
  institution: string;
  source_url: string;
  accessed_on: string;
  data_until: string | null;
  row_count: number | null;
}

export interface SourcesResponse {
  count: number;
  sources: DataSource[];
}

/** `GET /api/v1/point_coverage` — penempatan titik panas ke wilayah. */
export interface PointCoverageYear {
  year: number;
  point_count: number;
  placed_count: number;
  outside_count: number;
  series: Record<string, number>;
}

export interface PointCoverage {
  year: number | null;
  totals: {
    point_count: number;
    placed_count: number;
    outside_count: number;
    outside_share_percent: number | null;
  };
  by_year: PointCoverageYear[];
  notes: string[];
}

/** `GET /api/v1/downloads` — tabel siap pakai di folder data. */
export interface DownloadFile {
  file_name: string;
  size_bytes: number;
}

export interface DownloadsResponse {
  count: number;
  folder: string;
  files: DownloadFile[];
  notes: string[];
}

/** `GET /api/v1/analysis/national_trend` — tren nasional dua seri. */
export interface TrendHotspotRow {
  year: number;
  series: Record<string, number>;
  archive_total: number | null;
  nrt: number | null;
}

export interface TrendData {
  scope: string;
  years: number[];
  hotspot_by_year: TrendHotspotRow[];
  event_by_year: { year: number; event_count: number | null }[];
  burned_area_by_year: { year: number; burned_area_ha: number | null }[];
  units: Record<string, string>;
  metric_names: Record<string, string>;
  notes: string[];
}

/** Wilayah yang dipilih dari peta atau dari hasil pencarian. */
export interface SelectedRegion {
  code: string;
  name: string;
  level: SearchLevel;
  bbox: [number, number, number, number] | null;
}
