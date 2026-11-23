import { useEffect, useState } from 'react';

/** Apakah layar sedang sempit (`< 640 px`), mengikuti perubahan lebar.
 *
 * Dipakai untuk memilih tempat legenda: menempel di peta (layar sempit, bisa
 * dilipat) atau di kolom kanan (desktop). Satu komponen dirender di satu tempat
 * saja supaya teks legenda tidak muncul dua kali di DOM.
 */
export function useIsNarrow(query = '(max-width: 639px)'): boolean {
  const [narrow, setNarrow] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.(query).matches === true,
  );

  useEffect(() => {
    const media = window.matchMedia?.(query);
    if (!media) {
      return;
    }
    const onChange = (event: MediaQueryListEvent) => setNarrow(event.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [query]);

  return narrow;
}
