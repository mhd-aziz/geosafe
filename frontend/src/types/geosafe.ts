/** Bentuk balasan API GeoSafe yang dipakai antarmuka.
 *
 * Nama medan sama persis dengan kolom basis data (aturan repo: kolom JSON identik
 * dengan kolom DB), jadi tipe di sini tidak boleh mengganti nama apa pun.
 */

export type MapLevel = 'regency' | 'province';

/** Lapisan tematik yang bisa digambar di peta: jumlah titik panas, jumlah
 *  kejadian tercatat BNPB (choropleth), titik kejadian, kerawanan kabupaten/kota,
 *  atau kelas kerawanan desa/kelurahan. */
export type MapLayer = 'hotspot' | 'events' | 'event_points' | 'risk' | 'risk_village';

/** Tampilan di halaman Peta Kejadian: choropleth jumlah kejadian atau titik kejadian (`P5`). */
export type EventView = 'choropleth' | 'points';

/** Tampilan di halaman Peta Kerawanan: skor kabupaten/kota atau kelas desa. */
export type RiskView = 'regency' | 'village';

/** Skema bobot skor kerawanan (`P4`); nilainya ditentukan API. */
export type RiskSchemeCode = 'a' | 'b' | 'c';

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

/** Skor dan kelas kerawanan satu wilayah (`W2`), tiga skema bobot sekaligus.
 *
 * Nama medan sama dengan `metric_code` di basis data, dan barisnya **tidak
 * bertahun**: satu wilayah punya satu skor per skema. `default_scheme` adalah
 * skema yang dipakai lapisan peta sehingga panel dan peta tidak bisa berbeda.
 */
