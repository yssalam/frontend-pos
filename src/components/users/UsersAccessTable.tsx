import { Check } from "lucide-react";

export default function UsersAccessTable() {
  return (
    <section
      className="mt-5 rounded-2xl bg-paper p-5 sm:p-6"
      aria-labelledby="access-heading"
    >
      <h2
        id="access-heading"
        className="font-display text-lg font-bold tracking-tight"
      >
        Hak akses tiap role
      </h2>
      <p className="mt-0.5 text-sm text-subtle">
        Gambaran akses per role. Server tetap memeriksa izin pada setiap
        request.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="text-left text-subtle">
              <th className="py-2 pr-3 font-medium">Kemampuan</th>
              <th className="w-24 py-2 text-center font-medium">Super Admin</th>
              <th className="w-16 py-2 text-center font-medium">Admin</th>
              <th className="w-16 py-2 text-center font-medium">Kasir</th>
            </tr>
          </thead>
          <tbody className="[&>tr]:border-t-2 [&>tr]:border-dashed [&>tr]:border-line">
            {[
              ["Memakai halaman kasir", true, true, true],
              ["Melihat riwayat transaksi sendiri", true, true, true],
              ["Melihat semua riwayat transaksi", true, true, false],
              ["Mengelola produk dan kategori", true, true, false],
              ["Melihat dashboard dan laporan", true, true, false],
              ["Mengelola pengguna", true, false, false],
            ].map(([label, superAdmin, admin, cashier]) => (
              <tr key={String(label)}>
                <th className="py-3 pr-3 text-left font-normal">{label}</th>
                {[superAdmin, admin, cashier].map((allowed, index) => (
                  <td key={index} className="py-3 text-center">
                    {allowed ? (
                      <Check
                        size={19}
                        strokeWidth={2.5}
                        className="mx-auto text-[#0b7a52]"
                      />
                    ) : (
                      <span className="text-subtle">-</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
