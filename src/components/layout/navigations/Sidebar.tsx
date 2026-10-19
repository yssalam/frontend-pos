import { BarChart3, Box, Clock3, ReceiptText, Users } from "lucide-react";
import { LoaderCircle, LogOut, UserRound } from "lucide-react";
import { NavLink } from "react-router-dom";

type SidebarProps = {
  role: string;
  user: { name: string; role: string };
  loggingOut: boolean;
  onLogout: () => void;
};

const baseItems = [
  {
    label: "Kasir",
    icon: ReceiptText,
    path: "/cashier",
    comingSoon: false,
  },
  { label: "Riwayat", icon: Clock3, path: "/history", comingSoon: false },
  {
    label: "Dashboard",
    icon: BarChart3,
    path: "/dashboard",
    comingSoon: false,
  },
  { label: "Produk", icon: Box, path: "/product", comingSoon: false },
];

export default function Sidebar({
  role,
  user,
  loggingOut,
  onLogout,
}: SidebarProps) {
  const items = [
    ...baseItems,
    ...(role === "super_admin"
      ? [{ label: "Pengguna", icon: Users, path: "/users", comingSoon: false }]
      : []),
  ];

  return (
    <aside className="sticky top-0 hidden h-screen flex-col bg-ink px-4 py-6 text-white lg:flex">
      <div className="flex items-center gap-3 px-2">
        <span className="grid size-10 place-items-center rounded-xl bg-cobalt">
          <ReceiptText size={21} />
        </span>
        <span className="font-display text-lg font-bold">POS-APP</span>
      </div>
      <nav className="mt-8 space-y-1" aria-label="Menu utama">
        {items.map(({ label, icon: Icon, path, comingSoon }) =>
          comingSoon ? (
            <button
              key={label}
              type="button"
              disabled
              className="flex h-11 w-full cursor-not-allowed items-center gap-3 rounded-lg px-3 text-left text-sm text-slate-500"
            >
              <Icon size={19} />
              {label}
              <span className="ml-auto text-[10px]">Segera</span>
            </button>
          ) : (
            <NavLink
              key={label}
              to={path}
              end={path === "/dashboard"}
              className={({ isActive }) =>
                `flex h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm ${isActive ? "bg-ink-soft font-medium text-white" : "text-slate-300 hover:bg-ink-soft hover:text-white"}`
              }
            >
              <Icon size={19} />
              {label}
            </NavLink>
          ),
        )}
      </nav>
      <div className="mt-auto border-t border-white/10 pt-4">
        <div className="flex items-center gap-3 px-2">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink-soft text-sm font-semibold">
            {user.name
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0])
              .join("")
              .toUpperCase() || <UserRound size={18} />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <span
              className={`inline-flex items-center rounded-md text-xs font-small ${
                user.role === "admin" || user.role === "super_admin"
                  ? " text-subtle"
                  : " text-subtle"
              }`}
            >
              {user.role === "super_admin"
                ? "Super Admin"
                : user.role === "admin"
                  ? "Admin"
                  : "Kasir"}
            </span>
          </div>
          <button
            onClick={onLogout}
            disabled={loggingOut}
            title={loggingOut ? "Sedang keluar..." : "Keluar"}
            aria-label={loggingOut ? "Sedang keluar" : "Keluar"}
            className="rounded-lg p-2 text-slate-300 hover:bg-ink-soft hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loggingOut ? (
              <LoaderCircle size={18} className="animate-spin" />
            ) : (
              <LogOut size={18} />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
