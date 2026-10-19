import { History, PackagePlus, Pencil, Trash2 } from "lucide-react";

import type { Product, Category } from "@/types/product";
import StockBadge from "@/components/stock/StockBadge";

type ProductCardsProps = {
  products: Product[];
  categories: Category[];
  admin: boolean;
  money: (value: number | string) => string;
  onAdjustStock: (product: Product) => void;
  onViewMovements: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
};

export default function ProductCards({
  products,
  categories,
  admin,
  money,
  onAdjustStock,
  onViewMovements,
  onEdit,
  onDelete,
}: ProductCardsProps) {
  return (
    <div className=" md:hidden">
      {products.map((product) => (
        <article
          key={product.id}
          className="border-t-2 border-dashed border-line p-4 first:border-t-0"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="break-words font-semibold text-ink">
                {product.name}
              </h3>

              <p className="mt-1 font-mono text-xs text-subtle">
                {product.sku}
              </p>

              <p className="mt-2 text-xs text-subtle">
                {product.category?.name ||
                  categories.find(
                    (category) => category.id === product.category_id,
                  )?.name ||
                  "Tanpa kategori"}
              </p>
            </div>

            <div className="flex shrink-0 gap-1">
              <button
                aria-label={`Atur stok ${product.name}`}
                onClick={() => onAdjustStock(product)}
                className="grid size-9 place-items-center rounded-lg border border-line text-subtle hover:bg-mist hover:text-ink"
              >
                <PackagePlus size={16} />
              </button>

              <button
                aria-label={`Riwayat stok ${product.name}`}
                onClick={() => onViewMovements(product)}
                className="grid size-9 place-items-center rounded-lg border border-line text-subtle hover:bg-mist hover:text-ink"
              >
                <History size={16} />
              </button>

              {admin && (
                <div className="flex gap-1">
                  <button
                    aria-label={`Edit ${product.name}`}
                    onClick={() => onEdit(product)}
                    className="grid size-9 place-items-center rounded-lg border border-line text-subtle hover:bg-mist hover:text-ink"
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    aria-label={`Hapus ${product.name}`}
                    onClick={() => onDelete(product)}
                    className="grid size-9 place-items-center rounded-lg border border-line text-subtle hover:bg-red-200 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs text-subtle">Harga jual</p>
              <p className="mt-1 font-semibold text-ink">
                {money(product.price)}
              </p>
            </div>

            <div className="text-right">
              <p className="mb-1 text-xs text-subtle">Stok saat ini</p>
              <StockBadge stock={product.stock} />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
