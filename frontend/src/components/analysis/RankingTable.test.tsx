import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { RankingRow } from '../../types/geosafe';
import { RankingTable } from './RankingTable';

function row(overrides: Partial<RankingRow> & Pick<RankingRow, 'region_code' | 'region_name'>): RankingRow {
  return {
    region_type: 'REGENCY',
    province_code: '93',
    province_name: 'Papua Selatan',
    hotspot_count: 0,
    hotspot_per_1000_km2: 0,
    event_count: 0,
    ...overrides,
  };
}

const ROWS: RankingRow[] = [
  row({ region_code: '9301', region_name: 'Merauke', hotspot_count: 22474, hotspot_per_1000_km2: 128.03, event_count: null }),
  row({ region_code: '1608', region_name: 'Ogan Komering Ilir', province_name: 'Sumatera Selatan', hotspot_count: 17867, hotspot_per_1000_km2: 41.2, event_count: 3 }),
  row({ region_code: '6112', region_name: 'Ketapang', province_name: 'Kalimantan Barat', hotspot_count: 7440, hotspot_per_1000_km2: 5.1, event_count: 1 }),
];

/** Nama wilayah pada kolom kedua, berurutan seperti yang tampil. */
function names(): string[] {
  const tabel = screen.getByRole('table');
  const rows = within(tabel).getAllByRole('row').slice(1);
  return rows.map((line) => within(line).getAllByRole('cell')[1].textContent ?? '');
}

describe('RankingTable', () => {
  it('mengurutkan menurun menurut titik panas sebagai urutan awal', () => {
    render(<RankingTable rows={ROWS} year={2023} />);

    expect(names()[0]).toContain('Merauke');
    expect(names()[1]).toContain('Ogan Komering Ilir');
  });

  it('bisa diurutkan menurut kepadatan (`SRS-F-54`)', () => {
    render(<RankingTable rows={ROWS} year={2023} />);

    fireEvent.click(screen.getByRole('button', { name: 'Kepadatan / 1.000 km²' }));

    expect(names()[0]).toContain('Merauke');
    expect(names()[2]).toContain('Ketapang');
  });

  it('menaruh nilai kosong di bawah, bukan dianggap nol', () => {
    // Merauke tanpa baris kejadian (`null`) harus berada di bawah nilai 1 dan 3,
    // sedangkan nol terukur tetap diurutkan seperti angka.
    render(<RankingTable rows={ROWS} year={2023} />);

    fireEvent.click(screen.getByRole('button', { name: 'Kejadian' }));

    expect(names()[0]).toContain('Ogan Komering Ilir');
    expect(names()[2]).toContain('Merauke');
  });

  it('menyaring baris menurut nama, provinsi, atau kode (`SRS-F-56`)', () => {
    render(<RankingTable rows={ROWS} year={2023} />);

    expect(screen.getByText('3 baris tampil')).toBeTruthy();

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'kalimantan' } });

    expect(names()).toHaveLength(1);
    expect(names()[0]).toContain('Ketapang');
  });

  it('menyebut jumlah wilayah yang sedang tampil', () => {
    render(<RankingTable rows={ROWS} year={2023} />);

    expect(screen.getByText('3 baris tampil')).toBeTruthy();
  });
});
