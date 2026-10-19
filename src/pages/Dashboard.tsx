import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock3,
  Package,
  RefreshCw,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  UserRound,
} from "lucide-react";
import api from "@/lib/axios";
import type { LayoutContext } from "@/components/layout/AppLayout";
import type { Product, StockMovement } from "@/types/product";
import { errorMessage, unwrap } from "@/utils/productHelpers";
import Skeleton from "@/components/ui/Skeleton";

type Period = "day" | "week" | "month" | "year";
type MovementPage = {
  data: StockMovement[];
  current_page: number;
  last_page: number;
};
type Bucket = {
  key: string;
  label: string;
  incoming: number;
  outgoing: number;
  adjustment: number;
};
const money = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
const dateLabel = (date: Date) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

function getRange(date: Date, period: Period) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(start);
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
  const isoDate = (value: Date) =>
    `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  return { start, end, from: isoDate(start), to: isoDate(end) };
}
function moveDate(date: Date, period: Period, delta: number) {
  const next = new Date(date);
  if (period === "day") next.setDate(next.getDate() + delta);
  if (period === "week") next.setDate(next.getDate() + delta * 7);
  if (period === "month") next.setMonth(next.getMonth() + delta);
  if (period === "year") next.setFullYear(next.getFullYear() + delta);
  return next;
}
function dateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}
function createBuckets(date: Date, period: Period): Bucket[] {
  const { start, end } = getRange(date, period);
  if (period === "day")
    return Array.from({ length: 24 }, (_, hour) => ({
      key: String(hour),
      label: String(hour).padStart(2, "0"),
      incoming: 0,
      outgoing: 0,
      adjustment: 0,
    }));
  if (period === "week")
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return {
        key: dateKey(day),
        label: new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(
          day,
        ),
        incoming: 0,
        outgoing: 0,
        adjustment: 0,
      };
    });
  if (period === "month")
    return Array.from({ length: end.getDate() }, (_, index) => {
      const day = new Date(start);
      day.setDate(index + 1);
      return {
        key: dateKey(day),
        label: String(index + 1),
        incoming: 0,
        outgoing: 0,
        adjustment: 0,
      };
    });
  return Array.from({ length: 12 }, (_, month) => ({
    key: String(month),
    label: new Intl.DateTimeFormat("id-ID", { month: "short" }).format(
      new Date(date.getFullYear(), month, 1),
    ),
    incoming: 0,
    outgoing: 0,
    adjustment: 0,
  }));
}
function bucketFor(movement: StockMovement, period: Period) {
  const date = new Date(movement.created_at);
  return period === "day"
    ? String(date.getHours())
    : period === "year"
      ? String(date.getMonth())
      : dateKey(date);
}

export default function Dashboard() {
  const { user } = useOutletContext<LayoutContext>();
  const [period, setPeriod] = useState<Period>("week");
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [showTable, setShowTable] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const range = useMemo(
    () => getRange(selectedDate, period),
    [selectedDate, period],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [productResponse, movementResponse] = await Promise.all([
        api.get("/products"),
        api.get("/stock/movements", {
          params: { from: range.from, to: range.to, page: 1, per_page: 100 },
        }),
      ]);
      setProducts(unwrap<Product[]>(productResponse) || []);
      const firstPage = unwrap<MovementPage>(movementResponse);
      const rows = [...(firstPage.data || [])];
      for (let page = 2; page <= (firstPage.last_page || 1); page += 1) {
        const response = await api.get("/stock/movements", {
          params: { from: range.from, to: range.to, page, per_page: 100 },
        });
        rows.push(...(unwrap<MovementPage>(response).data || []));
      }
      setMovements(rows);
    } catch (cause) {
      setError(`Data dashboard gagal dimuat. ${errorMessage(cause)}`);
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to]);
  useEffect(() => {
    void loadData();
  }, [loadData]);

  const buckets = useMemo(() => {
    const result = createBuckets(selectedDate, period);
    const byKey = new Map(result.map((bucket) => [bucket.key, bucket]));
    movements.forEach((movement) => {
      const bucket = byKey.get(bucketFor(movement, period));
      if (!bucket) return;
      if (movement.type === "IN")
        bucket.incoming += Math.abs(movement.quantity);
      else if (movement.type === "OUT")
        bucket.outgoing += Math.abs(movement.quantity);
      else bucket.adjustment += movement.quantity;
    });
    return result;
  }, [movements, period, selectedDate]);
  const incoming = movements
    .filter((item) => item.type === "IN")
    .reduce((sum, item) => sum + Math.abs(item.quantity), 0);
  const outgoing = movements
    .filter((item) => item.type === "OUT")
    .reduce((sum, item) => sum + Math.abs(item.quantity), 0);
  const adjustmentNet = movements
    .filter((item) => item.type === "ADJUSTMENT")
    .reduce((sum, item) => sum + item.quantity, 0);
  const salesMovements = movements.filter(
    (item) =>
      item.type === "OUT" &&
      item.note?.trim().toLocaleLowerCase("id-ID") === "penjualan",
  );
  const unitsSold = salesMovements.reduce(
    (sum, item) => sum + Math.abs(item.quantity),
    0,
  );
  const salesValueEstimate = salesMovements.reduce(
    (sum, item) =>
      sum + Math.abs(item.quantity) * Number(item.product?.price ?? 0),
    0,
  );
  const lowStock = products.filter(
    (item) => item.stock > 0 && item.stock <= 5,
  ).length;
  const emptyStock = products.filter((item) => item.stock <= 0).length;
  const topProducts = useMemo(() => {
    const totals = new Map<
      number,
      { product: NonNullable<StockMovement["product"]>; quantity: number }
    >();
    for (const movement of salesMovements) {
      if (!movement.product) continue;
      const current = totals.get(movement.product.id) ?? {
        product: movement.product,
        quantity: 0,
      };
      current.quantity += Math.abs(movement.quantity);
      totals.set(movement.product.id, current);
    }
    return [...totals.values()]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [salesMovements]);
  const maxBar = Math.max(
    1,
    ...buckets.flatMap((item) => [
      item.incoming,
      item.outgoing,
      Math.abs(item.adjustment),
    ]),
  );
  const today = new Date();
  const isFuture =
    range.end >=
    new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const periodLabel =
    period === "day"
      ? dateLabel(range.start)
      : period === "week"
        ? `${dateLabel(range.start)} – ${dateLabel(range.end)}`
        : period === "month"
          ? new Intl.DateTimeFormat("id-ID", {
              month: "long",
              year: "numeric",
            }).format(range.start)
          : String(range.start.getFullYear());

  return (
    <main className="min-h-dvh bg-mist px-4 pt-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] font-sans text-ink sm:px-6 lg:px-10 lg:pt-10 lg:pb-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 sm:gap-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-cobalt">
              Ringkasan
            </p>
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Dashboard
            </h1>
            <p className="mt-2 max-w-xl break-words text-sm leading-relaxed text-subtle">
              Halo, {user.name}. Ringkasan aktivitas persediaan.
            </p>
          </div>
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
            <div
              role="group"
              aria-label="Periode"
              className="grid grid-cols-4 gap-1 rounded-xl bg-white p-1 sm:w-80"
            >
              {(
                [
                  ["day", "Hari"],
                  ["week", "Minggu"],
                  ["month", "Bulan"],
                  ["year", "Tahun"],
                ] as [Period, string][]
              ).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setPeriod(value)}
                  aria-pressed={period === value}
                  className={`min-h-10 min-w-0 rounded-lg px-2 text-sm font-medium border focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cobalt/30 ${period === value ? "border-cobalt bg-cobalt/5 text-cobalt" : "border-line text-subtle hover:bg-mist hover:text-ink"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="grid min-w-0 grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-1 sm:w-72">
              <button
                onClick={() =>
                  setSelectedDate((date) => moveDate(date, period, -1))
                }
                aria-label="Periode sebelumnya"
                className="grid size-11 place-items-center rounded-lg bg-white text-subtle transition hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cobalt/30"
              >
                <ArrowLeft size={18} />
              </button>
              <p
                aria-live="polite"
                className="flex min-w-0 items-center justify-center gap-1.5 px-1 text-center text-sm font-medium leading-tight"
              >
                <CalendarDays size={16} className="shrink-0 text-subtle" />
                {periodLabel}
              </p>
              <button
                onClick={() =>
                  setSelectedDate((date) => moveDate(date, period, 1))
                }
                disabled={isFuture}
                aria-label="Periode berikutnya"
                className="grid size-11 place-items-center rounded-lg bg-white text-subtle transition hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cobalt/30 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </header>
        <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 sm:px-5">
          <p className="min-w-0 flex-1 text-xs leading-relaxed text-subtle">
            Ringkasan bersumber dari stok dan stock movement pada periode
            terpilih. Omzet adalah estimasi berdasarkan harga produk saat ini,
            bukan harga transaksi historis.
          </p>
          <button
            onClick={() => void loadData()}
            disabled={loading}
            aria-label="Perbarui data"
            className="inline-flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-lg border-2 border-line px-3 text-sm font-medium hover:bg-mist focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cobalt/30 disabled:opacity-50 sm:h-10"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            <span className="max-sm:sr-only">Perbarui</span>
          </button>
        </div>
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span className="min-w-0 break-words">{error}</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {[
            {
              label: "Unit terjual",
              value: unitsSold,
              icon: ShoppingBag,
              tone: "text-cobalt",
            },
            {
              label: "Stok masuk",
              value: incoming,
              icon: TrendingUp,
              tone: "text-emerald-700",
            },
            {
              label: "Stok keluar",
              value: outgoing,
              icon: TrendingDown,
              tone: "text-red-700",
            },
            {
              label: "SKU perlu dicek",
              value: lowStock + emptyStock,
              icon: Package,
              tone: "text-amber-700",
              detail: `${lowStock} stok rendah · ${emptyStock} habis`,
            },
          ].map(({ label, value, icon: Icon, tone, detail }) => (
            <section
              key={label}
              className="min-w-0 rounded-2xl bg-white p-4 sm:p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 text-xs leading-snug text-subtle sm:text-sm">
                  {label}
                </p>
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-mist">
                  <Icon size={17} className={tone} />
                </span>
              </div>
              <div className="mt-3 font-display text-2xl font-bold leading-none tabular-nums sm:text-3xl">
                {loading ? (
                  <Skeleton className="h-7 w-20 sm:h-8" />
                ) : (
                  value.toLocaleString("id-ID")
                )}
              </div>
              {detail && <p className="mt-2 text-xs text-subtle">{detail}</p>}
            </section>
          ))}
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:grid-rows-[auto_1fr_auto] lg:items-start">
          <div className="flex min-w-0 flex-col gap-5 sm:gap-6 lg:col-start-1 lg:row-span-2 lg:row-start-1">
            <section className="receipt @container rounded-t-2xl bg-white px-4 pt-5 pb-8! sm:px-6 sm:pt-6">
              <p className="text-sm font-medium text-subtle">
                Estimasi nilai penjualan
              </p>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-display text-lg text-subtle">Rp</span>
                <div className="min-w-0 font-display text-[clamp(1.5rem,10.5cqw,3rem)] leading-none font-bold tracking-tight tabular-nums">
                  {loading ? (
                    <Skeleton className="h-9 w-48 max-w-full sm:h-12" />
                  ) : (
                    money(salesValueEstimate)
                  )}
                </div>
              </div>
              <p className="mt-3 flex w-fit max-w-full items-start gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
                <AlertCircle size={15} className="mt-px shrink-0" />
                <span className="min-w-0">
                  Estimasi harga saat ini · bukan omzet akuntansi
                </span>
              </p>
              <div className="my-5 border-t-2 border-dashed border-line" />
              <dl className="grid grid-cols-2 gap-4">
                <div className="min-w-0">
                  <dt className="text-sm text-subtle">
                    Baris movement penjualan
                  </dt>
                  <dd className="mt-1 font-display text-2xl font-bold tabular-nums">
                    {loading ? (
                      <Skeleton className="mt-2 h-7 w-16" />
                    ) : (
                      salesMovements.length
                    )}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-sm text-subtle">Adjustment bersih</dt>
                  <dd className="mt-1 font-display text-2xl font-bold tabular-nums">
                    {loading ? (
                      <Skeleton className="mt-2 h-7 w-24" />
                    ) : (
                      <>{adjustmentNet.toLocaleString("id-ID")} unit</>
                    )}
                  </dd>
                </div>
              </dl>
            </section>
            <section className="min-w-0 rounded-2xl bg-white p-4 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-display text-lg font-bold">
                  Pergerakan stok
                </h2>
                <button
                  onClick={() => setShowTable((value) => !value)}
                  aria-pressed={showTable}
                  className="h-10 shrink-0 rounded-lg border-2 border-line px-3 text-sm font-medium hover:bg-mist focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cobalt/30"
                >
                  {showTable ? "Lihat grafik" : "Lihat tabel"}
                </button>
              </div>
              <p className="mt-1 text-sm text-subtle">
                Unit masuk, keluar, dan selisih adjustment · {periodLabel}
              </p>
              {loading ? (
                <div
                  className="mt-6 space-y-4"
                  aria-busy="true"
                  aria-label="Memuat grafik pergerakan stok"
                >
                  <div className="flex h-44 items-end gap-2 rounded-lg bg-mist/50 p-3 sm:h-56">
                    {Array.from({ length: 12 }, (_, index) => (
                      <Skeleton
                        key={index}
                        className="flex-1 rounded-t-md"
                        style={{ height: `${20 + ((index * 37) % 70)}%` }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-10" />
                    <Skeleton className="h-3 w-10" />
                    <Skeleton className="h-3 w-10" />
                  </div>
                </div>
              ) : showTable ? (
                <div className="mt-5 max-h-72 overflow-auto rounded-lg border border-line">
                  <table className="w-full text-[13px] sm:text-sm">
                    <thead className="sticky top-0 bg-mist text-left text-subtle">
                      <tr>
                        <th
                          scope="col"
                          className="px-2.5 py-3 font-medium sm:px-3"
                        >
                          Periode
                        </th>
                        <th
                          scope="col"
                          className="px-2.5 py-3 text-right font-medium sm:px-3"
                        >
                          Masuk
                        </th>
                        <th
                          scope="col"
                          className="px-2.5 py-3 text-right font-medium sm:px-3"
                        >
                          Keluar
                        </th>
                        <th
                          scope="col"
                          className="px-2.5 py-3 text-right font-medium sm:px-3"
                        >
                          Adjustment
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {buckets.map((item) => (
                        <tr key={item.key} className="border-t border-grid">
                          <td className="px-2.5 py-2.5 whitespace-nowrap sm:px-3">
                            {item.label}
                          </td>
                          <td className="px-2.5 py-2.5 text-right tabular-nums sm:px-3">
                            {item.incoming}
                          </td>
                          <td className="px-2.5 py-2.5 text-right tabular-nums sm:px-3">
                            {item.outgoing}
                          </td>
                          <td className="px-2.5 py-2.5 text-right tabular-nums sm:px-3">
                            {item.adjustment > 0 ? "+" : ""}
                            {item.adjustment}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <>
                  <div className="mt-6 flex gap-2">
                    <div
                      className="relative h-44 w-8 shrink-0 sm:h-56"
                      aria-hidden="true"
                    >
                      {[1, 0.75, 0.5, 0.25, 0].map((step) => (
                        <span
                          key={step}
                          className="absolute right-0 translate-y-1/2 text-[11px] leading-none tabular-nums text-subtle"
                          style={{ bottom: `${step * 100}%` }}
                        >
                          {Math.round(maxBar * step)}
                        </span>
                      ))}
                    </div>
                    <div className="relative h-44 min-w-0 flex-1 sm:h-56">
                      <div
                        className="pointer-events-none absolute inset-0"
                        aria-hidden="true"
                      >
                        {[1, 0.75, 0.5, 0.25].map((step) => (
                          <div
                            key={step}
                            className="absolute inset-x-0 border-t border-grid"
                            style={{ bottom: `${step * 100}%` }}
                          />
                        ))}
                      </div>
                      <div
                        className={`absolute inset-0 flex items-end border-b border-line px-1 ${buckets.length > 12 ? "gap-px" : "gap-1"}`}
                      >
                        {buckets.map((item) => (
                          <div
                            key={item.key}
                            className="relative flex h-full min-w-0 flex-1 items-end justify-center gap-px"
                            title={`${item.label}: +${item.incoming} masuk, -${item.outgoing} keluar, ${item.adjustment} adjustment`}
                          >
                            <div
                              className="max-w-3 min-w-px flex-1 rounded-t-sm bg-emerald-600"
                              style={{
                                height: `${(item.incoming / (maxBar || 1)) * 100}%`,
                              }}
                            />
                            <div
                              className="max-w-3 min-w-px flex-1 rounded-t-sm bg-cobalt"
                              style={{
                                height: `${(item.outgoing / (maxBar || 1)) * 100}%`,
                              }}
                            />
                            <div
                              className="max-w-3 min-w-px flex-1 rounded-t-sm bg-amber-500"
                              style={{
                                height: `${(Math.abs(item.adjustment) / (maxBar || 1)) * 100}%`,
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div data-xaxis className="mt-2 pl-10">
                    <div
                      className={`flex px-1 ${buckets.length > 12 ? "gap-px" : "gap-1"}`}
                    >
                      {buckets.map((item, index) => {
                        const step =
                          buckets.length > 24 ? 5 : buckets.length > 12 ? 3 : 1;
                        const show =
                          index % step === 0 ||
                          (step === 5 && index === buckets.length - 1);
                        return (
                          <span
                            key={item.key}
                            className={`relative h-4 min-w-0 flex-1 ${period === "year" ? "max-sm:even:invisible" : ""}`}
                          >
                            {show && (
                              <span
                                data-xlabel
                                className="absolute top-0 left-1/2 -translate-x-1/2 text-[11px] leading-4 whitespace-nowrap text-subtle sm:text-xs"
                              >
                                {item.label}
                              </span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-subtle">
                    <span className="inline-flex items-center gap-1.5">
                      <i className="size-2.5 rounded-sm bg-emerald-600" />
                      Masuk
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <i className="size-2.5 rounded-sm bg-cobalt" />
                      Keluar
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <i className="size-2.5 rounded-sm bg-amber-500" />
                      Adjustment
                    </span>
                  </div>
                </>
              )}
            </section>
          </div>
          <section className="min-w-0 rounded-2xl bg-white p-4 sm:p-6 lg:col-start-2 lg:row-start-1">
            <div className="flex items-center gap-2">
              <ShoppingBag size={19} className="shrink-0 text-cobalt" />
              <h2 className="font-display text-lg font-bold">Produk terjual</h2>
            </div>
            <p className="mt-1 text-sm text-subtle">
              Movement bertanda “Penjualan”
            </p>
            {loading ? (
              <div
                className="mt-5 space-y-5"
                aria-busy="true"
                aria-label="Memuat produk terjual"
              >
                {Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Skeleton className="size-9 shrink-0 rounded-lg" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-4 w-32 max-w-full" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-4 w-20 shrink-0" />
                  </div>
                ))}
              </div>
            ) : topProducts.length ? (
              <ol className="mt-5 space-y-5">
                {topProducts.map(({ product, quantity }, index) => (
                  <li key={product.id}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-mist font-display font-bold">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="line-clamp-2 break-words text-sm font-semibold">
                            {product.name}
                          </p>
                          <p className="mt-0.5 text-xs text-subtle">
                            {quantity} unit terjual
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 text-sm font-medium tabular-nums">
                        {money(Number(product.price) * quantity)}
                      </span>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-mist">
                      <div
                        className="h-full rounded-full bg-cobalt"
                        style={{
                          width: `${(quantity / topProducts[0].quantity) * 100}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="py-8 text-center text-sm text-subtle">
                Belum ada movement penjualan pada periode ini.
              </p>
            )}
          </section>
          <section className="min-w-0 rounded-2xl bg-white p-4 sm:p-5 lg:col-start-2 lg:row-start-2">
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-mist">
                <UserRound size={20} />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-subtle">
                  {user.role === "super_admin"
                    ? "Super Admin"
                    : user.role === "admin"
                      ? "Admin"
                      : "Kasir"}
                </p>
                <p className="truncate font-semibold">{user.name}</p>
                <p className="truncate text-sm text-subtle">{user.email}</p>
              </div>
            </div>
          </section>
          <section className="min-w-0 rounded-2xl bg-white p-4 sm:p-6 lg:col-span-2 lg:row-start-3">
            <div className="flex items-center gap-2">
              <Clock3 size={19} className="shrink-0 text-cobalt" />
              <h2 className="font-display text-lg font-bold">
                Movement terbaru
              </h2>
            </div>
            <p className="mt-1 text-sm text-subtle">
              Catatan stok dalam periode ini
            </p>
            {loading ? (
              <div
                className="mt-3 divide-y divide-grid"
                aria-busy="true"
                aria-label="Memuat pergerakan terbaru"
              >
                {Array.from({ length: 5 }, (_, index) => (
                  <div key={index} className="flex items-center gap-3 py-4">
                    <Skeleton className="size-10 shrink-0 rounded-xl" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-4 w-36 max-w-full" />
                      <Skeleton className="h-3 w-48 max-w-full" />
                    </div>
                    <Skeleton className="h-4 w-10 shrink-0" />
                  </div>
                ))}
              </div>
            ) : movements.length ? (
              <ul className="mt-3 grid grid-cols-1 lg:grid-cols-2 lg:gap-x-10">
                {movements.slice(0, 6).map((movement) => (
                  <li
                    key={movement.id}
                    className="flex items-center justify-between gap-3 border-t border-grid py-4 first:border-t-0 lg:[&:nth-child(2)]:border-t-0"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-mist">
                        <Package size={18} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {movement.product?.name ?? "Produk dihapus"}
                        </p>
                        <p className="mt-1 flex items-start gap-1 text-xs leading-snug text-subtle">
                          <Clock3 size={12} className="mt-0.5 shrink-0" />
                          <span className="min-w-0">
                            {new Intl.DateTimeFormat("id-ID", {
                              dateStyle: "short",
                              timeStyle: "short",
                            }).format(new Date(movement.created_at))}{" "}
                            ·{" "}
                            {movement.note ||
                              (movement.type === "IN"
                                ? "Stok masuk"
                                : movement.type === "OUT"
                                  ? "Stok keluar"
                                  : "Adjustment")}
                          </span>
                        </p>
                      </div>
                    </div>
                    <p
                      className={`shrink-0 text-sm font-semibold tabular-nums ${movement.type === "IN" ? "text-emerald-700" : movement.type === "OUT" ? "text-red-700" : "text-amber-700"}`}
                    >
                      {movement.type === "OUT"
                        ? "−"
                        : movement.quantity > 0
                          ? "+"
                          : ""}
                      {Math.abs(movement.quantity)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-sm text-subtle">
                Belum ada movement di periode ini.
              </p>
            )}
          </section>
        </div>
        <p className="pt-2 text-center text-xs text-subtle">
          Lapak POS · Dashboard
        </p>
      </div>
    </main>
  );
}
