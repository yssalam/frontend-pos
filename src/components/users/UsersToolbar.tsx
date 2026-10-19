import { RefreshCw, Search } from "lucide-react";
import type { Role } from "@/types/user";

type Props = {
  query: string;
  setQuery: (value: string) => void;
  roleFilter: "all" | Role;
  setRoleFilter: (value: "all" | Role) => void;
  count: (target: "all" | Role) => number;
  loading: boolean;
  loadUsers: () => Promise<void>;
};

export default function UsersToolbar({
  query,
  setQuery,
  roleFilter,
  setRoleFilter,
  count,
  loading,
  loadUsers,
}: Props) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex justify-between items-center sm:w-80">
        <div className="relative ">
          <label htmlFor="users-search" className="sr-only">
            Cari pengguna
          </label>
          <Search
            size={20}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-subtle"
          />
          <input
            id="users-search"
            type="search"
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama atau email"
            className="h-11 w-full rounded-lg border-2 border-transparent bg-paper pr-4 pl-11 text-base placeholder:text-[#6b7b8f] focus:border-cobalt focus:outline-none focus-visible:ring-4 focus-visible:ring-cobalt/20"
          />
        </div>
        <button
          type="button"
          onClick={() => void loadUsers()}
          disabled={loading}
          aria-label="Muat ulang daftar"
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-3 text-sm font-medium hover:bg-mist disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />{" "}
          <span className="sm:hidden">Muat ulang</span>
        </button>
      </div>
      <div
        role="group"
        aria-label="Filter role"
        className="grid grid-cols-4 gap-1 rounded-xl bg-paper p-1 sm:w-[28rem]"
      >
        {(
          [
            ["all", `Semua (${count("all")})`],
            ["super_admin", `Super Admin (${count("super_admin")})`],
            ["admin", `Admin (${count("admin")})`],
            ["cashier", `Kasir (${count("cashier")})`],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setRoleFilter(value)}
            aria-pressed={roleFilter === value}
            className={`min-h-9 rounded-lg border px-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cobalt/30 ${roleFilter === value ? " bg-cobalt/5 text-cobalt" : "border-line text-subtle hover:bg-mist hover:text-ink"}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
