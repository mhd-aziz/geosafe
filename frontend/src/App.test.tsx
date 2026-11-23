import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  fetchDownloads,
  fetchEventPoints,
  fetchLatest,
  fetchLatestSummary,
  fetchNationalTrend,
  fetchPointCoverage,
  fetchRiskSchemes,
  fetchSources,
  fetchVillageProvinces,
} from './api/geosafe';
import { App } from './App';

// Peta butuh WebGL dan tile jaringan; yang diuji di sini tata letak halaman,
// navigasi, keterangan sumber, dan kendali tahun/tingkat — bukan penggambaran peta.
vi.mock('./components/map/MapView', () => ({
  MapView: () => <div data-testid="map-stub" />,
}));

vi.mock('./api/geosafe', () => ({
  fetchSources: vi.fn(),
  fetchRegionPanel: vi.fn(),
  searchRegions: vi.fn(),
  fetchPointCoverage: vi.fn(),
  fetchDownloads: vi.fn(),
  fetchNationalTrend: vi.fn(),
  fetchEventPoints: vi.fn(),
  fetchLatest: vi.fn(),
  fetchLatestSummary: vi.fn(),
  fetchRiskSchemes: vi.fn(),
  fetchVillageProvinces: vi.fn(),
  riskTileUrlTemplate: (scheme: string) => `/tiles/risk/{z}/{x}/{y}.mvt?scheme=${scheme}`,
  villageRiskTileUrlTemplate: (province: string) =>
    `/tiles/risk/villages/{z}/{x}/{y}.mvt?province=${province}`,
  downloadFileUrl: (name: string) => `/api/v1/downloads/${name}`,
}));

const fetchSourcesMock = vi.mocked(fetchSources);
const fetchPointCoverageMock = vi.mocked(fetchPointCoverage);
const fetchDownloadsMock = vi.mocked(fetchDownloads);
const fetchLatestMock = vi.mocked(fetchLatest);
const fetchLatestSummaryMock = vi.mocked(fetchLatestSummary);
const fetchRiskSchemesMock = vi.mocked(fetchRiskSchemes);
const fetchVillageProvincesMock = vi.mocked(fetchVillageProvinces);
const fetchNationalTrendMock = vi.mocked(fetchNationalTrend);
const fetchEventPointsMock = vi.mocked(fetchEventPoints);

/** Angka tampilan aktif (`SRS-F-16`) yang dipakai legenda lapisan titik panas. */
function mockCoverage() {
  fetchPointCoverageMock.mockResolvedValue({
    year: Number(new Date().getUTCFullYear()),
    confidence: null,
    totals: {
      point_count: 54084,
      placed_count: 54026,
      outside_count: 58,
      outside_share_percent: 0.11,
      series: { main: 54084 },
    },
    by_year: [],
    notes: [],
  });
}

/** Lapisan titik kejadian (`P5`) meminta daftar titik satu tahun saat aktif. */
function mockEventPoints() {
  fetchEventPointsMock.mockResolvedValue({
    year: 2026,
    count: 1110,
    coord_level_counts: { village: 200, district: 300, region: 610 },
    points: [],
    notes: ['titik pada peta ini adalah kejadian tercatat BNPB, bukan deteksi satelit'],
  });
}

/** Halaman peta memakai seri nasional sebagai pembanding lapisan kejadian. */
function mockNationalTrend() {
  fetchNationalTrendMock.mockResolvedValue({
    scope: 'national',
    years: [2023],
    hotspot_by_year: [],
    event_by_year: [
      { year: 2023, event_count: 2153 },
      { year: 2026, event_count: 1110 },
    ],
    burned_area_by_year: [],
    coverage_by_year: {},
    units: {},
    metric_names: {},
    notes: [],
  });
}

