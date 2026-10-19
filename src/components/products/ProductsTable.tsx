import { History, PackagePlus, Pencil, Trash2 } from "lucide-react";
import type { Product, Category } from "@/types/product";
import StockBadge from "@/components/stock/StockBadge";

type ProductsTableProps = {
  products: Product[];
  categories: Category[];
  admin: boolean;
  money: (value: number | string) => string;
  onAdjustStock: (product: Product) => void;
  onViewMovements: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
};

export default function ProductsTable({
  products,
  categories,
  admin,
  money,
  onAdjustStock,
  onViewMovements,
  onEdit,
  onDelete,
}: ProductsTableProps) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full min-w-[720px] text-left">
        <thead className="bg-mist/70 text-xs font-semibold uppercase tracking-wide text-subtle">
          <tr>
            <th className="px-5 py-3">Produk</th>
            <th className="px-4 py-3">Kategori</th>
            <th className="px-4 py-3 text-right">Harga</th>
            <th className="px-4 py-3">Stok</th>
            <th className="px-5 py-3 text-right">Aksi</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-line">
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-mist/40">
              <td className="px-5 py-4">
                <p className="font-semibold text-ink">{product.name}</p>
                <p className="mt-1 font-mono text-xs text-subtle">
                  {product.sku}
                </p>
              </td>

              <td className="px-4 py-4">
                <span className="rounded-md bg-mist px-2 py-1 text-xs text-subtle">
                  {product.category?.name ||
                    categories.find(
                      (category) => category.id === product.category_id,
                    )?.name ||
                    "Tanpa kategori"}
                </span>
              </td>

              <td className="px-4 py-4 text-right font-medium tabular-nums text-ink">
                {money(product.price)}
              </td>

              <td className="px-4 py-4">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                    product.stock <= 0
                      ? "bg-red-50 text-red-700"
                      : product.stock <= 5
                        ? "bg-amber-50 text-amber-700"
                        : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  <StockBadge stock={product.stock} />
                </span>
              </td>

              <td className="px-5 py-4">
                <div className="flex justify-end gap-1">
                  <button
                    aria-label={`Atur stok ${product.name}`}
                    onClick={() => onAdjustStock(product)}
                    className="inline-flex h-9 items-center rounded-lg border border-line px-3 text-ink hover:bg-mist"
                  >
                    <PackagePlus size={14} />
                  </button>

                  <button
                    aria-label={`Riwayat stok ${product.name}`}
                    onClick={() => onViewMovements(product)}
                    className="inline-flex h-9 items-center rounded-lg border border-line px-3 text-ink hover:bg-mist"
                  >
                    <History size={14} />
                  </button>

                  {admin && (
                    <>
                      <button
                        aria-label={`Edit ${product.name}`}
                        onClick={() => onEdit(product)}
                        className="inline-flex h-9 items-center rounded-lg border border-line px-3 text-ink hover:bg-mist"
                      >
                        <Pencil size={14} />
                      </button>

                      <button
                        aria-label={`Hapus ${product.name}`}
                        onClick={() => onDelete(product)}
                        className="inline-flex h-9 items-center rounded-lg border border-line px-3 text-ink hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
