import { useEffect, useState } from 'react';

/** Tunda nilai selama `delayMs` supaya ketikan tidak menembak API tiap huruf.
 *
 * `delayMs = 0` tetap lewat `setTimeout` supaya penjadwalannya bisa diuji.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
