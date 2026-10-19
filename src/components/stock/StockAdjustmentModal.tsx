import { LoaderCircle, Check } from "lucide-react";
import type { FormEvent } from "react";
import type { Product } from "@/types/product";
import Modal from "@/components/products/Modal";

type StockAdjustmentModalProps = {
  product: Product;
  saving: boolean;
  adjustmentStock: string;
  adjustmentNote: string;
  stockAction: "IN" | "ADJUSTMENT";
  onStockActionChange: (value: "IN" | "ADJUSTMENT") => void;
  onStockChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
};

export default function StockAdjustmentModal({
  product,
  saving,
  adjustmentStock,
  adjustmentNote,
  stockAction,
  onStockActionChange,
  onStockChange,
  onNoteChange,
  onSubmit,
  onClose,
}: StockAdjustmentModalProps) {
  return (
    <Modal
      title="Penyesuaian stok"
      onClose={() => {
        if (!saving) onClose();
      }}
    >
      <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="space-y-4 px-5 py-5">
          <div className="rounded-xl border border-line bg-mist/60 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-subtle">
              Produk
            </p>

            <p className="mt-1 font-semibold text-ink">{product.name}</p>

            <p className="mt-1 font-mono text-xs text-subtle">{product.sku}</p>

            <p className="mt-3 text-sm text-subtle">
              Stok saat ini:{" "}
              <strong className="text-ink">{product.stock}</strong>
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="stock-action" className="block text-sm font-medium text-ink">
              Jenis perubahan stok
            </label>
            <select
              id="stock-action"
              value={stockAction}
              onChange={(event) => onStockActionChange(event.target.value as "IN" | "ADJUSTMENT")}
              className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none focus:border-cobalt focus:ring-2 focus:ring-cobalt/20"
            >
              <option value="IN">Stok masuk</option>
              <option value="ADJUSTMENT">Adjustment / stok opname</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-ink">
              {stockAction === "IN" ? "Jumlah stok setelah barang masuk" : "Jumlah stok aktual"}
            </label>

            {((stockAction === "IN" && Number(adjustmentStock) <= product.stock) ||
              (stockAction === "ADJUSTMENT" && Number(adjustmentStock) === product.stock)) && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
                {stockAction === "IN"
                  ? "Stok tidak boleh kurang dari atau sama dengan stok awal"
                  : "Stok tidak boleh sama"}
              </p>
            )}

            <p className="text-xs text-subtle">
              {stockAction === "IN"
                ? "Masukkan total stok setelah barang masuk. Selisihnya dicatat sebagai stok masuk."
                : "Masukkan jumlah stok fisik yang benar. Sistem akan mencatat selisih stok opname."}
            </p>

            <input
              autoFocus
              required
              type="number"
              min="0"
              step="1"
              value={adjustmentStock}
              onChange={(event) => onStockChange(event.target.value)}
              className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none focus:border-cobalt focus:ring-2 focus:ring-cobalt/20"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-ink">
              {stockAction === "IN" ? "Catatan stok masuk" : "Alasan penyesuaian"}
            </label>

            <p className="text-xs text-subtle">
              Wajib diisi untuk keperluan audit stok.
            </p>

            <textarea
              required
              maxLength={1000}
              value={adjustmentNote}
              onChange={(event) => onNoteChange(event.target.value)}
              placeholder={stockAction === "IN" ? "Contoh: barang masuk dari supplier..." : "Contoh: hasil stok opname, barang rusak, koreksi selisih..."}
              className="min-h-28 w-full resize-y rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-cobalt focus:ring-2 focus:ring-cobalt/20"
            />
          </div>
        </div>

        <div className="mt-auto flex gap-3 border-t border-line px-5 py-4">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="h-11 flex-1 rounded-lg border border-line px-4 text-sm font-semibold text-ink hover:bg-mist disabled:opacity-50"
          >
            Batal
          </button>

          <button
            type="submit"
            disabled={
              saving ||
              !adjustmentNote.trim() ||
              adjustmentStock.trim() === "" ||
              (stockAction === "IN" && Number(adjustmentStock) <= product.stock) ||
              (stockAction === "ADJUSTMENT" && Number(adjustmentStock) === product.stock)
            }
            className="inline-flex h-11 flex-[1.5] items-center justify-center gap-2 rounded-lg bg-cobalt px-4 text-sm font-semibold text-white hover:bg-cobalt-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <Check size={17} />
            )}

            {saving
              ? "Menyimpan..."
              : stockAction === "IN"
                ? "Catat stok masuk"
                : "Simpan adjustment"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
