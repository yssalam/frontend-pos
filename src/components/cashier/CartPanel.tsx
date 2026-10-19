import { Minus, Plus, ReceiptText, Trash2 } from "lucide-react";
import type { CartItem, PaymentMethod } from "@/types/cashier";
import { money } from "@/utils/productHelpers";

type CartPanelProps = {
  items: CartItem[];
  paymentMethod: PaymentMethod;
  onPaymentChange: (value: PaymentMethod) => void;
  onQuantityChange: (productId: number, delta: number) => void;
  onRemove: (productId: number) => void;
  onClear: () => void;
  onCheckout: () => void;
  processing: boolean;
};
export default function CartPanel({
  items,
  paymentMethod,
  onPaymentChange,
  onQuantityChange,
  onRemove,
  onClear,
  onCheckout,
  processing,
}: CartPanelProps) {
  const total = items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0,
  );
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  return (
    <section className="flex flex-col rounded-2xl bg-white p-4 sm:p-5 lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-cobalt">
            Pesanan
          </p>
          <h2 className="mt-1 font-display text-xl font-bold">
            Keranjang{" "}
            <span className="text-sm font-medium text-subtle">({count})</span>
          </h2>
        </div>
        <button
          onClick={onClear}
          disabled={!items.length}
          className="rounded-lg p-2 text-subtle hover:bg-red-50 hover:text-red-700 disabled:opacity-40"
          aria-label="Kosongkan keranjang"
        >
          <Trash2 size={17} />
        </button>
      </div>
      <div className="mt-4 min-h-32 flex-1 space-y-3 overflow-y-auto lg:min-h-40">
        {items.length ? (
          items.map((item) => (
            <article
              key={item.product.id}
              className="rounded-xl border border-line p-3"
            >
              <div className="flex justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold">
                    {item.product.name}
                  </h3>
                  <p className="mt-1 text-xs text-subtle">
                    {money(item.product.price)} / item
                  </p>
                </div>
                <button
                  onClick={() => onRemove(item.product.id)}
                  aria-label={`Hapus ${item.product.name}`}
                  className="self-start p-1 text-subtle hover:text-red-700"
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-semibold">
                  {money(Number(item.product.price) * item.quantity)}
                </span>
                <div className="inline-flex items-center gap-3">
                  <button
                    onClick={() => onQuantityChange(item.product.id, -1)}
                    aria-label="Kurangi jumlah"
                    className="grid size-7 place-items-center rounded-lg border border-line"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="min-w-4 text-center text-sm font-semibold">
                    {item.quantity}
                  </span>
                  <button
                    disabled={item.quantity >= item.product.stock}
                    onClick={() => onQuantityChange(item.product.id, 1)}
                    aria-label="Tambah jumlah"
                    className="grid size-7 place-items-center rounded-lg bg-mist disabled:opacity-40"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="grid h-full min-h-32 place-items-center rounded-xl border border-dashed border-line px-4 text-center text-sm text-subtle">
            <div>
              <ReceiptText className="mx-auto mb-2" size={22} />
              Keranjang masih kosong.
              <br />
              Pilih produk untuk memulai.
            </div>
          </div>
        )}
      </div>
      <div className="mt-4 border-t border-dashed border-line pt-4">
        <label
          className="text-xs font-semibold text-subtle"
          htmlFor="payment-method"
        >
          Metode pembayaran
        </label>
        <select
          id="payment-method"
          value={paymentMethod}
          onChange={(event) =>
            onPaymentChange(event.target.value as PaymentMethod)
          }
          className="mt-2 h-11 w-full rounded-xl border border-line bg-white px-3 text-sm"
        >
          <option value="cash">Tunai</option>
          <option value="qris">QRIS</option>
          <option value="transfer">Transfer</option>
        </select>
        <div className="mt-4 flex items-end justify-between">
          <span className="text-sm text-subtle">Total pembayaran</span>
          <strong className="font-display text-2xl">{money(total)}</strong>
        </div>
        <button
          onClick={onCheckout}
          disabled={!items.length || processing}
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-cobalt font-semibold text-white transition hover:bg-cobalt/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {processing ? (
            "Memproses..."
          ) : (
            <>
              Bayar sekarang <span aria-hidden="true">→</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
}
