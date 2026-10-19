import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api from "@/lib/axios";
import type { LoginApiResponse, LoginValidationErrors } from "@/types/auth";

export function useLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setEmailError("");
    setPasswordError("");

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setEmailError("Isi email kamu.");
    } else if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setEmailError("Format email belum benar.");
    }

    if (!password) {
      setPasswordError("Isi kata sandi.");
    }

    if (
      !normalizedEmail ||
      !/^\S+@\S+\.\S+$/.test(normalizedEmail) ||
      !password
    ) {
      return;
    }

    setLoading(true);

    try {
      const response = await api.post<LoginApiResponse>("/login", {
        email: normalizedEmail,
        password,
      });

      const token = response.data?.data?.token ?? response.data?.token;
      const user = response.data?.data?.user ?? response.data?.user;

      if (!token) {
        setError("Login berhasil diproses, tetapi token tidak ditemukan.");
        return;
      }

      if (!user?.role) {
        console.error("Data user/role tidak ditemukan:", response.data);
        setError("Data role pengguna tidak ditemukan dari server.");
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("role", user.role);
      localStorage.setItem("user", JSON.stringify(user));

      window.dispatchEvent(new Event("auth-changed"));
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 422) {
          const errors = err.response.data?.errors as
            | LoginValidationErrors
            | undefined;

          setEmailError(errors?.email?.[0] ?? "");
          setPasswordError(errors?.password?.[0] ?? "");

          if (!errors?.email && !errors?.password) {
            setError("Data login belum valid.");
          }
        } else if (err.response?.status === 401) {
          setError("Email atau kata sandi salah. Coba periksa lagi.");
        } else {
          setError(
            "Tidak bisa masuk. Periksa koneksi atau coba lagi beberapa saat.",
          );
        }
      } else {
        setError("Terjadi kesalahan. Silakan coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    error,
    emailError,
    passwordError,
    setEmailError,
    setPasswordError,
    handleSubmit,
  };
}
