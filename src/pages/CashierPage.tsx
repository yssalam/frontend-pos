import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import api from "@/lib/axios";
import type { CartItem, PaymentMethod } from "@/types/cashier";
import type { Sale, SaleRequest } from "@/types/sale";
import type { Category, Product } from "@/types/product";
import { errorMessage, money, unwrap } from "@/utils/productHelpers";
import ProductPicker from "@/components/cashier/ProductPicker";
import CartPanel from "@/components/cashier/CartPanel";

type Notice = { type: "success" | "error"; text: string };

export default function CashierPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [notice, setNotice] = useState<Notice | null>(null);

  async function loadProducts() {
    setLoading(true);
    try {
      const [productResponse, categoryResponse] = await Promise.all([
        api.get("/products"),
        api.get("/categories"),
      ]);
      setProducts(unwrap<Product[]>(productResponse) || []);
      setCategories(unwrap<Category[]>(categoryResponse) || []);
      setNotice(null);
    } catch (error) {
      setNotice({
        type: "error",
        text: `Gagal memuat katalog. ${errorMessage(error)}`,
      });
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void loadProducts();
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(
      () => setNotice(null),
      notice.type === "success" ? 6000 : 8000,
    );
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("id-ID");
    return products.filter((product) => {
      const matchQuery =
        !normalized ||
        product.name.toLocaleLowerCase("id-ID").includes(normalized) ||
        product.sku.toLocaleLowerCase("id-ID").includes(normalized);
      return (
        matchQuery &&
        (selectedCategory === "all" ||
          String(product.category_id) === selectedCategory)
      );
    });
  }, [products, query, selectedCategory]);
  const categoryOptions = [
    { value: "all", label: "Semua" },
    ...categories.map((category) => ({
      value: String(category.id),
      label: category.name,
    })),
  ];
  const quantities = new Map(
    cart.map((item) => [item.product.id, item.quantity]),
  );

  function changeCart(product: Product) {
    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      if (product.stock === 0 && existing)
        return current.filter((item) => item.product.id !== product.id);
      if (existing)
        return current.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                product,
                quantity: Math.min(item.quantity + 1, product.stock),
              }
            : item,
        );
      if (product.stock <= 0) return current;
      return [...current, { product, quantity: 1 }];
    });
  }
  function changeQuantity(productId: number, delta: number) {
    setCart((current) =>
      current.flatMap((item) => {
        if (item.product.id !== productId) return [item];
        const quantity = item.quantity + delta;
        return quantity <= 0
          ? []
          : [{ ...item, quantity: Math.min(quantity, item.product.stock) }];
      }),
    );
  }
  async function checkout() {
    if (!cart.length || processing) return;
    setProcessing(true);
    try {
      const payload: SaleRequest = {
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
        payment_method: paymentMethod,
      };
      const response = await api.post("/sales", payload);
      const sale = unwrap<Sale>(response);
      setCart([]);
      try {
        const [productResponse, categoryResponse] = await Promise.all([
          api.get("/products"),
          api.get("/categories"),
        ]);
        setProducts(unwrap<Product[]>(productResponse) || []);
        setCategories(unwrap<Category[]>(categoryResponse) || []);
      } catch {
        // Transaksi sudah tersimpan; katalog bisa dimuat ulang secara manual.
      }
      setNotice({
        type: "success",
        text: `Transaksi ${sale.id} berhasil dicatat · ${money(sale.total)}. Stok sudah diperbarui.`,
      });
    } catch (error) {
      setNotice({ type: "error", text: errorMessage(error) });
    } finally {
      setProcessing(false);
    }
  }

  return (
    <main className="min-h-dvh px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-10 lg:pt-10">
      <div className="mx-auto max-w-6xl ">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-cobalt">
              Lapak POS / Penjualan
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">
              Kasir
            </h1>
            <p className="mt-1 text-sm text-subtle">
              Pilih produk, susun pesanan, lalu catat transaksi.
            </p>
          </div>
          <button
            onClick={() => void loadProducts()}
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-3 text-sm font-medium hover:bg-mist disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Muat ulang
          </button>
        </div>

        {notice && (
          <div
            role="status"
            className={`mb-5 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${notice.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-900"}`}
          >
            {notice.type === "success" ? (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            ) : (
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
            )}
            {notice.text}
          </div>
        )}
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,23rem)]">
          <ProductPicker
            products={filteredProducts}
            query={query}
            selectedCategory={selectedCategory}
            categories={categoryOptions}
            onQueryChange={setQuery}
            onCategoryChange={setSelectedCategory}
            onAdd={changeCart}
            quantities={quantities}
            loading={loading && !products.length}
          />
          <CartPanel
            items={cart}
            paymentMethod={paymentMethod}
            onPaymentChange={setPaymentMethod}
            onQuantityChange={changeQuantity}
            onRemove={(productId) =>
              setCart((current) =>
                current.filter((item) => item.product.id !== productId),
              )
            }
            onClear={() => setCart([])}
            onCheckout={() => void checkout()}
            processing={processing}
          />
        </div>
        <p className="mt-8 text-center text-xs text-subtle">
          Lapak POS · Kasir
        </p>
      </div>
    </main>
  );
}
