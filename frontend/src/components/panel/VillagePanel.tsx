import type { RemoteState } from '../../hooks/useRemoteData';
import { formatCount } from '../../lib/format';
import { NO_VILLAGE_CLASS_LABEL, VILLAGE_RISK_CLASSES } from '../../lib/risk';
import type { VillageProvincesResponse } from '../../types/geosafe';
import { DataNotes } from '../common/DataNotes';

export interface VillagePanelProps {
  state: RemoteState<VillageProvincesResponse>;
  /** Provinsi yang sedang dipilih; `null` = lapisan belum digambar. */
  provinceCode: string | null;
}

/** Panel keterangan lapisan kelas kerawanan desa/kelurahan (`P4`, `SRS-F-38`/`F-39`).
 *
 * Angka di panel ini datang dari `/api/v1/provinces`: sebaran kelas seluruh
 * Indonesia dan dua celah datanya. Dua hal yang tidak boleh hilang dari sini:
 * kelas kerawanan desa adalah susunan penelitian ini (tidak ada kelas resmi
 * karhutla untuk desa, `SRS-F-66`), dan `tidak_ada_deteksi` bukan kerawanan
 * rendah (`SRS-F-39`).
 */
export function VillagePanel({ state, provinceCode }: VillagePanelProps) {
  if (state.status === 'loading' && !state.data) {
    return (
      <p role="status" aria-live="polite" className="text-sm text-slate-600">
        memuat kelas kerawanan desa...
      </p>
    );
  }

  if (state.status === 'error') {
    return (
      <section
        role="status"
        aria-live="polite"
        aria-label="Keterangan kerawanan desa"
        className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800"
      >
        Keterangan kerawanan desa gagal dimuat: {state.error}. Peta tetap bisa dipakai untuk lapisan
        lain.
      </section>
    );
  }

  if (!state.data) {
    return null;
  }

  const {
    provinces,
    class_counts: classCounts,
    village_total: villageTotal,
    villages_without_class: withoutClass,
    villages_without_province: withoutProvince,
    notes,
  } = state.data;
  const selected = provinces.find((province) => province.province_code === provinceCode) ?? null;

  return (
    <section aria-label="Keterangan kerawanan desa" className="space-y-3">
      <header className="space-y-0.5">
        <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
          Kerawanan desa · kelas susunan penelitian
        </p>
        <h2 className="text-sm font-semibold text-slate-900">Kelas kerawanan desa/kelurahan</h2>
        <p className="text-xs text-slate-600">
          {formatCount(villageTotal)} desa/kelurahan · {formatCount(Object.keys(classCounts).length)}{' '}
          kelas · skala kelas, bukan skor 0–100
        </p>
      </header>

      <p className="text-xs text-slate-700">
        {selected === null ? (
          <>
            Belum ada provinsi terpilih, jadi lapisan belum digambar. Pilih satu provinsi di kendali
            peta — lapisan ini dimuat per provinsi (`SRS-F-38`), karena 83.530 poligon desa tidak
            masuk akal dikirim sekaligus.
          </>
        ) : (
          <>
            Sedang ditampilkan: <strong>{selected.province_name}</strong>. Peta sudah diperbesar ke
            provinsi itu; setelah ini kelas tiap desa terbaca dengan mengarahkan kursor ke poligonnya.
          </>
        )}
      </p>

      <div>
        <h3 className="text-xs font-semibold text-slate-900">Sebaran kelas nasional</h3>
        <div className="mt-1 overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="text-left text-slate-600">
                <th className="border-b border-slate-200 py-1">Kelas</th>
                <th className="border-b border-slate-200 py-1 text-right">Jumlah desa</th>
              </tr>
            </thead>
            <tbody>
              {VILLAGE_RISK_CLASSES.map((villageClass) => (
                <tr key={villageClass.value}>
                  <th scope="row" className="border-b border-slate-100 py-1 text-left font-normal">
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <span
                        aria-hidden="true"
                        className="inline-block h-3 w-5 shrink-0 rounded-sm border border-slate-400"
                        style={{ backgroundColor: villageClass.color }}
                      />
                      {villageClass.label}
                    </span>
                  </th>
                  <td className="border-b border-slate-100 py-1 text-right tabular-nums text-slate-800">
                    {formatCount(classCounts[villageClass.value] ?? 0)}
                  </td>
                </tr>
              ))}
              <tr>
                <th scope="row" className="py-1 text-left font-normal text-slate-700">
                  {NO_VILLAGE_CLASS_LABEL}
                </th>
                <td className="py-1 text-right tabular-nums text-slate-800">
                  {formatCount(withoutClass)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-1.5 text-[11px] text-slate-600">
          Kelas <strong>tidak ada deteksi</strong> bukan kerawanan rendah: nol titik panas bisa berarti
          tidak terdeteksi satelit (`SRS-F-39`). Desa tanpa baris kelas sama sekali digambar abu-abu,
          bukan sebagai kelas terendah.
        </p>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-slate-900">Batas lapisan ini</h3>
        <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-slate-700">
          <li>
            <strong>{formatCount(withoutProvince)} desa</strong> belum punya kode kecamatan induk di
            sumbernya, sehingga tidak bisa dimuat lewat lapisan per provinsi — pencarian wilayah tetap
            menemukannya.
          </li>
          <li>Hanya tampil pada zoom 8 ke atas; permintaan tile di bawah itu ditolak API.</li>
          <li>
            Angka desa/kelurahan bersifat <strong>pendukung</strong>, bukan unit analisis penelitian
            ini; unit analisisnya kabupaten/kota.
          </li>
          <li>
            Kelas desa dan skor kabupaten/kota memakai dua tangga warna berbeda dan tidak pernah
            tampil bersamaan.
          </li>
        </ul>
      </div>

      <DataNotes title="Catatan wajib lapisan kerawanan desa" notes={notes} />
    </section>
  );
}
