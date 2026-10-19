import type { UserItem } from "@/types/user";

export const roleLabel = (role: string) =>
  role === "super_admin" ? "Super Admin" : role === "admin" ? "Admin" : "Kasir";

export function unwrapUsers(payload: unknown): UserItem[] {
  const data = payload as any;
  const candidates = [
    data?.data?.users,
    data?.data?.data,
    data?.users,
    data?.data,
    data,
  ];
  return (candidates.find(Array.isArray) ?? []) as UserItem[];
}

export function initials(name: string) {
  return (name || "?")
    .trim()
    .split(/\\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function lastSeen(user: UserItem) {
  if (!user.last_login_at) return "Belum tersedia";
  const timestamp = new Date(user.last_login_at).getTime();
  if (Number.isNaN(timestamp)) return "Belum tersedia";
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (minutes < 60) return "Baru saja";
  if (minutes < 1440) return `${Math.floor(minutes / 60)} jam lalu`;
  if (minutes < 2880) return "Kemarin";
  return `${Math.floor(minutes / 1440)} hari lalu`;
}
