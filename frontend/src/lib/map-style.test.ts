import { describe, expect, it } from 'vitest';

import { BASEMAP_SOURCE_ID, BASEMAP_URL, basemapStyle } from './map-style';

// Yang diuji di sini bentuk gaya peta, bukan penggambarannya (itu hanya bisa
// dibuktikan di peramban sungguhan — lihat catatan di `frontend/README.md`).
describe('basemapStyle', () => {
  it('menyediakan satu sumber vektor PMTiles', () => {
    const style = basemapStyle();

    expect(style.version).toBe(8);
    expect(Object.keys(style.sources)).toEqual([BASEMAP_SOURCE_ID]);

    const source = style.sources[BASEMAP_SOURCE_ID];
    if (source.type !== 'vector') {
      throw new Error(`sumber basemap harus vektor, bukan ${source.type}`);
    }
    expect(source.url).toBe(BASEMAP_URL);
    expect(BASEMAP_URL.startsWith('pmtiles://')).toBe(true);
  });

  it('memuat seluruh layer basemap dengan layer latar paling bawah', () => {
    const style = basemapStyle();

    expect(style.layers.length).toBeGreaterThan(50);
    expect(style.layers[0].id).toBe('background');
    expect(style.layers[0].type).toBe('background');
  });

  it('memberi id unik pada setiap layer', () => {
    const ids = basemapStyle().layers.map((layer) => layer.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('meminta nama tempat berbahasa Indonesia pada layer teks', () => {
    const style = basemapStyle();
    const symbols = style.layers.filter((layer) => layer.type === 'symbol');
    const withIndonesianName = symbols.filter((layer) =>
      JSON.stringify(layer.layout?.['text-field'] ?? '').includes('name:id'),
    );

    expect(symbols.length).toBeGreaterThan(5);
    expect(withIndonesianName.length).toBeGreaterThan(0);
  });

  it('menyebut berkas font dan sprite supaya layer teks tidak gagal', () => {
    const style = basemapStyle();

    expect(style.glyphs).toContain('{fontstack}');
    expect(style.sprite).toContain('sprites/v4/light');
    // ikon POI memakai sprite; kalau sprite hilang, layer `symbol` gagal dimuat
    expect(JSON.stringify(style.layers)).toContain('icon-image');
  });

  it('tidak membawa sumber tematik: itu urusan MapView', () => {
    const style = basemapStyle();

    expect(Object.keys(style.sources)).not.toContain('hotspot');
  });
});