/** Halaman peta menarik lapisan terkini saat dibuka; angkanya cukup satu titik. */
function mockLatest() {
  fetchLatestMock.mockResolvedValue({
    fetched_at: '2026-11-17T06:20:11Z',
    window_hours: 72,
    window_start: '2026-11-14T06:20:11Z',
    series: 'nrt',
    using_snapshot: false,
    snapshot_age_seconds: 0,
    point_count: 4425,
    points_outside_polygon: 354,
    truncated: false,
    satellites: [{ name: 'MODIS_NRT', available: true, last_acq_date: '2026-11-16' }],
    points: [],
  });
  fetchLatestSummaryMock.mockResolvedValue({
    fetched_at: '2026-11-17T06:20:11Z',
    window_hours: 72,
    window_start: '2026-11-14T06:20:11Z',
    series: 'nrt',
    using_snapshot: false,
    snapshot_age_seconds: 0,
    point_count: 4425,
    points_outside_polygon: 354,
    regions_with_points: 231,
    satellites: [{ name: 'MODIS_NRT', available: true, last_acq_date: '2026-11-16' }],
    top_provinces: [
      { province_code: '94', province_name: 'PAPUA SELATAN', point_count: 193 },
    ],
  });
}

/** Skema kerawanan: halaman peta memintanya saat dibuka. */
function mockRiskSchemes() {
  fetchRiskSchemesMock.mockResolvedValue({
    default_scheme: 'a',
    schemes: [
      {
        scheme_code: 'a',
        scheme_name: 'titik panas 50% + kejadian 50%',
        weights: { hotspot: 0.5, event: 0.5, irbi: null },
        includes_irbi: false,
        is_default: true,
      },
      {
        scheme_code: 'b',
        scheme_name: 'titik panas 50% + kejadian 30% + IRBI 20%',
        weights: { hotspot: 0.5, event: 0.3, irbi: 0.2 },
        includes_irbi: true,
        is_default: false,
      },
      {
        scheme_code: 'c',
        scheme_name: 'titik panas 40% + kejadian 40% + IRBI 20%',
        weights: { hotspot: 0.4, event: 0.4, irbi: 0.2 },
        includes_irbi: true,
        is_default: false,
      },
    ],
    sensitivity: [
      {
        scheme_a: 'a',
        scheme_b: 'b',
        spearman_rho: 0.9252,
        regions_class_changed: 106,
        pct_class_changed: 20.6,
        region_total: 514,
      },
      {
        scheme_a: 'a',
        scheme_b: 'c',
        spearman_rho: 0.959,
        regions_class_changed: 75,
        pct_class_changed: 14.6,
        region_total: 514,
      },
      {
        scheme_a: 'b',
        scheme_b: 'c',
        spearman_rho: 0.9823,
        regions_class_changed: 53,
        pct_class_changed: 10.3,
        region_total: 514,
      },
    ],
    region_total: 514,
    regions_without_score: 0,
    notes: [
      'skor kerawanan adalah susunan penelitian ini, bukan angka resmi BNPB',
      'skor kerawanan hanya dihitung untuk kabupaten/kota (514 wilayah)',
    ],
  });
}

/** Daftar provinsi + sebaran kelas desa: halaman peta memintanya saat dibuka. */
function mockVillageProvinces() {
  fetchVillageProvincesMock.mockResolvedValue({
    count: 2,
    min_zoom: 8,
    provinces: [
      {
        province_code: '33',
        province_name: 'Jawa Tengah',
        bbox: [108.56, -8.21, 111.69, -5.73],
      },
      {
        province_code: '35',
        province_name: 'Jawa Timur',
        bbox: [110.9, -8.78, 116.27, -5.04],
      },
    ],
    class_counts: {
      rendah: 8_881,
      sedang: 24_293,
      tinggi: 6_388,
      tidak_ada_deteksi: 43_753,
    },
    village_total: 83_530,
    villages_without_class: 215,
    villages_without_province: 812,
    notes: [
      'kelas kerawanan desa adalah susunan penelitian ini, bukan kelas resmi BNPB',
      'kelas tidak_ada_deteksi berarti tidak ada satu pun deteksi titik panas',
    ],
  });
}

