import { LIGHT, layers } from '@protomaps/basemaps';
import type { StyleSpecification } from 'maplibre-gl';

// Sumber basemap: satu berkas PMTiles 216 MB di luar repo, disajikan dari
// Cloudflare R2 (`geosafe-tiles.zisaltech.site`, tanpa biaya egress). Sejak
// 2026-11-19 mesin ini tidak lagi menyajikan frontend maupun `/pmtiles/`, jadi
// bawaannya menunjuk R2 agar `npm run dev` bekerja tanpa nginx; `VITE_BASEMAP_URL`
// tetap bisa menimpanya (mis. berkas lokal saat menguji basemap baru).
// Klien menariknya per rentang byte lewat protokol `pmtiles://`, yang didaftarkan
// di `MapView` — tanpa pendaftaran itu gaya gagal memuat sumber ini.
export const BASEMAP_SOURCE_ID = 'basemap';
export const BASEMAP_URL: string =
  import.meta.env.VITE_BASEMAP_URL ?? 'pmtiles://https://geosafe-tiles.zisaltech.site/indonesia.pmtiles';

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
