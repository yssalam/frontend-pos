import type { PaymentMethod } from "@/types/cashier";

export type SaleRequest = {
  items: { product_id: number; quantity: number }[];
  payment_method: PaymentMethod;
};

export type Sale = {
  id: string;
  created_at: string;
  payment_method: PaymentMethod;
  total: number;
  items_count: number;
  items: {
    product_id: number;
    name: string;
    sku: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    stock: number;
  }[];
};
