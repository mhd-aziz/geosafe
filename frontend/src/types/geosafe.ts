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

/** Jendela waktu lapisan terkini yang sah (`SRS-F-21`); nilai lain ditolak API. */
export type LatestWindow = 24 | 48 | 72;

/** Kelas keyakinan hasil normalisasi dua skala (VIIRS huruf, MODIS 0–100). */
export type ConfidenceClass = 'low' | 'nominal' | 'high';

export interface LatestSatellite {
  name: string;
  available: boolean;
  /** Tanggal akuisisi terakhir yang pernah terlihat; `null` = belum pernah. */
  last_acq_date: string | null;
}

/** Satu titik panas terkini; `region_code` hasil join saat permintaan (`SRS-F-22`). */
export interface LatestPoint {
  latitude: number;
  longitude: number;
  observed_at: string;
  /** Nilai asal apa adanya: VIIRS `l/n/h`, MODIS `0`–`100`. */
  confidence: string | null;
  confidence_class: ConfidenceClass | null;
  satellite: string;
  instrument: string;
  brightness: number | null;
  frp: number | null;
  /** `null` = titik di luar poligon wilayah (laut/batas), bukan wilayah tak dikenal. */
  region_code: string | null;
}

/** Medan yang sama pada `/latest` dan `/latest/summary`.
 *
 * Tidak ada `hotspot_count` di sini dan itu disengaja (`SRS-F-26`): angka terkini
 * tidak boleh dijumlahkan dengan angka arsip 2020–2026.
 */
export interface LatestBase {
  fetched_at: string;
  window_hours: LatestWindow;
  window_start: string;
  series: 'nrt';
  using_snapshot: boolean;
  snapshot_age_seconds: number;
  point_count: number;
  points_outside_polygon: number;
  satellites: LatestSatellite[];
}

/** `GET /api/v1/latest` — titik terkini untuk peta (`P2`). */
export interface LatestResponse extends LatestBase {
  /** `true` = muatan melewati 2 MB, sehingga `points` diganti `null`. */
  truncated: boolean;
  points: LatestPoint[] | null;
}

/** `GET /api/v1/latest/summary` — ringkasan nasional untuk panel (`W1`). */
export interface LatestSummary extends LatestBase {
  regions_with_points: number;
  top_provinces: {
    province_code: string;
    province_name: string;
    point_count: number;
  }[];
}
