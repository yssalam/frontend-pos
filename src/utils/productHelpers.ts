export const emptyProductForm = {
  name: "",
  sku: "",
  category_id: "",
  price: "",
  stock: "0",
  desc: "",
};

export const emptyCategoryForm = {
  name: "",
  desc: "",
};

export const money = (value: number | string) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

export const errorMessage = (error: unknown) => {
  const e = error as {
    response?: {
      data?: {
        message?: string;
        errors?: Record<string, string[]>;
      };
    };
    message?: string;
  };

  const validation = e.response?.data?.errors;

  if (validation) {
    return Object.values(validation).flat().join(" ");
  }

  return (
    e.response?.data?.message ||
    e.message ||
    "Terjadi kesalahan. Silakan coba lagi."
  );
};

export const unwrap = <T>(response: { data: { data?: T } | T }): T => {
  const body = response.data as { data?: T };
  return (body?.data ?? response.data) as T;
};
