/** Tiga halaman peta, satu untuk setiap seri yang tidak boleh dicampur.
 *
 * Halaman dipisah karena peta titik panas, kejadian, dan kerawanan memakai
 * kendali, legenda, dan panel yang berbeda; menumpuk kelimanya di satu halaman
 * membuat tiga kartu kendali menutupi 36% permukaan peta (diukur 2026-11-23).
 * `P2` tetap menjadi lapisan titik di halaman titik panas, dan `P5` menjadi
 * tampilan titik di halaman kejadian, bukan halaman tersendiri.
 */
export type MapPageSlug = 'titik-panas' | 'kejadian' | 'kerawanan';

export interface MapPageConfig {
  slug: MapPageSlug;
  /** Label navigasi utama. */
  label: string;
  /** Judul untuk pembaca layar pada bagian peta. */
  title: string;
  /** Lapisan dasar halaman; tampilan di dalamnya menentukan `MapLayer` akhir. */
  base: 'hotspot' | 'events' | 'risk';
}

export const MAP_PAGES: MapPageConfig[] = [
  {
    slug: 'titik-panas',
    label: 'Peta titik panas',
    title: 'Peta sebaran titik panas',
    base: 'hotspot',
  },
  {
    slug: 'kejadian',
    label: 'Peta kejadian',
    title: 'Peta kejadian karhutla tercatat BNPB',
    base: 'events',
  },
  {
    slug: 'kerawanan',
    label: 'Peta kerawanan',
    title: 'Peta kelas kerawanan karhutla',
    base: 'risk',
  },
];

export const DEFAULT_MAP_PAGE: MapPageSlug = 'titik-panas';

export function mapPagePath(slug: MapPageSlug): string {
  return `/peta/${slug}`;
}

/** `null` = slug tidak dikenal; pemanggil mengalihkan ke halaman pertama. */
export function mapPageFromSlug(slug: string | undefined): MapPageConfig | null {
  return MAP_PAGES.find((page) => page.slug === slug) ?? null;
}
