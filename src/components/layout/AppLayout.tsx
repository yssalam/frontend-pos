import { useEffect, useState } from "react";
import { LoaderCircle, LogOut, ReceiptText } from "lucide-react";
import Skeleton from "@/components/ui/Skeleton";
import { Outlet, useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import Sidebar from "@/components/layout/navigations/Sidebar";
import MobileNavigation from "@/components/layout/navigations/MobileNavigation";

export type AuthUser = { id: number; name: string; email: string; role: string };
export type LayoutContext = { user: AuthUser; handleLogout: () => Promise<void>; loggingOut: boolean };

export default function AppLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;
    api.get("/profile")
      .then((response) => {
        const payload = response.data?.data ?? response.data;
        const profile = payload?.user ?? payload;
        if (active) setUser(profile);
      })
      .catch(() => {
        localStorage.removeItem("token");
        window.dispatchEvent(new Event("auth-changed"));
        navigate("/login", { replace: true });
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [navigate]);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try { await api.post("/logout"); } catch { /* Hapus token lokal walau API logout gagal. */ }
    finally {
      localStorage.removeItem("token");
      window.dispatchEvent(new Event("auth-changed"));
      navigate("/login", { replace: true });
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-mist p-4 font-sans text-ink sm:p-6 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-6 lg:p-8" aria-label="Memuat aplikasi">
        <Skeleton className="hidden h-[calc(100vh-4rem)] rounded-2xl lg:block" />
        <section className="space-y-6">
          <div className="flex h-14 items-center justify-between lg:hidden"><Skeleton className="h-8 w-36" /><Skeleton className="h-9 w-20 rounded-lg" /></div>
          <div className="space-y-3"><Skeleton className="h-4 w-28" /><Skeleton className="h-9 w-56 max-w-full" /><Skeleton className="h-4 w-72 max-w-full" /></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-28 rounded-2xl" />)}</div>
          <div className="grid gap-5 lg:grid-cols-2"><Skeleton className="h-72 rounded-2xl" /><Skeleton className="h-72 rounded-2xl" /></div>
        </section>
      </main>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen bg-mist font-sans text-ink lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <Sidebar role={user.role} user={user} loggingOut={loggingOut} onLogout={() => void handleLogout()} />
      <div className="min-w-0">
        <header className="flex h-16 items-center justify-between bg-ink px-4 text-white sm:px-6 lg:hidden">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-cobalt"><ReceiptText size={19} /></span>
            <span className="font-display text-lg font-bold">Lapak POS</span>
          </div>
          <button onClick={handleLogout} disabled={loggingOut} className="flex items-center gap-2 rounded-lg bg-ink-soft px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50">
            {loggingOut ? <LoaderCircle size={16} className="animate-spin" /> : <LogOut size={16} />}
            {loggingOut ? "Keluar..." : "Keluar"}
          </button>
        </header>
        <Outlet context={{ user, handleLogout, loggingOut }} />
        <MobileNavigation role={user.role} />

      </div>
    </div>
  );
}
