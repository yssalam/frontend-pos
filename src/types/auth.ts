import type { Role } from "@/types/user";

export type LoginCredentials = {
  email: string;
  password: string;
};

export type LoginApiResponse = {
  success?: boolean;
  message?: string;
  data?: {
    token?: string;
    user?: {
      id: number;
      name: string;
      email: string;
      role: Role;
    };
  };
  token?: string;
  user?: {
    id: number;
    name: string;
    email: string;
    role: Role;
  };
};

export type LoginValidationErrors = {
  email?: string[];
  password?: string[];
};
