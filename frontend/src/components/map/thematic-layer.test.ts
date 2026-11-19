import { describe, expect, it } from 'vitest';

import { VILLAGE_MIN_ZOOM, readoutText, thematicSpec } from './thematic-layer';

/** Spesifikasi lapisan yang wajib ada; `null` berarti ujinya sendiri yang salah. */
function specOf(...args: Parameters<typeof thematicSpec>) {
  const spec = thematicSpec(...args);
  if (!spec) {
    throw new Error('lapisan ini seharusnya punya spesifikasi');
  }
  return spec;
}

describe('thematicSpec', () => {
  it('memisahkan layer titik panas dan kerawanan supaya tidak bertumpuk', () => {
    const hotspot = specOf('hotspot', 'regency', 2026, 'a');
    const risk = specOf('risk', 'regency', 2026, 'a');

    expect(hotspot.url).toBe('/tiles/regions/{z}/{x}/{y}.mvt?year=2026');
    expect(hotspot.sourceLayer).toBe('regions');
    expect(risk.url).toBe('/tiles/risk/{z}/{x}/{y}.mvt?scheme=a');
    expect(risk.sourceLayer).toBe('risk');

    // Semua nama sumber/layer berbeda: kalau sama, perpindahan lapisan bisa
    // meninggalkan poligon lama di bawah poligon baru tanpa galat apa pun.
    const ids = [hotspot, risk].flatMap((spec) => [spec.sourceId, spec.fillLayerId, spec.lineLayerId]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('membawa skema pada URL kerawanan dan tahun pada URL titik panas', () => {
    expect(specOf('risk', 'regency', 2026, 'c').url).toContain('scheme=c');
    expect(specOf('hotspot', 'province', 2021, 'a').url).toBe(
      '/tiles/provinces/{z}/{x}/{y}.mvt?year=2021',
    );
    expect(specOf('hotspot', 'province', 2021, 'a').sourceLayer).toBe('provinces');
  });

  it('memisahkan lapisan desa dari dua lapisan lain dan membawa zoom minimumnya', () => {
    const village = specOf('risk_village', 'regency', 2026, 'a', '33');
    const others = [specOf('hotspot', 'regency', 2026, 'a'), specOf('risk', 'regency', 2026, 'a')];

    expect(village.url).toBe('/tiles/risk/villages/{z}/{x}/{y}.mvt?province=33');
    expect(village.sourceLayer).toBe('risk_villages');
    // Zoom minimum ikut ke sumbernya: API menolak z di bawah 8, jadi MapLibre
    // tidak boleh meminta tile yang lebih rendah (`SRS-F-38`).
    expect(village.minzoom).toBe(VILLAGE_MIN_ZOOM);
    expect(village.minzoom).toBe(8);

    const ids = [village, ...others].flatMap((spec) => [
      spec.sourceId,
      spec.fillLayerId,
      spec.lineLayerId,
    ]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('belum memasang lapisan desa sebelum provinsi dipilih', () => {
    // Tanpa kode provinsi tidak ada tile yang sah: API membalas 422.
    expect(thematicSpec('risk_village', 'regency', 2026, 'a', null)).toBeNull();
    expect(thematicSpec('risk_village', 'regency', 2026, 'a')).toBeNull();
  });
});

describe('readoutText', () => {
  it('menampilkan skor dan kelas kerawanan, bukan hanya namanya', () => {
    const text = readoutText('risk', 'regency', 2026, {
      region_name: 'Kutai Timur',
      risk_score: 97.77,
      risk_class: 'tinggi',
      has_score: 1,
    });

    expect(text).toBe('Kutai Timur · skor 97,77 · Tinggi');
  });

  it('menyebut kelas yang tidak dikenal apa adanya', () => {
    expect(
      readoutText('risk', 'regency', 2026, {
        region_name: 'Contoh',
        risk_score: 50,
        risk_class: 'sangat tinggi',
        has_score: 1,
      }),
    ).toBe('Contoh · skor 50,00 · sangat tinggi');
  });

  it('membedakan wilayah tanpa skor dari kerawanan rendah', () => {
    expect(
      readoutText('risk', 'regency', 2026, { region_name: 'Contoh', has_score: 0 }),
    ).toBe('Contoh · skor kerawanan belum ada');
  });

  it('memakai nama provinsi dan menyebut tahun pada lapisan titik panas', () => {
    expect(
      readoutText('hotspot', 'province', 2023, {
        province_name: 'PAPUA SELATAN',
        hotspot_count: 1204,
        has_fact: 1,
      }),
    ).toBe('PAPUA SELATAN · 1.204 titik panas 2023');
  });

  it('menambahkan kepadatan per tahun di tingkat kabupaten/kota', () => {
    // Merauke 2023: 22.474 titik panas, 46.256,2 km² → 485,8 per 1.000 km².
    expect(
      readoutText('hotspot', 'regency', 2023, {
        region_name: 'Merauke',
        hotspot_count: 22474,
        hotspot_per_1000_km2: 485.85,
        has_fact: 1,
      }),
    ).toBe('Merauke · 22.474 titik panas 2023 · 485,85 per 1.000 km²');
  });

  it('tidak menampilkan kepadatan saat wilayah belum punya baris fakta', () => {
    expect(
      readoutText('hotspot', 'regency', 2020, {
        region_name: 'Contoh',
        hotspot_count: null,
        hotspot_per_1000_km2: null,
        has_fact: 0,
      }),
    ).toBe('Contoh · belum ada baris fakta 2020');
  });

  it('menyatakan wilayah tanpa baris fakta, bukan angka nol', () => {
    expect(
      readoutText('hotspot', 'regency', 2020, { region_name: 'Contoh', has_fact: 0 }),
    ).toBe('Contoh · belum ada baris fakta 2020');
  });

  it('menyebut desa beserta kecamatan induk dan kelasnya', () => {
    expect(
      readoutText('risk_village', 'regency', 2026, {
        village_name: 'Panulisan Barat',
        district_name: 'Dayeuhluhur',
        risk_class: 'tidak_ada_deteksi',
        has_score: 1,
      }),
    ).toBe('Panulisan Barat (Dayeuhluhur) · Tidak ada deteksi (bukan rendah)');
  });

  it('tidak menyebut desa tanpa kelas sebagai kerawanan rendah', () => {
    expect(
      readoutText('risk_village', 'regency', 2026, {
        village_name: 'Contoh',
        district_name: 'Contoh',
        has_score: 0,
      }),
    ).toBe('Contoh (Contoh) · kelas kerawanan belum ada');
  });
});

describe('lapisan kejadian (P3)', () => {
  it('memakai sumber sendiri dan membawa tahun pada URL-nya', () => {
    const events = specOf('events', 'regency', 2023, 'a');
    const hotspot = specOf('hotspot', 'regency', 2023, 'a');

    expect(events.url).toBe('/tiles/events/{z}/{x}/{y}.mvt?year=2023');
    expect(events.sourceLayer).toBe('events');
    // Nama sumber/layer tidak boleh sama dengan lapisan titik panas: kalau sama,
    // perpindahan lapisan bisa meninggalkan poligon lama tanpa galat apa pun.
    const ids = [events, hotspot].flatMap((spec) => [spec.sourceId, spec.fillLayerId]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('membaca jumlah kejadian tercatat, dan menyebut nol sebagai tidak tercatat', () => {
    expect(
      readoutText('events', 'regency', 2023, {
        region_name: 'Kota Banjarbaru',
        event_count: 79,
        has_fact: 1,
      }),
    ).toBe('Kota Banjarbaru · 79 kejadian tercatat BNPB 2023');

    // Di lapisan ini `has_fact = 0` berarti tidak ada kejadian tercatat, bukan
    // "angkanya belum dimuat" seperti pada lapisan titik panas.
    expect(
      readoutText('events', 'regency', 2023, { region_name: 'Contoh', has_fact: 0 }),
    ).toBe('Contoh · tidak ada kejadian tercatat 2023');
  });
});

describe('lapisan titik kejadian (P5)', () => {
  it('tidak memakai tile: sumbernya GeoJSON yang dipasang MapView sendiri', () => {
    expect(thematicSpec('event_points', 'regency', 2023, 'a')).toBeNull();
  });
});

describe('penyaring kepercayaan (SRS-F-15)', () => {
  it('membawa kelas kepercayaan pada URL tile kabupaten/kota saja', () => {
    expect(specOf('hotspot', 'regency', 2023, 'a', null, 'h').url).toBe(
      '/tiles/regions/{z}/{x}/{y}.mvt?year=2023&confidence=h',
    );
    // API menolak `?confidence=` di tile provinsi, jadi parameternya dibuang.
    expect(specOf('hotspot', 'province', 2023, 'a', null, 'h').url).toBe(
      '/tiles/provinces/{z}/{x}/{y}.mvt?year=2023',
    );
  });
});