export interface RegionPanelRisk {
  default_scheme: RiskSchemeCode;
  risk_score_a: number | null;
  risk_class_a: string | null;
  risk_score_b: number | null;
  risk_class_b: string | null;
  risk_score_c: number | null;
  risk_class_c: string | null;
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
  risk: RegionPanelRisk;
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
  /** Kelas kepercayaan yang dipakai (`SRS-F-15`); kosong = seluruh kelas. */
  confidence?: ConfidenceCode | null;
  totals: {
    point_count: number;
    placed_count: number;
    outside_count: number;
    outside_share_percent: number | null;
    /** Rincian per seri, mis. `{main, fill}`; `nrt` tidak dimuat ke tabel ini. */
    series: Record<string, number>;
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

/** Cakupan satu tahun: sampai kapan datanya benar-benar terukur.
 *
 * Diturunkan API dari tanggal deteksi terakhir di `point_observations`, bukan dari
 * metadata sumber, sehingga `partial = true` berarti tahun itu belum setahun penuh
 * (2026 terukur sampai 31 Juli 2026 = 58,1%).
 */
export interface YearCoverage {
  first_observed_on: string | null;
  last_observed_on: string | null;
  days_covered: number;
  days_in_year: number;
  coverage_pct: number | null;
  partial: boolean;
}

/** Satu baris seri titik panas per tahun di `A1`. */
export interface TrendHotspotRow {
  year: number;
  series: Record<string, number>;
  archive_total: number | null;
  nrt: number | null;
}

/** `GET /api/v1/analysis/national_trend` — tren nasional dua seri. */
export interface TrendData {
  scope: string;
  years: number[];
  hotspot_by_year: TrendHotspotRow[];
  event_by_year: { year: number; event_count: number | null }[];
  burned_area_by_year: { year: number; burned_area_ha: number | null }[];
  /** Kunci = tahun sebagai teks, karena JSON memaksa kunci objek jadi string. */
  coverage_by_year: Record<string, YearCoverage>;
  units: Record<string, string>;
  metric_names: Record<string, string>;
  notes: string[];
}

/** Metrik yang boleh dipilih di komposisi wilayah (`SRS-F-51`). */
export type CompositionMetric = 'hotspot_count' | 'event_count';

export interface CompositionProvinceRow {
  province_code: string;
  province_name: string;
  value: number;
  share_pct: number | null;
}

export interface CompositionRegencyRow {
  region_code: string;
  region_name: string;
  province_name: string | null;
  value: number;
  share_pct: number | null;
}

/** `GET /api/v1/analysis/composition` — 10 provinsi + 10 kabupaten/kota teratas (`A2`).
 *
 * `total` adalah jumlah seluruh wilayah pada tingkat itu di tahun tersebut —
 * pembagi `share_pct`, bukan jumlah sepuluh baris yang dikirim.
 */
export interface CompositionData {
  year: number;
  metric: CompositionMetric;
  metric_name: string | null;
  unit: string | null;
  province: { total: number | null; rows: CompositionProvinceRow[] };
  regency: { total: number | null; rows: CompositionRegencyRow[] };
  coverage: YearCoverage;
  notes: string[];
}

/** Satu baris peringkat kabupaten/kota (`A3`). Nilai `null` = belum punya baris fakta. */
export interface RankingRow {
  region_code: string;
  region_name: string;
  region_type: string | null;
  province_code: string | null;
  province_name: string | null;
  hotspot_count: number | null;
  hotspot_per_1000_km2: number | null;
  event_count: number | null;
}

/** `GET /api/v1/analysis/ranking` — seluruh 514 kabupaten/kota (`A3`).
 *
 * Seluruh baris dikirim sekali (± 60 kB) dan diurutkan/dicari di peramban; itu
 * disengaja, jadi tidak ada parameter `sort` atau `q` di API.
 */
export interface RankingData {
  year: number;
  count: number;
  coverage: YearCoverage;
  regions: RankingRow[];
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

/** `GET /api/v1/risk/schemes` — skema bobot + uji sensitivitas (`P4`). */
export interface RiskScheme {
  scheme_code: RiskSchemeCode;
  scheme_name: string;
  /** Bobot 0–1 per indikator; `null` = indikator tidak ikut skema ini. */
  weights: { hotspot: number | null; event: number | null; irbi: number | null };
  includes_irbi: boolean;
  is_default: boolean;
}

export interface RiskSensitivityRow {
  scheme_a: RiskSchemeCode;
  scheme_b: RiskSchemeCode;
  /** Korelasi peringkat Spearman yang dihitung API dari baris skor. */
  spearman_rho: number | null;
  regions_class_changed: number;
  pct_class_changed: number | null;
  region_total: number;
}

export interface RiskSchemesResponse {
  default_scheme: RiskSchemeCode;
  schemes: RiskScheme[];
  sensitivity: RiskSensitivityRow[];
  region_total: number;
  regions_without_score: number;
  notes: string[];
}

/** `GET /api/v1/provinces` — bahan pemilih lapisan desa (`SRS-F-38`).
 *
 * `bbox` dipakai antarmuka untuk memperbesar peta ke seluruh provinsi sebelum
 * tile diminta, karena lapisan desa menolak zoom di bawah `min_zoom`.
 */
export interface VillageProvinceEntry {
  province_code: string;
  province_name: string;
  bbox: [number, number, number, number];
}

export interface VillageProvincesResponse {
  count: number;
  min_zoom: number;
  provinces: VillageProvinceEntry[];
  /** Jumlah desa per kelas apa adanya dari basis data (`rendah`, `sedang`, ...). */
  class_counts: Record<string, number>;
  village_total: number;
  /** Desa tanpa baris kelas: digambar abu-abu `has_score = 0`, bukan nol deteksi. */
  villages_without_class: number;
  /** Desa tanpa kode kecamatan induk: tidak masuk lapisan per provinsi. */
  villages_without_province: number;
  notes: string[];
}

/** Identitas kecamatan beserta rantai wilayah induknya (`SRS-F-63`). */
export interface DistrictPanelIdentity {
  district_code: string;
  district_name: string;
  region_code: string | null;
  region_name: string | null;
  province_code: string | null;
  province_name: string | null;
  area_km2: number | null;
}

/** `GET /api/v1/panel/kecamatan/{district_code}` — panel kecamatan (`W3`).
 *
 * Angka kecamatan hanya pendukung, bukan unit analisis (`SRS-F-64`);
 * `hotspot_by_year` memuat baris tahunan saja, bukan baris bulanan.
 */
export interface DistrictPanelData {
  district: DistrictPanelIdentity;
  hotspot_by_year: HotspotSeriesRow[];
  event_by_year: EventSeriesRow[];
  hotspot_per_1000_km2: number | null;
  notes: string[];
}

/** Identitas desa/kelurahan beserta rantai wilayah induknya (`SRS-F-65`). */
export interface VillagePanelIdentity {
  village_code: string;
  village_name: string;
  district_code: string | null;
  district_name: string | null;
  region_code: string | null;
  region_name: string | null;
  province_code: string | null;
  province_name: string | null;
  area_km2: number | null;
}

/** `GET /api/v1/panel/desa/{village_code}` — panel desa/kelurahan (`W4`).
 *
 * `risk_class_desa` adalah susunan penelitian ini, bukan kelas resmi BNPB
 * (`SRS-F-66`); `hotspot_by_year` hanya memuat baris tahunan, bukan bulanan.
 */
export interface VillagePanelData {
  village: VillagePanelIdentity;
  hotspot_by_year: HotspotSeriesRow[];
  event_by_year: EventSeriesRow[];
  risk_class_desa: string | null;
  hotspot_per_1000_km2: number | null;
  notes: string[];
}

/** Cara menggambar lapisan titik panas: poligon per wilayah atau heatmap titik. */
export type HotspotView = 'choropleth' | 'heatmap';

/** Kelas kepercayaan deteksi FIRMS untuk penyaring peta (`SRS-F-15`). */
export type ConfidenceCode = 'h' | 'n' | 'l';

/** Ketelitian koordinat kejadian (`SRS-F-41`): desa, pusat kecamatan, pusat kabupaten/kota. */
export type CoordLevel = 'village' | 'district' | 'region';

/** Satu kejadian karhutla berkoordinat (`P5`, `SRS-F-40`…`43`). */
export interface EventPoint {
  point_id: string;
  event_date: string | null;
  year: number;
  coord_level: CoordLevel | null;
  longitude: number;
  latitude: number;
  province_code: string | null;
  province_name: string | null;
  region_code: string | null;
  region_name: string | null;
  district_name: string | null;
  village_name: string | null;
  deaths: number | null;
  injured: number | null;
  houses_damaged: number | null;
  documentation_url: string | null;
}

/** `GET /api/v1/events/points?year=` — titik kejadian satu tahun (`P5`). */
export interface EventPointsResponse {
  year: number;
  count: number;
  coord_level_counts: Record<string, number>;
  points: EventPoint[];
  notes: string[];
}
