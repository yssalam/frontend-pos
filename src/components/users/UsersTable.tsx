import { AlertCircle, Pencil } from "lucide-react";
import Skeleton from "@/components/ui/Skeleton";
import type { UserItem } from "@/types/user";
import { initials, lastSeen, roleLabel } from "@/utils/user";

type Props = {
  error: string;
  loading: boolean;
  filteredUsers: UserItem[];
  openEditPanel: (user: UserItem) => void;
};

export default function UsersTable({
  error,
  loading,
  filteredUsers,
  openEditPanel,
}: Props) {
  return (
    <section
      className="rounded-2xl bg-paper px-5 py-2 sm:px-6"
      aria-labelledby="users-list-heading"
    >
      <h2 id="users-list-heading" className="sr-only">
        Daftar pengguna
      </h2>
      {error && (
        <div
          role="alert"
          className="my-4 flex items-start gap-2 rounded-lg bg-[#fbeae7] p-4 text-sm text-danger"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}
      {loading ? (
        <div className="space-y-4 py-4" aria-label="Memuat pengguna">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="flex items-center gap-3 border-t-2 border-dashed border-line py-4 first:border-t-0">
              <Skeleton className="size-11 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2"><Skeleton className="h-4 w-40 max-w-full" /><Skeleton className="h-3 w-56 max-w-full" /></div>
              <Skeleton className="hidden h-7 w-20 rounded-md sm:block" />
              <Skeleton className="hidden h-4 w-24 sm:block" />
            </div>
          ))}
        </div>
      ) : !error && filteredUsers.length === 0 ? (
        <div className="py-10 text-center">
          <p className="font-display text-lg font-bold tracking-tight">
            Tidak ada pengguna yang cocok
          </p>
          <p className="mx-auto mt-1 max-w-[34ch] text-sm text-subtle">
            Coba kata kunci lain, atau ganti filter role.
          </p>
        </div>
      ) : (
        !error && (
          <table className="w-full">
            <caption className="sr-only">
              Pengguna beserta role, status, dan waktu masuk terakhir
            </caption>
            <thead className="max-lg:sr-only">
              <tr className="text-left text-sm text-subtle">
                <th className="py-3 pr-4 font-medium">Pengguna</th>
                <th className="py-3 pr-4 font-medium">Role</th>
                <th className="py-3 pr-4 font-medium">Status</th>
                <th className="py-3 pr-4 font-medium">Terakhir masuk</th>
                <th className="py-3 text-right font-medium">
                  <span className="sr-only">Aksi</span>
                </th>
              </tr>
            </thead>
            <tbody className="max-lg:block">
              {filteredUsers.map((user) => {
                const active =
                  user.is_active ?? user.active ?? user.status !== "inactive";
                return (
                  <tr
                    key={user.id}
                    className="relative border-t-2 border-dashed border-line first:border-t-0 max-lg:block max-lg:py-4"
                  >
                    <td className="lg:py-3.5 lg:pr-4 max-lg:block max-lg:pr-24">
                      <div className="flex items-center gap-3">
                        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-mist text-sm font-semibold">
                          {initials(user.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{user.name}</p>
                          <p className="truncate text-sm text-subtle">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="lg:py-3.5 lg:pr-4 max-lg:mt-3 max-lg:mr-2 max-lg:inline-block">
                      <span
                        className={`inline-flex h-7 items-center rounded-md px-2.5 text-sm font-medium ${user.role === "admin" || user.role === "super_admin" ? "bg-ink text-white" : "bg-mist text-ink"}`}
                      >
                        {roleLabel(user.role)}
                      </span>
                    </td>
                    <td className="lg:py-3.5 lg:pr-4 max-lg:mt-3 max-lg:inline-block">
                      <span className="inline-flex h-7 items-center gap-2 text-sm">
                        <span
                          className={`size-2 rounded-full ${active ? "bg-[#0b7a52]" : "bg-line"}`}
                        />
                        {active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="text-sm text-subtle lg:py-3.5 lg:pr-4 max-lg:mt-2 max-lg:block">
                      <span className="lg:hidden">Terakhir masuk: </span>
                      {lastSeen(user)}
                    </td>
                    <td className="lg:py-3.5 lg:text-right max-lg:absolute max-lg:top-3.5 max-lg:right-0">
                      <button
                        type="button"
                        onClick={() => openEditPanel(user)}
                        disabled={user.role === "super_admin"}
                        title={
                          user.role === "super_admin"
                            ? "Akun Super Admin tidak dapat diubah dari panel ini"
                            : "Ubah data pengguna"
                        }
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-line px-3 text-xs font-semibold text-ink hover:bg-mist disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Pencil size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )
      )}
    </section>
  );
}
