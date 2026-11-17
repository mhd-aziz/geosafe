import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  fetchDownloads,
  fetchLatest,
  fetchLatestSummary,
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
    totals: { point_count: 0, placed_count: 0, outside_count: 0, outside_share_percent: null },
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

  it('memuat navigasi tiga halaman', async () => {
    fetchSourcesMock.mockResolvedValue({ count: 1, sources: [] });
    renderApp();

    const nav = screen.getByRole('navigation', { name: 'Navigasi halaman' });
    expect(nav.textContent).toContain('Peta');
    expect(nav.textContent).toContain('Tren nasional');
    expect(nav.textContent).toContain('Sumber & Batas Data');
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
    expect(screen.getByText(/tidak sebanding dan tidak digambar/)).toBeTruthy();
    expect(screen.getAllByText('nrt').length).toBeGreaterThan(0);
  });

  it('tetap menampilkan halaman saat keterangan sumber gagal dimuat', async () => {
    fetchSourcesMock.mockRejectedValue(new Error('permintaan gagal (500)'));
    renderApp();

    expect(await screen.findByText(/Keterangan sumber belum tersedia/)).toBeTruthy();
    expect(screen.getByTestId('map-stub')).toBeTruthy();
  });

  it('memuat lapisan kerawanan beserta skema dan uji sensitivitasnya', async () => {
    fetchSourcesMock.mockResolvedValue({ count: 1, sources: [] });
    renderApp();

    fireEvent.click(await screen.findByRole('button', { name: 'Kerawanan' }));

    // `SRS-F-33`: skema A tampil sebagai pilihan awal.
    expect(screen.getByRole('button', { name: 'A' }).getAttribute('aria-pressed')).toBe('true');
    // `SRS-F-34`: hasil uji sensitivitas ikut tampil, bukan hanya pilihan skema.
    expect(await screen.findByText(/Korelasi peringkat/)).toBeTruthy();
    expect(screen.getByText('0,9252')).toBeTruthy();
    // `SRS-F-37`: skor hanya ada di kabupaten/kota, jadi saklar provinsi dimatikan.
    expect(screen.getByRole('button', { name: 'Provinsi' }).hasAttribute('disabled')).toBe(true);
    // `SRS-F-35`/`SRS-F-36`: IRBI sejajar sebagai konteks, skor bukan angka resmi BNPB.
    // Kalimat itu muncul di dua tempat yang keduanya wajib (legenda dan panel),
    // jadi yang diperiksa jumlahnya, bukan satu simpul tertentu.
    expect(screen.getAllByText(/bukan angka resmi BNPB/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(/IRBI 2025 ditampilkan sejajar/).length).toBeGreaterThanOrEqual(1);
    // Lapisan kerawanan tidak bertahun: penyaring tahun nonaktif, bukan dibiarkan berlaku.
    expect(screen.getByLabelText('Tahun').hasAttribute('disabled')).toBe(true);
    // Alasan penonaktifan harus terbaca di teks layar, bukan hanya di `title`
    // (elemen nonaktif tidak dapat difokus pengguna keyboard).
    expect(screen.getByText(/ringkasan satu periode, jadi penyaring tahun tidak berlaku/)).toBeTruthy();
  });

  it('menyebut kegagalan keterangan skema alih-alih menulis "sedang dimuat"', async () => {
    fetchSourcesMock.mockResolvedValue({ count: 1, sources: [] });
    fetchRiskSchemesMock.mockRejectedValue(new Error('Failed to fetch'));
    renderApp();

    fireEvent.click(await screen.findByRole('button', { name: 'Kerawanan' }));

    // Satu layar tidak boleh memuat dua pesan yang saling bertentangan.
    expect(screen.getByText(/keterangan skema gagal dimuat/)).toBeTruthy();
    expect(screen.queryByText(/keterangan skema sedang dimuat/)).toBeNull();
    // Peta dan kendali tetap bisa dipakai; skema default tetap ditawarkan.
    expect(screen.getByRole('button', { name: 'A' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText(/Peta tetap memakai skema default/)).toBeTruthy();
  });

  it('memuat lapisan kerawanan desa beserta pemilih provinsi dan angka kelasnya', async () => {
    fetchSourcesMock.mockResolvedValue({ count: 1, sources: [] });
    renderApp();

    fireEvent.click(await screen.findByRole('button', { name: 'Kerawanan desa' }));

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
    // Kendali yang tidak berlaku dinonaktifkan, dan sebabnya terbaca di teks layar.
    expect(screen.getByLabelText('Tahun').hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('button', { name: 'Provinsi' }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByText(/dimuat satu provinsi pada satu waktu/)).toBeTruthy();
    expect(screen.getByText(/susunan penelitian ini, bukan angka resmi BNPB · satu provinsi/)).toBeTruthy();
  });

  it('memperbesar peta ke provinsi yang dipilih pada lapisan desa', async () => {
    fetchSourcesMock.mockResolvedValue({ count: 1, sources: [] });
    renderApp();

    fireEvent.click(await screen.findByRole('button', { name: 'Kerawanan desa' }));
    fireEvent.change(await screen.findByLabelText('Provinsi'), { target: { value: '33' } });

    // Peta diperbesar ke kotak wilayah provinsi itu sebelum tile diminta, karena
    // API hanya melayani lapisan desa pada zoom 8 ke atas.
    expect(screen.getByText(/Sedang ditampilkan:/)).toBeTruthy();
    expect(screen.getByText(/peta sudah diperbesar ke provinsi terpilih/)).toBeTruthy();
  });

  it('menyatakan kegagalan daftar provinsi, bukan menulis "sedang dimuat"', async () => {
    fetchSourcesMock.mockResolvedValue({ count: 1, sources: [] });
    fetchVillageProvincesMock.mockRejectedValue(new Error('Failed to fetch'));
    renderApp();

    fireEvent.click(await screen.findByRole('button', { name: 'Kerawanan desa' }));

    expect(screen.getByText(/daftar provinsi gagal dimuat/)).toBeTruthy();
    expect(screen.queryByText(/daftar provinsi sedang dimuat/)).toBeNull();
    expect(screen.getByLabelText('Provinsi').hasAttribute('disabled')).toBe(true);
    expect(screen.getByText(/Keterangan kerawanan desa gagal dimuat/)).toBeTruthy();
  });
});
