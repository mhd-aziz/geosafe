import { LIGHT, layers } from '@protomaps/basemaps';
import type { StyleSpecification } from 'maplibre-gl';

// Sumber basemap: satu berkas PMTiles 216 MB di luar repo. Bawaannya dilayani
// nginx pada `/pmtiles/` (`../planning-GeoSafe/data/basemap/indonesia.pmtiles`),
// tetapi pratinjau di Vercel tidak punya berkas itu — di sana alamatnya diisi
// lewat `VITE_BASEMAP_URL` (mis. `pmtiles://https://geosafe-tiles.zisaltech.site/pmtiles/indonesia.pmtiles`).
// Klien menariknya per rentang byte lewat protokol `pmtiles://`, yang didaftarkan
// di `MapView` — tanpa pendaftaran itu gaya gagal memuat sumber ini.
export const BASEMAP_SOURCE_ID = 'basemap';
export const BASEMAP_URL: string =
  import.meta.env.VITE_BASEMAP_URL ?? 'pmtiles:///pmtiles/indonesia.pmtiles';

// Layer teks dan ikon membutuhkan berkas font dan sprite; keduanya diambil dari
// aset publik Protomaps (tanpa kunci API). Tanpa keduanya, seluruh layer `symbol`
// gagal dimuat dan peta kehilangan semua nama tempat.
export const BASEMAP_GLYPHS =
  'https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf';
export const BASEMAP_SPRITE = 'https://protomaps.github.io/basemaps-assets/sprites/v4/light';

/**
 * Gaya dasar peta: latar, jalan, batas administrasi, dan nama tempat.
 *
 * Label diminta dalam Bahasa Indonesia (`lang: 'id'`) supaya nama tempat sejalan
 * dengan halaman lain. Layer tematik GeoSafe ditambahkan di atas gaya ini oleh
 * `MapView`, bukan di sini.
 */
export function basemapStyle(): StyleSpecification {
  return {
    version: 8,
    glyphs: BASEMAP_GLYPHS,
    sprite: BASEMAP_SPRITE,
    sources: {
      [BASEMAP_SOURCE_ID]: { type: 'vector', url: BASEMAP_URL },
    },
    layers: layers(BASEMAP_SOURCE_ID, LIGHT, { lang: 'id' }),
  };
}
