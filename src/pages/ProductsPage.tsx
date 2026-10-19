import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  Box,
  Check,
  ChevronDown,
  PackagePlus,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Tag,
  Trash2,
  X,
  LoaderCircle,
} from "lucide-react";

import api from "@/lib/axios";

import type { Role } from "@/types/user";

import type {
  Category,
  CategoryForm,
  Notice,
  Product,
  ProductForm,
  StockFilter,
  StockMovement,
  Tab,
} from "@/types/product";
import {
  emptyProductForm,
  emptyCategoryForm,
  money,
  errorMessage,
  unwrap,
} from "@/utils/productHelpers";

import Field from "@/components/products/Field";
import Modal from "@/components/products/Modal";
import { inputClass, textareaClass } from "@/components/products/fromStyles";
import ProductsTable from "@/components/products/ProductsTable";
import ProductCards from "@/components/products/ProductCards";
import StockMovementsModal from "@/components/stock/StockMovementsModal";
import StockAdjustmentModal from "@/components/stock/StockAdjustmentModal";
import Skeleton from "@/components/ui/Skeleton";

export default function ProductsPage() {
  const [tab, setTab] = useState<Tab>("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [productModal, setProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm);
  const [categoryModal, setCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] =
    useState<CategoryForm>(emptyCategoryForm);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleteProductTarget, setDeleteProductTarget] =
    useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [stockAdjustmentTarget, setStockAdjustmentTarget] =
    useState<Product | null>(null);
  const [adjustmentStock, setAdjustmentStock] = useState("0");
  const [adjustmentNote, setAdjustmentNote] = useState("");
  const [stockAction, setStockAction] = useState<"IN" | "ADJUSTMENT">("ADJUSTMENT");
  const [stockMovementTarget, setStockMovementTarget] =
    useState<Product | null>(null);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  const loadData = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const [productResponse, categoryResponse] = await Promise.all([
        api.get("/products"),
        api.get("/categories"),
      ]);
      setProducts(unwrap<Product[]>(productResponse) || []);
      setCategories(unwrap<Category[]>(categoryResponse) || []);
    } catch (error) {
      setNotice({
        type: "error",
        text: `Gagal memuat produk dan kategori. ${errorMessage(error)}`,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);
  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("id-ID");
    return products.filter((product) => {
      const matchesQuery =
        !normalized ||
        product.name.toLocaleLowerCase("id-ID").includes(normalized) ||
        product.sku.toLocaleLowerCase("id-ID").includes(normalized);
      const matchesCategory =
        categoryFilter === "all" ||
        String(product.category_id) === categoryFilter;
      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "empty"
          ? product.stock <= 0
          : product.stock > 0 && product.stock <= 5);
      return matchesQuery && matchesCategory && matchesStock;
    });
  }, [products, query, categoryFilter, stockFilter]);

  const lowStockCount = products.filter(
    (product) => product.stock > 0 && product.stock <= 5,
  ).length;
  const emptyStockCount = products.filter(
    (product) => product.stock <= 0,
  ).length;

  function openNewProduct() {
    setEditingProduct(null);
    setProductForm({
      ...emptyProductForm,
      category_id: categories[0] ? String(categories[0].id) : "",
    });
    setProductModal(true);
  }
  function openEditProduct(product: Product) {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      sku: product.sku,
      category_id: String(product.category_id),
      price: String(product.price),
      stock: String(product.stock),
      desc: product.desc || "",
    });
    setProductModal(true);
  }
  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!productForm.category_id) {
      setNotice({
        type: "error",
        text: "Buat kategori terlebih dahulu sebelum menambahkan produk.",
      });
      return;
    }
    const price = Number(productForm.price);
    const stock = Number(productForm.stock);
    if (
      !productForm.name.trim() ||
      !productForm.sku.trim() ||
      productForm.price.trim() === "" ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      setNotice({
        type: "error",
        text: "Periksa kembali nama, SKU, harga, dan stok produk.",
      });
      return;
    }
    setSaving(true);
    const payload = {
      name: productForm.name.trim(),
      sku: productForm.sku.trim(),
      category_id: Number(productForm.category_id),
      price,
      desc: productForm.desc.trim() || null,
      // Stok produk yang sudah ada harus tetap sama. Perubahan stok dilakukan melalui stock adjustment.
      stock: editingProduct ? editingProduct.stock : stock,
    };
    try {
      if (editingProduct)
        await api.put(`/products/${editingProduct.id}`, payload);
      else await api.post("/products", payload);
      setProductModal(false);
      setNotice({
        type: "success",
        text: editingProduct
          ? "Produk berhasil diperbarui."
          : "Produk berhasil ditambahkan.",
      });
      await loadData(true);
    } catch (error) {
      setNotice({ type: "error", text: errorMessage(error) });
    } finally {
      setSaving(false);
    }
  }

  function openStockAdjustment(product: Product) {
    setStockAdjustmentTarget(product);
    setAdjustmentStock(String(product.stock));
    setAdjustmentNote("");
    setStockAction("ADJUSTMENT");
  }

  async function submitStockAdjustment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stockAdjustmentTarget) return;
    const stock = Number(adjustmentStock);
    const quantity = stock - stockAdjustmentTarget.stock;
    if (!Number.isInteger(stock) || stock < 0 || !adjustmentNote.trim()) {
      setNotice({
        type: "error",
        text: "Masukkan jumlah stok yang valid dan alasan perubahan stok.",
      });
      return;
    }
    if (stockAction === "IN" && quantity <= 0) {
      setNotice({
        type: "error",
        text: "Stok masuk harus lebih besar daripada stok saat ini.",
      });
      return;
    }
    if (stockAction === "ADJUSTMENT" && quantity === 0) {
      setNotice({
        type: "error",
        text: "Jumlah stok aktual sama dengan stok saat ini; tidak ada penyesuaian.",
      });
      return;
    }

    setSaving(true);
    try {
      if (stockAction === "IN") {
        await api.post("/stock/in", {
          product_id: stockAdjustmentTarget.id,
          quantity,
          note: adjustmentNote.trim(),
        });
      } else {
        await api.post("/stock/adjustment", {
          product_id: stockAdjustmentTarget.id,
          stock,
          note: adjustmentNote.trim(),
        });
      }
      setStockAdjustmentTarget(null);
      setNotice({
        type: "success",
        text: stockAction === "IN" ? "Stok masuk berhasil dicatat." : "Stok berhasil disesuaikan.",
      });
      await loadData(true);
    } catch (error) {
      setNotice({ type: "error", text: errorMessage(error) });
    } finally {
      setSaving(false);
    }
  }

  async function openStockMovements(product: Product) {
    setStockMovementTarget(product);
    setStockMovements([]);
    setLoadingMovements(true);

    try {
      const response = await api.get(`/products/${product.id}/stock-movements`);

      setStockMovements(unwrap<StockMovement[]>(response) || []);
    } catch (error) {
      setNotice({
        type: "error",
        text: `Gagal memuat riwayat stok. ${errorMessage(error)}`,
      });
      setStockMovementTarget(null);
    } finally {
      setLoadingMovements(false);
    }
  }

  function openNewCategory() {
    setEditingCategory(null);
    setCategoryForm(emptyCategoryForm);
    setCategoryModal(true);
  }
  function openEditCategory(category: Category) {
    setEditingCategory(category);
    setCategoryForm({ name: category.name, desc: category.desc || "" });
    setCategoryModal(true);
  }
  async function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!categoryForm.name.trim()) {
      setNotice({ type: "error", text: "Nama kategori wajib diisi." });
      return;
    }
    setSaving(true);
    const payload = {
      name: categoryForm.name.trim(),
      desc: categoryForm.desc.trim() || null,
    };
    try {
      if (editingCategory)
        await api.put(`/categories/${editingCategory.id}`, payload);
      else await api.post("/categories", payload);
      setCategoryModal(false);
      setNotice({
        type: "success",
        text: editingCategory
          ? "Kategori berhasil diperbarui."
          : "Kategori berhasil ditambahkan.",
      });
      await loadData(true);
    } catch (error) {
      setNotice({ type: "error", text: errorMessage(error) });
    } finally {
      setSaving(false);
    }
  }
  async function deleteProduct() {
    if (!deleteProductTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/products/${deleteProductTarget.id}`);
      setDeleteProductTarget(null);
      setNotice({ type: "success", text: "Produk berhasil dihapus." });
      await loadData(true);
    } catch (error) {
      setNotice({ type: "error", text: errorMessage(error) });
    } finally {
      setDeleting(false);
    }
  }

  async function deleteCategory() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/categories/${deleteTarget.id}`);
      setDeleteTarget(null);
      setNotice({ type: "success", text: "Kategori berhasil dihapus." });
      await loadData(true);
    } catch (error) {
      setNotice({ type: "error", text: errorMessage(error) });
    } finally {
      setDeleting(false);
    }
  }

  const userRole = localStorage.getItem("role") as Role | null;

  const admin = userRole === "super_admin" || userRole === "admin";

  return (
    <main className="min-h-dvh bg-mist px-4 pt-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] font-sans text-ink sm:px-6 lg:px-10 lg:pt-10 lg:pb-12">
      <div className="w-full mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-cobalt">
              Inventaris
            </p>
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Produk & Kategori
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-subtle">
              Kelola katalog produk, harga jual, dan pengelompokan barang.
            </p>
          </div>
          {admin && (
            <button
              onClick={tab === "products" ? openNewProduct : openNewCategory}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-cobalt px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-cobalt-dark focus:outline-none focus:ring-4 focus:ring-cobalt/20"
            >
              <Plus size={18} />
              {tab === "products" ? "Tambah produk" : "Tambah kategori"}
            </button>
          )}
        </div>

        {notice && (
          <div
            role="status"
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${notice.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p className="min-w-0 flex-1">{notice.text}</p>
            <button
              aria-label="Tutup pemberitahuan"
              onClick={() => setNotice(null)}
            >
              <X size={17} />
            </button>
          </div>
        )}

        <section className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
          <div className=" border-line px-3 pt-3 sm:px-5">
            <div
              className="flex gap-2"
              role="tablist"
              aria-label="Data inventaris"
            >
              <button
                role="tab"
                aria-selected={tab === "products"}
                onClick={() => setTab("products")}
                className={`relative flex h-11 items-center gap-2 px-3 text-sm font-semibold ${tab === "products" ? "text-cobalt after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-cobalt" : "text-subtle hover:text-ink"}`}
              >
                <Box size={17} />
                Produk{" "}
                <span className="rounded-md bg-mist px-1.5 py-0.5 text-xs">
                  {products.length}
                </span>
              </button>
              <button
                role="tab"
                aria-selected={tab === "categories"}
                onClick={() => setTab("categories")}
                className={`relative flex h-11 items-center gap-2 px-3 text-sm font-semibold ${tab === "categories" ? "text-cobalt after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-cobalt" : "text-subtle hover:text-ink"}`}
              >
                <Tag size={17} />
                Kategori{" "}
                <span className="rounded-md bg-mist px-1.5 py-0.5 text-xs">
                  {categories.length}
                </span>
              </button>
            </div>
          </div>

          {tab === "products" ? (
            <>
              <div className="grid gap-3 border-b border-line p-4 sm:grid-cols-[minmax(12rem,1fr)_12rem] sm:p-5">
                <label className="relative block">
                  <span className="sr-only">Cari produk</span>
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle"
                  />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Cari nama produk atau SKU..."
                    className={`${inputClass} pl-10`}
                  />
                </label>
                <label className="relative block">
                  <span className="sr-only">Filter kategori</span>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className={`${inputClass} appearance-none pr-9`}
                  >
                    <option value="all">Semua kategori</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-subtle"
                  />
                </label>
                <div
                  className="flex flex-wrap gap-2 sm:col-span-2"
                  role="group"
                  aria-label="Filter stok"
                >
                  {(
                    [
                      { id: "all", label: "Semua stok" },
                      { id: "low", label: `Stok menipis (${lowStockCount})` },
                      { id: "empty", label: `Stok habis (${emptyStockCount})` },
                    ] as const
                  ).map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setStockFilter(filter.id)}
                      className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${stockFilter === filter.id ? "border-cobalt bg-cobalt/5 text-cobalt" : "border-line text-subtle hover:bg-mist hover:text-ink"}`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
              {loading ? (
                <div className="space-y-3 p-4 sm:p-5" aria-label="Memuat produk">
                  {Array.from({ length: 5 }, (_, index) => (
                    <div key={index} className="flex items-center gap-3 rounded-xl border border-line p-4">
                      <Skeleton className="size-10 shrink-0 rounded-lg" />
                      <div className="min-w-0 flex-1 space-y-2"><Skeleton className="h-4 w-40 max-w-full" /><Skeleton className="h-3 w-24" /></div>
                      <Skeleton className="hidden h-5 w-20 sm:block" />
                      <Skeleton className="h-8 w-16 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="grid min-h-64 place-items-center px-6 py-12 text-center">
                  <div className="max-w-sm">
                    <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-mist text-subtle">
                      <PackagePlus size={23} />
                    </span>
                    <h2 className="mt-4 font-semibold text-ink">
                      {products.length
                        ? "Produk tidak ditemukan"
                        : "Belum ada produk"}
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-subtle">
                      {products.length
                        ? "Coba ubah kata kunci atau filter yang dipilih."
                        : "Tambahkan produk pertama agar katalog inventaris mulai terisi."}
                    </p>
                    {!products.length && (
                      <button
                        onClick={openNewProduct}
                        className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-cobalt px-3 text-sm font-semibold text-white"
                      >
                        <Plus size={16} />
                        Tambah produk
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <ProductsTable
                    products={filteredProducts}
                    categories={categories}
                    admin={admin}
                    money={money}
                    onAdjustStock={openStockAdjustment}
                    onViewMovements={openStockMovements}
                    onEdit={openEditProduct}
                    onDelete={setDeleteProductTarget}
                  />
                  <ProductCards
                    products={filteredProducts}
                    categories={categories}
                    admin={admin}
                    money={money}
                    onAdjustStock={openStockAdjustment}
                    onViewMovements={openStockMovements}
                    onEdit={openEditProduct}
                    onDelete={setDeleteProductTarget}
                  />
                  <div className="flex items-center justify-between border-t border-line px-4 py-3 text-xs text-subtle sm:px-5">
                    <span>
                      Menampilkan {filteredProducts.length} dari{" "}
                      {products.length} produk
                    </span>
                    <button
                      onClick={() => void loadData()}
                      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 hover:bg-mist hover:text-ink"
                    >
                      <RefreshCw size={13} />
                      Muat ulang
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              {loading ? (
                <div className="divide-y divide-line" aria-label="Memuat kategori">
                  {Array.from({ length: 4 }, (_, index) => (
                    <div key={index} className="flex items-center gap-3 p-4 sm:px-5">
                      <Skeleton className="size-10 shrink-0 rounded-xl" />
                      <div className="min-w-0 flex-1 space-y-2"><Skeleton className="h-4 w-36 max-w-full" /><Skeleton className="h-3 w-56 max-w-full" /></div>
                      <Skeleton className="size-9 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : categories.length === 0 ? (
                <div className="grid min-h-64 place-items-center px-6 py-12 text-center">
                  <div>
                    <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-mist text-subtle">
                      <Tag size={22} />
                    </span>
                    <h2 className="mt-4 font-semibold text-ink">
                      Belum ada kategori
                    </h2>
                    <p className="mt-1 text-sm text-subtle">
                      Buat kategori untuk mengelompokkan produk.
                    </p>
                    <button
                      onClick={openNewCategory}
                      className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-cobalt px-3 text-sm font-semibold text-white"
                    >
                      <Plus size={16} />
                      Tambah kategori
                    </button>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-line">
                  {categories.map((category) => {
                    const count = products.filter(
                      (p) => p.category_id === category.id,
                    ).length;
                    return (
                      <article
                        key={category.id}
                        className="flex items-start gap-3 p-4 sm:items-center sm:px-5"
                      >
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-cobalt/10 text-cobalt">
                          <Tag size={18} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-ink">
                              {category.name}
                            </h3>
                            <span className="rounded-md bg-mist px-2 py-0.5 text-xs text-subtle">
                              {count} produk
                            </span>
                          </div>
                          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-subtle">
                            {category.desc || "Tidak ada deskripsi"}
                          </p>
                        </div>
                        {admin && (
                          <div className="flex gap-1">
                            <button
                              aria-label={`Edit kategori ${category.name}`}
                              onClick={() => openEditCategory(category)}
                              className="grid size-9 place-items-center rounded-lg border border-line text-subtle hover:bg-mist hover:text-ink"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              aria-label={`Hapus kategori ${category.name}`}
                              onClick={() => setDeleteTarget(category)}
                              className="grid size-9 place-items-center rounded-lg border border-line text-subtle hover:bg-red-200 hover:text-red-700"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
              <div className="flex items-center justify-between border-t border-line px-4 py-3 text-xs text-subtle sm:px-5">
                <span>{categories.length} kategori</span>
                <button
                  onClick={() => void loadData()}
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 hover:bg-mist hover:text-ink"
                >
                  <RefreshCw size={13} />
                  Muat ulang
                </button>
              </div>
            </>
          )}
        </section>
      </div>

      {stockAdjustmentTarget && (
        <StockAdjustmentModal
          product={stockAdjustmentTarget}
          saving={saving}
          adjustmentStock={adjustmentStock}
          adjustmentNote={adjustmentNote}
          stockAction={stockAction}
          onStockActionChange={setStockAction}
          onStockChange={setAdjustmentStock}
          onNoteChange={setAdjustmentNote}
          onSubmit={submitStockAdjustment}
          onClose={() => setStockAdjustmentTarget(null)}
        />
      )}

      {productModal && (
        <Modal
          title={editingProduct ? "Edit produk" : "Tambah produk"}
          onClose={() => !saving && setProductModal(false)}
        >
          <form onSubmit={saveProduct} className="flex min-h-0 flex-1 flex-col">
            <div className="space-y-4 overflow-y-auto px-5 py-5">
              <Field label="Nama produk">
                <input
                  autoFocus
                  required
                  maxLength={255}
                  value={productForm.name}
                  onChange={(e) =>
                    setProductForm({ ...productForm, name: e.target.value })
                  }
                  placeholder="Contoh: Kopi susu"
                  className={inputClass}
                />
              </Field>
              <Field label="SKU" hint="Kode unik produk, misalnya MNM-001.">
                <input
                  required
                  maxLength={255}
                  value={productForm.sku}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      sku: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="MNM-001"
                  className={`${inputClass} font-mono uppercase`}
                />
              </Field>
              <Field label="Kategori">
                <select
                  required
                  value={productForm.category_id}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      category_id: e.target.value,
                    })
                  }
                  className={inputClass}
                >
                  <option value="">Pilih kategori</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Harga jual (Rp)">
                  <input
                    required
                    type="number"
                    min="0"
                    step="1"
                    value={productForm.price}
                    onChange={(e) =>
                      setProductForm({ ...productForm, price: e.target.value })
                    }
                    placeholder="0"
                    className={inputClass}
                  />
                </Field>
                <Field
                  label={editingProduct ? "Stok saat ini" : "Stok awal"}
                  hint={
                    editingProduct
                      ? "Stok dikunci untuk menjaga riwayat penyesuaian. Gunakan fitur stock adjustment untuk mengubah stok."
                      : "Stok awal saat produk dibuat."
                  }
                >
                  <input
                    required
                    type="number"
                    min="0"
                    step="1"
                    value={productForm.stock}
                    disabled={!!editingProduct}
                    onChange={(e) =>
                      setProductForm({ ...productForm, stock: e.target.value })
                    }
                    className={inputClass}
                  />
                </Field>
              </div>
              <Field label="Deskripsi (opsional)">
                <textarea
                  maxLength={5000}
                  value={productForm.desc}
                  onChange={(e) =>
                    setProductForm({ ...productForm, desc: e.target.value })
                  }
                  placeholder="Informasi tambahan tentang produk..."
                  className={textareaClass}
                />
              </Field>
            </div>
            <div className="flex gap-3 border-t border-line bg-white px-5 py-4">
              <button
                type="button"
                disabled={saving}
                onClick={() => setProductModal(false)}
                className="h-11 flex-1 rounded-lg border border-line px-4 text-sm font-semibold text-ink hover:bg-mist disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving || categories.length === 0}
                className="inline-flex h-11 flex-[1.5] items-center justify-center gap-2 rounded-lg bg-cobalt px-4 text-sm font-semibold text-white hover:bg-cobalt-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : (
                  <Check size={17} />
                )}
                {saving ? "Menyimpan..." : "Simpan produk"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {categoryModal && (
        <Modal
          title={editingCategory ? "Edit kategori" : "Tambah kategori"}
          onClose={() => !saving && setCategoryModal(false)}
        >
          <form
            onSubmit={saveCategory}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="space-y-4 px-5 py-5">
              <Field label="Nama kategori">
                <input
                  autoFocus
                  required
                  maxLength={255}
                  value={categoryForm.name}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, name: e.target.value })
                  }
                  placeholder="Contoh: Minuman"
                  className={inputClass}
                />
              </Field>
              <Field label="Deskripsi (opsional)">
                <textarea
                  maxLength={5000}
                  value={categoryForm.desc}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, desc: e.target.value })
                  }
                  placeholder="Deskripsi singkat kategori..."
                  className={textareaClass}
                />
              </Field>
            </div>
            <div className="mt-auto flex gap-3 border-t border-line px-5 py-4">
              <button
                type="button"
                disabled={saving}
                onClick={() => setCategoryModal(false)}
                className="h-11 flex-1 rounded-lg border border-line px-4 text-sm font-semibold text-ink hover:bg-mist"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-11 flex-[1.5] items-center justify-center gap-2 rounded-lg bg-cobalt px-4 text-sm font-semibold text-white hover:bg-cobalt-dark disabled:opacity-50"
              >
                {saving ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : (
                  <Check size={17} />
                )}
                {saving ? "Menyimpan..." : "Simpan kategori"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteProductTarget && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/55 p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !deleting)
              setDeleteProductTarget(null);
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-product-title"
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
          >
            <span className="grid size-11 place-items-center rounded-xl bg-red-50 text-red-700">
              <Trash2 size={20} />
            </span>
            <h2
              id="delete-product-title"
              className="mt-4 text-lg font-bold text-ink"
            >
              Hapus produk?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-subtle">
              Produk{" "}
              <strong className="text-ink">{deleteProductTarget.name}</strong>{" "}
              akan dihapus dari katalog. Pastikan produk ini memang tidak lagi
              diperlukan.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                disabled={deleting}
                onClick={() => setDeleteProductTarget(null)}
                className="h-11 flex-1 rounded-lg border border-line text-sm font-semibold text-ink hover:bg-mist"
              >
                Batal
              </button>
              <button
                disabled={deleting}
                onClick={() => void deleteProduct()}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                {deleting ? "Menghapus..." : "Hapus produk"}
              </button>
            </div>
          </section>
        </div>
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/55 p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !deleting)
              setDeleteTarget(null);
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
          >
            <span className="grid size-11 place-items-center rounded-xl bg-red-50 text-red-700">
              <Trash2 size={20} />
            </span>
            <h2 id="delete-title" className="mt-4 text-lg font-bold text-ink">
              Hapus kategori?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-subtle">
              Kategori <strong className="text-ink">{deleteTarget.name}</strong>{" "}
              akan dihapus. Kategori yang masih digunakan produk tidak dapat
              dihapus.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="h-11 flex-1 rounded-lg border border-line text-sm font-semibold text-ink hover:bg-mist"
              >
                Batal
              </button>
              <button
                disabled={deleting}
                onClick={() => void deleteCategory()}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                {deleting ? "Menghapus..." : "Hapus kategori"}
              </button>
            </div>
          </section>
        </div>
      )}
      {stockMovementTarget && (
        <StockMovementsModal
          product={stockMovementTarget}
          movements={stockMovements}
          loading={loadingMovements}
          onClose={() => setStockMovementTarget(null)}
        />
      )}
    </main>
  );
}
