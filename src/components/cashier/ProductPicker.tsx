import { Minus, Plus, Search, ShoppingBag } from "lucide-react";
import Skeleton from "@/components/ui/Skeleton";
import type { Product } from "@/types/product";
import { money } from "@/utils/productHelpers";

type ProductPickerProps = {
  products: Product[];
  query: string;
  selectedCategory: string;
  categories: { value: string; label: string }[];
  onQueryChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onAdd: (product: Product) => void;
  quantities: Map<number, number>;
  loading?: boolean;
};

export default function ProductPicker({
  products,
  query,
  selectedCategory,
  categories,
  onQueryChange,
  onCategoryChange,
  onAdd,
  quantities,
  loading = false,
}: ProductPickerProps) {
  return (
    <section className="min-w-0 rounded-2xl bg-white p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-cobalt">
            Mulai transaksi
          </p>
          <h2 className="mt-1 font-display text-xl font-bold">Pilih produk</h2>
        </div>
        <label className="flex h-11 items-center gap-2 rounded-xl border border-line px-3 sm:w-64">
          <Search size={17} className="text-subtle" />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Cari nama atau SKU"
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>
      </div>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {categories.map((category) => (
          <button
            key={category.value}
            onClick={() => onCategoryChange(category.value)}
            className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${selectedCategory === category.value ? "border-cobalt bg-cobalt/5 text-cobalt" : "border-line text-subtle hover:bg-mist hover:text-ink"}`}
          >
            {category.label}
          </button>
        ))}
      </div>
      {loading ? (
        <div
          className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-3"
          aria-label="Memuat produk"
        >
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="flex min-h-36 flex-col rounded-xl border border-line p-3"
            >
              <div className="flex justify-between">
                <Skeleton className="size-9 rounded-lg" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <Skeleton className="mt-4 h-4 w-4/5" />
              <Skeleton className="mt-2 h-3 w-1/2" />
              <div className="mt-auto flex justify-between pt-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="size-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length ? (
        <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-3">
          {products.map((product) => {
            const qty = quantities.get(product.id) ?? 0;
            return (
              <article
                key={product.id}
                role="button"
                tabIndex={product.stock > 0 ? 0 : -1}
                aria-label={`Tambah ${product.name} ke keranjang`}
                aria-disabled={product.stock <= 0}
                onClick={(event) => {
                  if (product.stock <= 0) return;
                  if ((event.target as HTMLElement).closest("button")) return;
                  onAdd(product);
                }}
                onKeyDown={(event) => {
                  if (
                    (event.key === "Enter" || event.key === " ") &&
                    product.stock > 0
                  ) {
                    event.preventDefault();
                    onAdd(product);
                  }
                }}
                className={`flex min-h-36 flex-col rounded-xl border border-line p-3 transition hover:border-cobalt/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt ${product.stock <= 0 ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="grid size-9 place-items-center rounded-lg bg-mist text-cobalt">
                    <ShoppingBag size={17} />
                  </span>
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-semibold ${product.stock <= 0 ? "bg-red-50 text-red-700" : "bg-mist text-subtle"}`}
                  >
                    {product.stock <= 0 ? "Habis" : `Stok ${product.stock}`}
                  </span>
                </div>
                <h3 className="mt-3 line-clamp-2 text-sm font-semibold">
                  {product.name}
                </h3>
                <p className="mt-1 text-xs text-subtle">{product.sku}</p>
                <div className="mt-auto flex items-end justify-between gap-2 pt-3">
                  <span className="text-sm font-bold">
                    {money(product.price)}
                  </span>
                  {qty ? (
                    <span className="inline-flex items-center gap-2">
                      <button
                        aria-label={`Kurangi ${product.name}`}
                        onClick={() =>
                          onAdd({
                            id: product.id,
                            category_id: product.category_id,
                            name: product.name,
                            sku: product.sku,
                            price: product.price,
                            stock: 0,
                            desc: product.desc,
                          })
                        }
                        className="grid size-7 place-items-center rounded-lg border border-line cursor-pointer"
                      >
                        <Minus size={14} />
                      </button>
                      <b className="text-sm">{qty}</b>
                      <button
                        aria-label={`Tambah ${product.name}`}
                        disabled={qty >= product.stock}
                        onClick={() => onAdd(product)}
                        className="grid size-7 place-items-center rounded-lg bg-cobalt text-white disabled:opacity-40 cursor-pointer"
                      >
                        <Plus size={14} />
                      </button>
                    </span>
                  ) : (
                    <button
                      disabled={product.stock <= 0}
                      onClick={() => onAdd(product)}
                      className="grid size-7 place-items-center rounded-lg bg-cobalt text-white disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                      aria-label={`Tambah ${product.name}`}
                    >
                      <Plus size={14} />
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="grid min-h-48 place-items-center text-center text-sm text-subtle">
          Tidak ada produk yang cocok.
        </div>
      )}
    </section>
  );
}
