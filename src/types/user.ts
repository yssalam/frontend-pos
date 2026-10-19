export type Role = "super_admin" | "admin" | "cashier";
export type NewRole = "admin" | "cashier";

export type UserItem = {
  id: number;
  name: string;
  email: string;
  role: Role | string;
  status?: string;
  is_active?: boolean;
  active?: boolean;
  created_at?: string;
  last_login_at?: string | null;
};

export type FieldErrors = Partial<
  Record<"name" | "email" | "password" | "password_confirmation" | "role", string>
>;

export type FormSubmitHandler = NonNullable<
  import("react").ComponentProps<"form">["onSubmit"]
>;
