import { BarChart3, Box, Clock3, ReceiptText, Users } from "lucide-react";
import { NavLink } from "react-router-dom";

type MobileNavigationProps = { role: string };

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

export default function MobileNavigation({ role }: MobileNavigationProps) {
  const items = [
    ...baseItems,
    ...(role === "super_admin"
      ? [{ label: "Pengguna", icon: Users, path: "/users", comingSoon: false }]
      : []),
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Menu utama"
    >
      <ul
        className={`mx-auto grid max-w-md ${role === "super_admin" ? "grid-cols-5" : "grid-cols-4"}`}
      >
        {items.map(({ label, icon: Icon, path, comingSoon }) => (
          <li key={label}>
            {comingSoon ? (
              <div
                title="Segera hadir"
                className="flex h-16 flex-col items-center justify-center gap-1 text-xs text-subtle opacity-60"
              >
                <Icon size={22} />
                {label}
              </div>
            ) : (
              <NavLink
                to={path}
                end={path === "/dashboard"}
                className={({ isActive }) =>
                  `flex h-16 flex-col items-center justify-center gap-1 text-xs ${isActive ? "font-semibold text-cobalt" : "text-subtle"}`
                }
              >
                <Icon size={22} />
                {label}
              </NavLink>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
