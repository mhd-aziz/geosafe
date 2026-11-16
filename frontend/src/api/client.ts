/** Pembungkus `fetch` untuk seluruh panggilan API GeoSafe.
 *
 * Alamat API dikosongkan secara bawaan: pada pengembangan, Vite mem-proxy `/api`
 * dan `/tiles` ke FastAPI; pada penyajian nanti, nginx yang mem-proxy. Jadi tidak
 * ada alamat yang ditulis di kode maupun kunci rahasia di berkas frontend
 * (`SRS-C-01`).
 */

export const API_BASE = import.meta.env.VITE_API_BASE ?? '';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, init);

  if (!response.ok) {
    // Pesan galat dari FastAPI ada di medan `detail`; kalau bukan JSON, pakai
    // kode status saja supaya antarmuka tetap bisa menjelaskan apa yang gagal.
    let detail = `permintaan gagal (${response.status})`;
    try {
      const body = (await response.json()) as { detail?: string };
      if (body.detail) {
        detail = body.detail;
      }
    } catch {
      // balasan bukan JSON — biarkan pesan bawaan dipakai
    }
    throw new ApiError(detail, response.status);
  }

  return (await response.json()) as T;
}
