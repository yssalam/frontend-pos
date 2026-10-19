export type Category = {
  id: number;
  name: string;
  desc: string | null;
  products_count?: number;
};

export type Product = {
  id: number;
  category_id: number;
  name: string;
  sku: string;
  price: number | string;
  stock: number;
  desc: string | null;
  category?: Category;
};

export type StockMovement = {
  id: number;
  product_id?: number;
  type: "IN" | "OUT" | "ADJUSTMENT";
  quantity: number;
  note: string | null;
  created_at: string;
  product?: Pick<Product, "id" | "name" | "sku" | "price" | "stock"> | null;
  user?: {
    id: number;
    name: string;
  } | null;
};

export type Tab = "products" | "categories";
export type StockFilter = "all" | "low" | "empty";

export type ProductForm = {
  name: string;
  sku: string;
  category_id: string;
  price: string;
  stock: string;
  desc: string;
};

export type CategoryForm = {
  name: string;
  desc: string;
};

export type Notice = {
  type: "success" | "error";
  text: string;
};
