import Skeleton from "@/components/ui/Skeleton";
import type { Product, StockMovement } from "@/types/product";
import Modal from "@/components/products/Modal";

type StockMovementsModalProps = {
  product: Product;
  movements: StockMovement[];
  loading: boolean;
  onClose: () => void;
};

export default function StockMovementsModal({
  product,
  movements,
  loading,
  onClose,
}: StockMovementsModalProps) {
  return (
    <Modal title="Riwayat Stock Movement" onClose={onClose}>
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        <div className="rounded-xl border border-line bg-mist/60 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-subtle">
            Produk
          </p>

          <p className="mt-1 font-semibold text-ink">{product.name}</p>

          <p className="mt-1 font-mono text-xs text-subtle">{product.sku}</p>

          <p className="mt-3 text-sm text-subtle">
            Stok saat ini: <strong className="text-ink">{product.stock}</strong>
          </p>
        </div>

        {loading ? (
          <div className="space-y-3" aria-label="Memuat riwayat stok">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="rounded-xl border border-line p-4">
                <div className="flex justify-between gap-4"><Skeleton className="h-4 w-28" /><Skeleton className="h-4 w-12" /></div>
                <Skeleton className="mt-4 h-3 w-24" />
                <Skeleton className="mt-2 h-4 w-3/4" />
                <Skeleton className="mt-4 h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : movements.length === 0 ? (
          <p className="py-8 text-center text-sm text-subtle">
            Belum ada riwayat pergerakan stok.
          </p>
        ) : (
          movements.map((movement) => (
            <article
              key={movement.id}
              className="rounded-xl border border-line p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-ink">
                  {movement.type === "IN"
                    ? "Stok masuk"
                    : movement.type === "OUT"
                      ? "Stok keluar"
                      : "Penyesuaian stok"}
                </span>

                <span className="text-sm font-bold tabular-nums">
                  {movement.quantity > 0 ? "+" : ""}
                  {movement.quantity}
                </span>
              </div>

              <p className="mt-3 text-xs font-semibold text-subtle">
                KETERANGAN
              </p>

              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-ink">
                {movement.note || "Tidak ada keterangan"}
              </p>

              <div className="mt-3 border-t border-line pt-3 text-xs text-subtle">
                <p>
                  Tanggal:{" "}
                  {new Date(movement.created_at).toLocaleString("id-ID")}
                </p>

                <p className="mt-1">
                  Diubah oleh:{" "}
                  <span className="font-medium text-ink">
                    {movement.user?.name || "Pengguna tidak tersedia"}
                  </span>
                </p>
              </div>
            </article>
          ))
        )}

        <button
          type="button"
          onClick={onClose}
          className="h-11 w-full rounded-lg border border-line text-sm font-semibold text-ink hover:bg-mist"
        >
          Tutup
        </button>
      </div>
    </Modal>
  );
}