beforeEach(() => {
  mockLatest();
  mockRiskSchemes();
  mockVillageProvinces();
  mockNationalTrend();
  mockEventPoints();
  mockCoverage();
});

function renderApp(path = '/') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

function mockEmptyTransparency() {
  fetchPointCoverageMock.mockResolvedValue({
    year: null,
    totals: {
      point_count: 0,
      placed_count: 0,
      outside_count: 0,
      outside_share_percent: null,
      series: {},
    },
    by_year: [],
    notes: [],
  });
  fetchDownloadsMock.mockResolvedValue({ count: 0, folder: 'tabel', files: [], notes: [] });
}

describe('App', () => {
  it('menampilkan judul, peta, dan penyaring tahun', async () => {
    fetchSourcesMock.mockResolvedValue({ count: 1, sources: [] });
    renderApp();

    expect(screen.getByRole('heading', { name: /Peta Titik Panas Karhutla/ })).toBeTruthy();
    expect(screen.getByTestId('map-stub')).toBeTruthy();
    expect(screen.getByLabelText('Tahun')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Kabupaten/Kota' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Provinsi' })).toBeTruthy();
    expect(screen.getByLabelText('Cari wilayah')).toBeTruthy();
    // prinsip yang tidak boleh hilang dari halaman: titik panas bukan kebakaran
    expect(screen.getByText(/Titik panas bukan kebakaran/)).toBeTruthy();
  });

  it('memuat lapisan titik terkini beserta kendali jendela dan ringkasannya', async () => {
    fetchSourcesMock.mockResolvedValue({ count: 1, sources: [] });
    renderApp();

    expect(await screen.findByText(/Titik panas terkini/)).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Jendela' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '72 jam' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('heading', { name: 'Ringkasan nasional titik panas' })).toBeTruthy();
    expect(screen.getByText('231')).toBeTruthy();
  });

  it('menyembunyikan overlay titik terkini saat kotak centang dimatikan', async () => {
    fetchSourcesMock.mockResolvedValue({ count: 1, sources: [] });
    renderApp();

    const toggle = await screen.findByLabelText('Tampilkan titik terkini');
    expect(toggle).toHaveProperty('checked', true);
    expect(screen.getByText('Titik panas terkini')).toBeTruthy();

    fireEvent.click(toggle);

    // Kendali jendela ikut hilang karena tidak ada titik yang digambar; panel
    // ringkasan nasional tetap ada karena itu `W1`, bukan overlay peta.
    expect(screen.queryByText('Titik panas terkini')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Ringkasan nasional titik panas' })).toBeTruthy();
  });

  it('mengalihkan alamat peta yang tidak dikenal ke halaman titik panas', async () => {
    fetchSourcesMock.mockResolvedValue({ count: 1, sources: [] });
    renderApp('/peta/tidak-ada');

    expect(await screen.findByLabelText('Tahun')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Heatmap' })).toBeTruthy();
  });

  it('memuat navigasi enam halaman, termasuk tiga peta terpisah', async () => {
    fetchSourcesMock.mockResolvedValue({ count: 1, sources: [] });
    renderApp();

    const nav = screen.getByRole('navigation', { name: 'Navigasi halaman' });
    for (const label of [
      'Peta titik panas',
      'Peta kejadian',
      'Peta kerawanan',
      'Tren nasional',
      'Analisis wilayah',
      'Sumber & Batas Data',
    ]) {
      expect(nav.textContent).toContain(label);
    }
    expect(nav.querySelectorAll('a')).toHaveLength(6);
  });

  it('memuat halaman Sumber & Batas Data lewat rute /sumber', async () => {
    fetchSourcesMock.mockResolvedValue({ count: 1, sources: [] });
    mockEmptyTransparency();
    renderApp('/sumber');

    expect(await screen.findByRole('heading', { name: 'Sumber & Batas Data' })).toBeTruthy();
    // tujuh celah data wajib tampil, bukan hanya di laporan
    expect(screen.getByText(/Korban dan kerusakan karhutla praktis kosong/)).toBeTruthy();
    expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(7);
  });

  it('menyebut halaman tidak dikenal alih-alih halaman kosong', async () => {
    fetchSourcesMock.mockResolvedValue({ count: 1, sources: [] });
    renderApp('/tidak-ada');

    expect(await screen.findByText(/Halaman tidak ditemukan/)).toBeTruthy();
  });

  it('menyebut sumber titik panas dan tanggal pembaruan datanya', async () => {
    fetchSourcesMock.mockResolvedValue({
      count: 1,
      sources: [
        {
          source_code: 'FIRMS',
          source_name: 'Titik panas VIIRS/MODIS (arsip + NRT)',
          institution: 'NASA FIRMS',
          source_url: 'https://firms.modaps.eosdis.nasa.gov/',
          accessed_on: '2026-11-16',
          data_until: '2026-11-15',
          row_count: 1452263,
        },
      ],
    });
    renderApp();

    expect(await screen.findByText(/Titik panas VIIRS\/MODIS/)).toBeTruthy();
    expect(screen.getByText(/Data sampai 2026-11-15, diakses 2026-11-16/)).toBeTruthy();
    expect(screen.getByText(/tidak sebanding dan tidak pernah dijumlahkan/)).toBeTruthy();
    expect(screen.getAllByText('nrt').length).toBeGreaterThan(0);
  });

  it('tetap menampilkan halaman saat keterangan sumber gagal dimuat', async () => {
    fetchSourcesMock.mockRejectedValue(new Error('permintaan gagal (500)'));
    renderApp();

    expect(await screen.findByText(/Keterangan sumber belum tersedia/)).toBeTruthy();
    expect(screen.getByTestId('map-stub')).toBeTruthy();
  });

  it('menyediakan penyaring kepercayaan di lapisan titik panas (`SRS-F-15`)', async () => {
    fetchSourcesMock.mockResolvedValue({ count: 1, sources: [] });
    renderApp();

    const control = await screen.findByTestId('confidence-control');
    expect(control).toBeTruthy();
    for (const label of ['Semua', 'h', 'n', 'l']) {
      expect(screen.getByRole('button', { name: label })).toBeTruthy();
    }
    // `SRS-F-16`: angka tampilan aktif beserta yang di luar poligon. Kalimatnya
    // memuat `<code>main</code>`, jadi dibaca dari `textContent` legenda — bukan
    // `getByText`, yang hanya melihat simpul teks langsung.
    expect(await screen.findByText(/Tampilan aktif/)).toBeTruthy();
    const legendText = document.body.textContent ?? '';
    // Angka pertama = `point_count`, bukan `series.main`: `placed`/`outside`
    // dihitung atas seluruh seri, jadi menuliskan seri main saja membuat
    // aritmetikanya tidak berjumlah (ketahuan saat diperiksa di peramban).
    expect(legendText).toContain('54.084 titik (main 54.084)');
    expect(legendText).toContain('58 di luar (tidak dihitung nol)');
  });

  it('menyediakan mode heatmap untuk lapisan titik panas (`SRS-F-14`)', async () => {
    fetchSourcesMock.mockResolvedValue({ count: 1, sources: [] });
    renderApp();

    fireEvent.click(await screen.findByRole('button', { name: 'Heatmap' }));

    expect(await screen.findByText('Kepadatan titik panas (heatmap)')).toBeTruthy();
    // Tanpa kelas angka, dan sebabnya dinyatakan — bukan legenda kosong.
    expect(screen.getAllByText(/legenda ini tidak memakai kelas angka/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/baru menggambar mulai zoom 4/).length).toBeGreaterThan(0);
  });

  it('memuat halaman kejadian tercatat BNPB beserta angka nasionalnya', async () => {
    fetchSourcesMock.mockResolvedValue({ count: 1, sources: [] });
    renderApp('/peta/kejadian');

    // `SRS-F-30`: peta ini adalah kejadian tercatat BNPB, bukan deteksi satelit.
    expect(screen.getAllByText(/kejadian tercatat BNPB/).length).toBeGreaterThanOrEqual(2);
    // `SRS-F-31`: angka nasional tahun terpilih tampil sebagai pembanding.
    expect(await screen.findByText('Kejadian nasional 2026')).toBeTruthy();
    expect(screen.getByText('1.110')).toBeTruthy();
    // `SRS-F-28`: kejadian dipetakan per kabupaten/kota, jadi kendali tingkat
    // provinsi tidak ada di halaman ini — bukan dinonaktifkan.
    expect(screen.queryByRole('button', { name: 'Provinsi' })).toBeNull();
    // Tahun tetap berlaku di halaman ini (`SRS-F-29`).
    expect(screen.getByLabelText('Tahun').hasAttribute('disabled')).toBe(false);
  });

  it('memuat tampilan titik kejadian beserta sebaran ketelitian koordinatnya', async () => {
    fetchSourcesMock.mockResolvedValue({ count: 1, sources: [] });
    renderApp('/peta/kejadian');

    fireEvent.click(await screen.findByRole('button', { name: 'Titik kejadian' }));

    // `SRS-F-41`: sebaran ketelitian koordinat wajib terbaca, bukan hanya peta.
    expect(await screen.findByText('Titik kejadian 2026')).toBeTruthy();
    expect(screen.getByText('1.110')).toBeTruthy();
    expect(screen.getByText(/Desa\/kelurahan \(teliti\): 200/)).toBeTruthy();
    // Legenda lapisan titik, bukan legenda titik panas.
    expect(screen.getByText('Titik kejadian menurut ketelitian koordinat')).toBeTruthy();
    // Tahun tetap berlaku (`SRS-F-43`), tingkat provinsi tidak ada (`SRS-F-40`).
    expect(screen.getByLabelText('Tahun').hasAttribute('disabled')).toBe(false);
    expect(screen.queryByRole('button', { name: 'Provinsi' })).toBeNull();
  });

  it('memuat halaman kerawanan beserta skema dan uji sensitivitasnya', async () => {
    fetchSourcesMock.mockResolvedValue({ count: 1, sources: [] });
    renderApp('/peta/kerawanan');

    // `SRS-F-33`: skema A tampil sebagai pilihan awal.
    expect(screen.getByRole('button', { name: 'A' }).getAttribute('aria-pressed')).toBe('true');
    // `SRS-F-34`: hasil uji sensitivitas ikut tampil, bukan hanya pilihan skema.
    expect(await screen.findByText(/Korelasi peringkat/)).toBeTruthy();
    expect(screen.getByText('0,9252')).toBeTruthy();
    // `SRS-F-37`: skor hanya ada di kabupaten/kota, jadi kendali tingkat provinsi
    // tidak ada di halaman ini.
    expect(screen.queryByRole('button', { name: 'Provinsi' })).toBeNull();
    // `SRS-F-35`/`SRS-F-36`: IRBI sejajar sebagai konteks, skor bukan angka resmi BNPB.
    // Kalimat itu muncul di dua tempat yang keduanya wajib (legenda dan panel),
    // jadi yang diperiksa jumlahnya, bukan satu simpul tertentu.
    expect(screen.getAllByText(/bukan angka resmi BNPB/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(/IRBI 2025 ditampilkan sejajar/).length).toBeGreaterThanOrEqual(1);
    // Lapisan kerawanan tidak bertahun: penyaring tahun tidak ada di halaman ini.
    expect(screen.queryByLabelText('Tahun')).toBeNull();
    // Alasan ketiadaan kendali harus terbaca di teks layar, bukan hanya di `title`.
    expect(screen.getByText(/ringkasan satu periode, jadi penyaring tahun tidak berlaku/)).toBeTruthy();
  });

  it('menyebut kegagalan keterangan skema alih-alih menulis "sedang dimuat"', async () => {
    fetchSourcesMock.mockResolvedValue({ count: 1, sources: [] });
    fetchRiskSchemesMock.mockRejectedValue(new Error('Failed to fetch'));
    renderApp('/peta/kerawanan');

    // Satu layar tidak boleh memuat dua pesan yang saling bertentangan.
    expect(await screen.findByText(/keterangan skema gagal dimuat/)).toBeTruthy();
    expect(screen.queryByText(/keterangan skema sedang dimuat/)).toBeNull();
    // Peta dan kendali tetap bisa dipakai; skema default tetap ditawarkan.
    expect(screen.getByRole('button', { name: 'A' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText(/Peta tetap memakai skema default/)).toBeTruthy();
  });

  it('memuat kelas kerawanan desa beserta pemilih provinsi dan angka kelasnya', async () => {
    fetchSourcesMock.mockResolvedValue({ count: 1, sources: [] });
    renderApp('/peta/kerawanan');

    fireEvent.click(await screen.findByRole('button', { name: 'Desa/kelurahan' }));

    // `SRS-F-38`: lapisan ini dimuat per provinsi, jadi provinsinya harus dipilih.
    const select = await screen.findByLabelText('Provinsi');
    expect(select).toBeTruthy();
    expect(select.textContent).toContain('Jawa Tengah');
    expect(select.textContent).toContain('Jawa Timur');
    // Sebelum dipilih, panelnya menyatakan lapisan belum digambar.
    expect(screen.getByText(/Belum ada provinsi terpilih, jadi lapisan belum digambar/)).toBeTruthy();

    // `SRS-F-39`: kelas tanpa deteksi tidak boleh dibaca sebagai kerawanan rendah.
    expect(screen.getAllByText(/Tidak ada deteksi \(bukan rendah\)/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/bukan kerawanan rendah: nol titik panas bisa berarti/)).toBeTruthy();
    // Angka dari API ikut tampil sebagai kelas, bukan hanya nama kelas.
    expect(screen.getByText('43.753')).toBeTruthy();
    expect(screen.getByText('812 desa')).toBeTruthy();
    // Kendali yang tidak berlaku tidak ada di halaman ini, dan sebabnya terbaca.
    expect(screen.queryByLabelText('Tahun')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Provinsi' })).toBeNull();
    expect(screen.getByText(/dimuat satu provinsi pada satu waktu/)).toBeTruthy();
    expect(screen.getByText(/susunan penelitian ini, bukan angka resmi BNPB · satu provinsi/)).toBeTruthy();
  });

  it('memperbesar peta ke provinsi yang dipilih pada tampilan kelas desa', async () => {
    fetchSourcesMock.mockResolvedValue({ count: 1, sources: [] });
    renderApp('/peta/kerawanan');

    fireEvent.click(await screen.findByRole('button', { name: 'Desa/kelurahan' }));
    fireEvent.change(await screen.findByLabelText('Provinsi'), { target: { value: '33' } });

    // Peta diperbesar ke kotak wilayah provinsi itu sebelum tile diminta, karena
    // API hanya melayani lapisan desa pada zoom 8 ke atas.
    expect(screen.getByText(/Sedang ditampilkan:/)).toBeTruthy();
    expect(screen.getByText(/peta sudah diperbesar ke provinsi terpilih/)).toBeTruthy();
  });

  it('menyatakan kegagalan daftar provinsi, bukan menulis "sedang dimuat"', async () => {
    fetchSourcesMock.mockResolvedValue({ count: 1, sources: [] });
    fetchVillageProvincesMock.mockRejectedValue(new Error('Failed to fetch'));
    renderApp('/peta/kerawanan');

    fireEvent.click(await screen.findByRole('button', { name: 'Desa/kelurahan' }));

    expect(await screen.findByText(/daftar provinsi gagal dimuat/)).toBeTruthy();
    expect(screen.queryByText(/daftar provinsi sedang dimuat/)).toBeNull();
    expect(screen.getByLabelText('Provinsi').hasAttribute('disabled')).toBe(true);
    expect(screen.getByText(/Keterangan kerawanan desa gagal dimuat/)).toBeTruthy();
  });
});
