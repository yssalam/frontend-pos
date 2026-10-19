import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  LoaderCircle,
} from "lucide-react";
import Skeleton from "@/components/ui/Skeleton";
import { downloadStockMovementTemplate } from "@/utils/stockMovementWorkbook";
import api from "@/lib/axios";
import type { HistoryFilter, HistoryPeriod } from "@/types/history";
import type { StockMovement } from "@/types/product";
import { errorMessage, unwrap } from "@/utils/productHelpers";

type Notice = { type: "error"; text: string } | null;
type MovementPage = {
  data: StockMovement[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
};
const filters: { id: HistoryFilter; label: string }[] = [
  { id: "all", label: "Semua" },
  { id: "IN", label: "Stok masuk" },
  { id: "OUT", label: "Stok keluar" },
  { id: "ADJUSTMENT", label: "Adjustment" },
];
const periods: { id: HistoryPeriod; label: string }[] = [
  { id: "day", label: "Hari" },
  { id: "week", label: "Minggu" },
  { id: "month", label: "Bulan" },
  { id: "year", label: "Tahun" },
];
const dateFormatter = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });
const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

function periodRange(date: Date, period: HistoryPeriod) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(start);
  if (period === "day") {
    /* one calendar day */
  }
  if (period === "week") {
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    end.setTime(start.getTime());
    end.setDate(start.getDate() + 6);
  }
  if (period === "month") {
    start.setDate(1);
    end.setMonth(end.getMonth() + 1, 0);
  }
  if (period === "year") {
    start.setMonth(0, 1);
    end.setMonth(11, 31);
  }
  return {
    from: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`,
    to: `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`,
    start,
    end,
  };
}
function movePeriod(date: Date, period: HistoryPeriod, delta: number) {
  const next = new Date(date);
  if (period === "day") next.setDate(next.getDate() + delta);
  if (period === "week") next.setDate(next.getDate() + delta * 7);
  if (period === "month") next.setMonth(next.getMonth() + delta);
  if (period === "year") next.setFullYear(next.getFullYear() + delta);
  return next;
}
export default function HistoryPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const [period, setPeriod] = useState<HistoryPeriod>("day");
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [selectedMovement, setSelectedMovement] =
    useState<StockMovement | null>(null);

  const range = useMemo(
    () => periodRange(selectedDate, period),
    [selectedDate, period],
  );
  const loadHistory = useCallback(
    async (requestedPage = 1) => {
      setLoading(true);
      setNotice(null);
      try {
        const response = await api.get("/stock/movements", {
          params: {
            ...(filter !== "all" ? { type: filter } : {}),
            from: range.from,
            to: range.to,
            page: requestedPage,
            per_page: 50,
          },
        });
        const result = unwrap<MovementPage>(response);
        setMovements(result.data || []);
        setPage(result.current_page || requestedPage);
        setLastPage(result.last_page || 1);
        setTotalRows(result.total || 0);
      } catch (error) {
        setNotice({
          type: "error",
          text: `Gagal memuat riwayat stok. ${errorMessage(error)}`,
        });
      } finally {
        setLoading(false);
      }
    },
    [filter, range.from, range.to],
  );
  useEffect(() => {
    void loadHistory(1);
  }, [loadHistory]);

  async function exportExcel() {
    setExporting(true);
    setNotice(null);
    try {
      const allRows: StockMovement[] = [];
      for (let exportPage = 1; ; exportPage += 1) {
        const response = await api.get("/stock/movements", {
          params: {
            ...(filter !== "all" ? { type: filter } : {}),
            from: range.from,
            to: range.to,
            page: exportPage,
            per_page: 100,
          },
        });
        const result = unwrap<MovementPage>(response);
        allRows.push(...(result.data || []));
        if (exportPage >= (result.last_page || 1)) break;
      }
      await downloadStockMovementTemplate(allRows, rangeLabel);
    } catch (error) {
      setNotice({
        type: "error",
        text: `Gagal mengekspor Excel. ${errorMessage(error)}`,
      });
    } finally {
      setExporting(false);
    }
  }

  const rangeLabel =
    period === "day"
      ? dateFormatter.format(range.start)
      : `${dateFormatter.format(range.start)} - ${dateFormatter.format(range.end)}`;
  const kindLabel = (type: StockMovement["type"]) =>
    type === "IN"
      ? "Stok masuk"
      : type === "OUT"
        ? "Stok keluar"
        : "Adjustment";

  return (
    <main className="min-h-dvh bg-mist px-4 pt-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] font-sans text-ink sm:px-6 lg:px-10 lg:pt-10 lg:pb-12">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-cobalt">
              Inventaris
            </p>
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Riwayat stok
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-subtle">
              Pantau pergerakan dan ekspor data untuk rekonsiliasi SO.
            </p>
          </div>
          <button
            onClick={() => void exportExcel()}
            disabled={exporting || loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-cobalt px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-cobalt-dark focus:outline-none focus:ring-4 focus:ring-cobalt/20 disabled:opacity-50"
          >
            {exporting ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <Download size={17} />
            )}
            Ekspor Excel
          </button>
        </div>
        {notice && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            {notice.text}
          </div>
        )}
        <section className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
          <div className="grid gap-3 border-b border-line p-4 sm:grid-cols-[minmax(12rem,1fr)_auto] sm:items-center sm:p-5">
            <div className="grid grid-cols-4 gap-2">
              {periods.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setPeriod(item.id)}
                  className={`min-h-11 rounded-lg border px-3 py-2 text-xs font-medium transition ${period === item.id ? "border-cobalt bg-cobalt/5 text-cobalt" : "border-line text-subtle hover:bg-mist hover:text-ink"}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-2 sm:flex sm:justify-end">
              <button
                aria-label="Periode sebelumnya"
                onClick={() =>
                  setSelectedDate((date) => movePeriod(date, period, -1))
                }
                className="grid size-10 place-items-center rounded-lg border border-line text-subtle transition hover:bg-mist hover:text-ink"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="flex min-w-0 items-center justify-center gap-2 px-1 text-center text-xs font-semibold sm:min-w-48 sm:px-2 sm:text-sm">
                <CalendarDays size={16} className="text-cobalt" />
                {rangeLabel}
              </span>
              <button
                aria-label="Periode berikutnya"
                disabled={
                  range.end >= new Date(new Date().setHours(0, 0, 0, 0))
                }
                onClick={() =>
                  setSelectedDate((date) => movePeriod(date, period, 1))
                }
                className="grid size-10 place-items-center rounded-lg border border-line text-subtle transition hover:bg-mist hover:text-ink disabled:opacity-40"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          <div
            className="flex flex-wrap gap-2 border-t border-line p-4 sm:px-5"
            role="group"
            aria-label="Filter jenis pergerakan"
          >
            {filters.map((item) => (
              <button
                key={item.id}
                onClick={() => setFilter(item.id)}
                className={`min-h-10 rounded-lg border px-3 py-2 text-xs font-medium transition ${filter === item.id ? "border-cobalt bg-cobalt/5 text-cobalt" : "border-line text-subtle hover:bg-mist hover:text-ink"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>
        <section className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-5">
            <div>
              <h2 className="font-display text-lg font-bold">
                Pergerakan barang
              </h2>
              <p className="mt-1 text-xs text-subtle">
                {totalRows} catatan pada periode terpilih
              </p>
            </div>
            <button
              onClick={() => void loadHistory(page)}
              disabled={loading}
              aria-label="Muat ulang riwayat"
              className="grid size-9 place-items-center rounded-lg border border-line text-subtle transition hover:bg-mist hover:text-ink"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
          {loading ? (
            <div
              className="space-y-4 p-4 sm:p-5"
              aria-label="Memuat riwayat stok"
            >
              {Array.from({ length: 6 }, (_, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 border-t-2 border-dashed border-line py-4 first:border-t-0"
                >
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-44 max-w-full" />
                    <Skeleton className="h-3 w-60 max-w-full" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-md" />
                  <Skeleton className="h-5 w-12" />
                </div>
              ))}
            </div>
          ) : movements.length === 0 ? (
            <div className="grid min-h-52 place-items-center px-6 text-center text-sm text-subtle">
              Tidak ada pergerakan stok pada periode ini.
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[48rem] text-left text-sm">
                  <thead className="bg-mist text-xs text-subtle">
                    <tr>
                      <th className="px-5 py-3 font-medium">Waktu</th>
                      <th className="px-5 py-3 font-medium">Produk</th>
                      <th className="px-5 py-3 font-medium">Jenis</th>
                      <th className="px-5 py-3 text-right font-medium">
                        Perubahan
                      </th>
                      <th className="px-5 py-3 font-medium">Catatan</th>
                      <th className="px-5 py-3 font-medium">Petugas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-grid">
                    {movements.map((movement) => (
                      <tr
                        key={movement.id}
                        onClick={() => setSelectedMovement(movement)}
                        className="cursor-pointer hover:bg-mist/60"
                      >
                        <td className="whitespace-nowrap px-5 py-4 text-xs text-subtle">
                          {dateTimeFormatter.format(
                            new Date(movement.created_at),
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold">
                            {movement.product?.name ?? "Produk dihapus"}
                          </p>
                          <p className="mt-1 font-mono text-xs text-subtle">
                            {movement.product?.sku ?? "—"}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="rounded-full bg-mist px-2.5 py-1 text-xs font-medium">
                            {kindLabel(movement.type)}
                          </span>
                        </td>
                        <td
                          className={`px-5 py-4 text-right font-bold tabular-nums ${movement.type === "IN" ? "text-emerald-700" : movement.type === "OUT" ? "text-red-700" : "text-amber-700"}`}
                        >
                          {movement.quantity > 0 && movement.type !== "OUT"
                            ? "+"
                            : movement.type === "OUT"
                              ? "−"
                              : ""}
                          {Math.abs(movement.quantity)}
                        </td>
                        <td className="max-w-48 truncate px-5 py-4 text-xs text-subtle">
                          {movement.note || "—"}
                        </td>
                        <td className="px-5 py-4 text-xs">
                          {movement.user?.name ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="divide-y divide-grid md:hidden">
                {movements.map((movement) => (
                  <button
                    key={movement.id}
                    onClick={() => setSelectedMovement(movement)}
                    className="w-full px-4 py-4 text-left hover:bg-mist/60"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {movement.product?.name ?? "Produk dihapus"}
                        </p>
                        <p className="mt-1 text-xs text-subtle">
                          {dateTimeFormatter.format(
                            new Date(movement.created_at),
                          )}{" "}
                          · {movement.user?.name ?? "—"}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-sm font-bold ${movement.type === "IN" ? "text-emerald-700" : movement.type === "OUT" ? "text-red-700" : "text-amber-700"}`}
                      >
                        {movement.type === "OUT"
                          ? "−"
                          : movement.quantity > 0
                            ? "+"
                            : ""}
                        {Math.abs(movement.quantity)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-subtle">
                      {kindLabel(movement.type)} ·{" "}
                      {movement.note || "Tanpa catatan"}
                    </p>
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-3 border-t border-line px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <span className="text-xs text-subtle">
                  Halaman {page} dari {lastPage}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => void loadHistory(page - 1)}
                    disabled={page <= 1 || loading}
                    className="rounded-lg border border-line px-3 py-2 disabled:opacity-40"
                  >
                    Sebelumnya
                  </button>
                  <button
                    onClick={() => void loadHistory(page + 1)}
                    disabled={page >= lastPage || loading}
                    className="rounded-lg border border-line px-3 py-2 disabled:opacity-40"
                  >
                    Berikutnya
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
        {selectedMovement && (
          <div
            className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4"
            onClick={() => setSelectedMovement(null)}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="movement-detail-title"
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-cobalt">
                    Detail pergerakan
                  </p>
                  <h2
                    id="movement-detail-title"
                    className="mt-1 font-display text-xl font-bold"
                  >
                    {kindLabel(selectedMovement.type)}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedMovement(null)}
                  className="rounded-lg px-3 py-1 text-sm text-subtle hover:bg-mist"
                >
                  Tutup
                </button>
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                <div className="col-span-2 rounded-xl bg-mist p-3">
                  <dt className="text-xs text-subtle">Produk</dt>
                  <dd className="mt-1 font-semibold">
                    {selectedMovement.product?.name ?? "Produk dihapus"}
                  </dd>
                  <dd className="mt-1 font-mono text-xs text-subtle">
                    {selectedMovement.product?.sku ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-subtle">Perubahan stok</dt>
                  <dd className="mt-1 font-bold">
                    {selectedMovement.type === "OUT"
                      ? "−"
                      : selectedMovement.quantity > 0
                        ? "+"
                        : ""}
                    {Math.abs(selectedMovement.quantity)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-subtle">Waktu</dt>
                  <dd className="mt-1">
                    {dateTimeFormatter.format(
                      new Date(selectedMovement.created_at),
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-subtle">Petugas</dt>
                  <dd className="mt-1">{selectedMovement.user?.name ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-subtle">Catatan</dt>
                  <dd className="mt-1 whitespace-pre-wrap">
                    {selectedMovement.note || "—"}
                  </dd>
                </div>
                {selectedMovement.note === "Penjualan" && (
                  <div className="col-span-2 rounded-lg border border-cobalt/20 bg-cobalt/5 p-3 text-xs text-subtle">
                    Detail transaksi: penjualan ini tercatat sebagai pergerakan
                    stok. Rincian item dan nominal pembelian tidak tersimpan
                    pada data movement.
                  </div>
                )}
              </dl>
            </section>
          </div>
        )}
        <p className="mt-8 text-center text-xs text-subtle">
          Lapak POS · Audit stok
        </p>
      </div>
    </main>
  );
}
