import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Check,
  LoaderCircle,
  Plus,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import api from "@/lib/axios";
import type {
  FieldErrors,
  FormSubmitHandler,
  NewRole,
  Role,
  UserItem,
} from "@/types/user";
import { unwrapUsers } from "@/utils/user";
import UsersToolbar from "@/components/users/UsersToolbar";
import UsersTable from "@/components/users/UsersTable";
import UsersAccessTable from "@/components/users/UsersAccessTable";

export default function UsersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<NewRole>("cashier");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function loadUsers() {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/admin/users");
      setUsers(unwrapUsers(response.data));
    } catch (err: any) {
      const status = err?.response?.status;
      setError(
        status === 403
          ? "Akun ini tidak memiliki akses untuk melihat daftar pengguna."
          : status === 404
            ? "Endpoint daftar pengguna belum tersedia. Tambahkan GET /admin/users di Laravel."
            : status === 405
              ? "Endpoint daftar pengguna belum menerima method GET. Periksa routes/api.php."
              : "Daftar pengguna gagal dimuat. Periksa koneksi dan API Laravel.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);
  useEffect(() => {
    const message = (location.state as { success?: string } | null)?.success;
    if (message) {
      setNotice(message);
      navigate(location.pathname, { replace: true, state: null });
      window.setTimeout(() => setNotice(""), 3500);
    }
  }, [location.pathname, location.state, navigate]);

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return users.filter((user) => {
      const matchesQuery =
        !normalized ||
        user.name?.toLowerCase().includes(normalized) ||
        user.email?.toLowerCase().includes(normalized);
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      return matchesQuery && matchesRole;
    });
  }, [users, query, roleFilter]);

  const count = (target: "all" | Role) =>
    target === "all"
      ? users.length
      : users.filter((user) => user.role === target).length;

  function openPanel() {
    setEditingUser(null);
    setName("");
    setEmail("");
    setRole("cashier");
    setPassword("");
    setPasswordConfirmation("");
    setShowPassword(false);
    setShowConfirmation(false);
    setFormError("");
    setFieldErrors({});
    setPanelOpen(true);
  }

  function openEditPanel(user: UserItem) {
    if (user.role === "super_admin") return;
    setEditingUser(user);
    setName(user.name ?? "");
    setEmail(user.email ?? "");
    setRole(user.role === "admin" ? "admin" : "cashier");
    setPassword("");
    setPasswordConfirmation("");
    setShowPassword(false);
    setShowConfirmation(false);
    setFormError("");
    setFieldErrors({});
    setPanelOpen(true);
  }

  function closePanel() {
    if (submitting) return;
    setPanelOpen(false);
  }

  function generatePassword() {
    const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const values = new Uint32Array(12);
    window.crypto.getRandomValues(values);
    const generated = Array.from(
      values,
      (value) => alphabet[value % alphabet.length],
    ).join("");
    setPassword(generated);
    setPasswordConfirmation(generated);
    setShowPassword(true);
    setShowConfirmation(true);
    setFieldErrors((current) => ({
      ...current,
      password: undefined,
      password_confirmation: undefined,
    }));
  }

  const handleSubmit: FormSubmitHandler = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setFormError("");
    setFieldErrors({});
    const nextErrors: FieldErrors = {};
    if (!name.trim()) nextErrors.name = "Isi nama lengkap.";

    if (!/^\S+@\S+\.\S+$/.test(email.trim()))
      nextErrors.email = "Format email belum benar. Contoh: sari@toko.com";

    if (!editingUser && password.length < 8) {
      nextErrors.password = "Kata sandi minimal 8 karakter.";
    }

    if (editingUser && password && password.length < 8) {
      nextErrors.password = "Kata sandi minimal 8 karakter.";
    }

    if (password && password !== passwordConfirmation) {
      nextErrors.password_confirmation = "Konfirmasi kata sandi belum sama.";
    }

    if (!editingUser && password !== passwordConfirmation) {
      nextErrors.password_confirmation = "Konfirmasi kata sandi belum sama.";
    }

    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);

      return;
    }

    setSubmitting(true);

    try {
      const payload: {
        name: string;
        email: string;
        role: NewRole;
        password?: string;
        password_confirmation?: string;
      } = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
      };

      if (password) {
        payload.password = password;
        payload.password_confirmation = passwordConfirmation;
      }

      if (editingUser) {
        await api.put(`/admin/users/${editingUser.id}`, payload);
      } else {
        await api.post("/admin/users", {
          ...payload,
          password,
          password_confirmation: passwordConfirmation,
        });
      }
      setPanelOpen(false);
      setNotice(
        editingUser
          ? "Data pengguna berhasil diperbarui."
          : "Pengguna berhasil ditambahkan.",
      );
      setEditingUser(null);
      window.setTimeout(() => setNotice(""), 3500);
      setQuery("");
      setRoleFilter("all");
      await loadUsers();
    } catch (err: any) {
      const status = err?.response?.status;
      const responseErrors = err?.response?.data?.errors;
      if (status === 422 && responseErrors) {
        const mapped: FieldErrors = {};
        for (const key of [
          "name",
          "email",
          "password",
          "password_confirmation",
          "role",
        ] as const) {
          if (responseErrors[key]?.[0]) mapped[key] = responseErrors[key][0];
        }
        setFieldErrors(mapped);
        setFormError("Periksa kembali data yang dimasukkan.");
      } else if (status === 401)
        setFormError("Sesi login berakhir. Silakan masuk kembali.");
      else if (status === 403)
        setFormError("Akun ini tidak memiliki izin untuk membuat pengguna.");
      else
        setFormError(
          err?.response?.data?.message ||
            (editingUser
              ? "Data pengguna gagal diperbarui. Periksa koneksi dan coba lagi."
              : "Pengguna gagal dibuat. Periksa koneksi dan coba lagi."),
        );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-dvh bg-mist px-4 pt-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] font-sans text-ink sm:px-6 lg:px-10 lg:pt-10 lg:pb-12">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-col gap-4 mb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-cobalt">
              Profil
            </p>
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Pengguna
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-subtle">
              Kelola pengguna, hanya super admin yang dapat menambahkan akun.
            </p>
          </div>
          <button
            type="button"
            onClick={openPanel}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-cobalt px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-cobalt-dark focus:outline-none focus:ring-4 focus:ring-cobalt/20"
          >
            <Plus size={20} /> Tambah pengguna
          </button>
        </div>

        {notice && (
          <div
            role="status"
            className="mb-4 rounded-lg bg-ink px-4 py-3 text-sm font-medium text-white"
          >
            {notice}
          </div>
        )}

        <UsersToolbar
          query={query}
          setQuery={setQuery}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          count={count}
          loading={loading}
          loadUsers={loadUsers}
        />

        <UsersTable
          error={error}
          loading={loading}
          filteredUsers={filteredUsers}
          openEditPanel={openEditPanel}
        />

        <UsersAccessTable />

        {panelOpen && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-ink/55 lg:items-stretch lg:justify-end"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closePanel();
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="create-user-heading"
              className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-paper text-ink shadow-2xl lg:h-dvh lg:max-h-none lg:w-[30rem] lg:rounded-none"
            >
              <form
                onSubmit={handleSubmit}
                noValidate
                className="flex min-h-0 flex-1 flex-col"
              >
                <div className="flex items-center justify-between gap-3 border-b-2 border-dashed border-line px-5 py-4 sm:px-6">
                  <h2
                    id="create-user-heading"
                    className="font-display text-xl font-bold tracking-tight"
                  >
                    {editingUser ? "Ubah pengguna" : "Tambah pengguna"}
                  </h2>
                  <button
                    type="button"
                    onClick={closePanel}
                    aria-label="Tutup panel"
                    className="grid size-11 place-items-center rounded-lg hover:bg-mist focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cobalt/30"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
                  {formError && (
                    <div
                      role="alert"
                      className="flex items-start gap-2 rounded-lg bg-[#fbeae7] p-3 text-sm text-danger"
                    >
                      <AlertCircle size={18} className="mt-0.5 shrink-0" />
                      {formError}
                    </div>
                  )}
                  <div>
                    <label
                      htmlFor="new-user-name"
                      className="mb-1.5 block text-sm font-medium"
                    >
                      Nama lengkap
                    </label>
                    <input
                      id="new-user-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      placeholder="Sari Wulandari"
                      aria-invalid={!!fieldErrors.name}
                      className="h-12 w-full rounded-lg border-2 border-line bg-paper px-4 text-base placeholder:text-[#6b7b8f] focus:border-cobalt focus:outline-none focus-visible:ring-4 focus-visible:ring-cobalt/20 aria-invalid:border-danger"
                    />
                    {fieldErrors.name && (
                      <p className="mt-1.5 text-sm text-danger">
                        {fieldErrors.name}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="new-user-email"
                      className="mb-1.5 block text-sm font-medium"
                    >
                      Email
                    </label>
                    <input
                      id="new-user-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      placeholder="sari@toko.com"
                      aria-invalid={!!fieldErrors.email}
                      className="h-12 w-full rounded-lg border-2 border-line bg-paper px-4 text-base placeholder:text-[#6b7b8f] focus:border-cobalt focus:outline-none focus-visible:ring-4 focus-visible:ring-cobalt/20 aria-invalid:border-danger"
                    />
                    {fieldErrors.email ? (
                      <p className="mt-1.5 text-sm text-danger">
                        {fieldErrors.email}
                      </p>
                    ) : (
                      <p className="mt-1.5 text-sm text-subtle">
                        Dipakai untuk masuk ke kasir.
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="new-user-password"
                      className="mb-1.5 block text-sm font-medium"
                    >
                      Kata sandi
                    </label>
                    <div className="relative">
                      <input
                        id="new-user-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        placeholder={
                          editingUser
                            ? "Kosongkan jika tidak ingin mengganti password"
                            : "Minimal 8 karakter"
                        }
                        aria-invalid={!!fieldErrors.password}
                        className="h-12 w-full rounded-lg border-2 border-line bg-paper pr-[8.5rem] pl-4 text-base placeholder:text-[#6b7b8f] focus:border-cobalt focus:outline-none focus-visible:ring-4 focus-visible:ring-cobalt/20 aria-invalid:border-danger"
                      />
                      <div className="absolute inset-y-1 right-1 flex items-center">
                        <button
                          type="button"
                          onClick={generatePassword}
                          className="h-10 rounded-md px-2.5 text-sm font-medium text-cobalt hover:bg-mist"
                        >
                          Buat acak
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          aria-label={
                            showPassword
                              ? "Sembunyikan kata sandi"
                              : "Tampilkan kata sandi"
                          }
                          className="grid size-10 place-items-center rounded-md text-cobalt hover:bg-mist"
                        >
                          {showPassword ? (
                            <EyeOff size={17} />
                          ) : (
                            <Eye size={17} />
                          )}
                        </button>
                      </div>
                    </div>
                    {fieldErrors.password ? (
                      <p className="mt-1.5 text-sm text-danger">
                        {fieldErrors.password}
                      </p>
                    ) : (
                      <p className="mt-1.5 text-sm text-subtle">
                        Berikan kata sandi ini ke pemiliknya secara langsung.
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="new-user-password-confirm"
                      className="mb-1.5 block text-sm font-medium"
                    >
                      Konfirmasi kata sandi
                    </label>
                    <div className="relative">
                      <input
                        id="new-user-password-confirm"
                        type={showConfirmation ? "text" : "password"}
                        value={passwordConfirmation}
                        onChange={(e) =>
                          setPasswordConfirmation(e.target.value)
                        }
                        autoComplete="new-password"
                        placeholder={
                          editingUser
                            ? "Kosongkan jika tidak ingin mengganti password"
                            : "Minimal 8 karakter"
                        }
                        aria-invalid={!!fieldErrors.password_confirmation}
                        className="h-12 w-full rounded-lg border-2 border-line bg-paper px-4 pr-12 text-base placeholder:text-[#6b7b8f] focus:border-cobalt focus:outline-none focus-visible:ring-4 focus-visible:ring-cobalt/20 aria-invalid:border-danger"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmation((v) => !v)}
                        aria-label={
                          showConfirmation
                            ? "Sembunyikan konfirmasi"
                            : "Tampilkan konfirmasi"
                        }
                        className="absolute inset-y-1 right-1 grid size-10 place-items-center rounded-md text-cobalt hover:bg-mist"
                      >
                        {showConfirmation ? (
                          <EyeOff size={17} />
                        ) : (
                          <Eye size={17} />
                        )}
                      </button>
                    </div>
                    {fieldErrors.password_confirmation && (
                      <p className="mt-1.5 text-sm text-danger">
                        {fieldErrors.password_confirmation}
                      </p>
                    )}
                  </div>
                  <fieldset>
                    <legend className="mb-1.5 text-sm font-medium">Role</legend>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="relative block cursor-pointer">
                        <input
                          type="radio"
                          name="new-user-role"
                          value="cashier"
                          checked={role === "cashier"}
                          onChange={() => setRole("cashier")}
                          className="peer sr-only"
                        />
                        <span className="block h-full rounded-xl border-2 border-line p-4 pr-10 peer-checked:border-cobalt peer-checked:bg-cobalt/5 peer-focus-visible:ring-4 peer-focus-visible:ring-cobalt/20">
                          <span className="block font-medium">Kasir</span>
                          <span className="mt-1 block text-sm leading-relaxed text-subtle">
                            Memakai halaman kasir dan melihat riwayat
                            transaksinya sendiri.
                          </span>
                        </span>
                        <span className="absolute top-4 right-4 grid size-5 place-items-center rounded-full bg-cobalt text-white opacity-0 peer-checked:opacity-100">
                          <Check size={14} strokeWidth={3} />
                        </span>
                      </label>
                      <label className="relative block cursor-pointer">
                        <input
                          type="radio"
                          name="new-user-role"
                          value="admin"
                          checked={role === "admin"}
                          onChange={() => setRole("admin")}
                          className="peer sr-only"
                        />
                        <span className="block h-full rounded-xl border-2 border-line p-4 pr-10 peer-checked:border-cobalt peer-checked:bg-cobalt/5 peer-focus-visible:ring-4 peer-focus-visible:ring-cobalt/20">
                          <span className="block font-medium">Admin</span>
                          <span className="mt-1 block text-sm leading-relaxed text-subtle">
                            Mengelola operasional toko sesuai izin admin.
                          </span>
                        </span>
                        <span className="absolute top-4 right-4 grid size-5 place-items-center rounded-full bg-cobalt text-white opacity-0 peer-checked:opacity-100">
                          <Check size={14} strokeWidth={3} />
                        </span>
                      </label>
                    </div>
                    {fieldErrors.role && (
                      <p className="mt-1.5 text-sm text-danger">
                        {fieldErrors.role}
                      </p>
                    )}
                  </fieldset>
                  <div className="rounded-lg bg-mist px-3 py-3 text-sm text-subtle">
                    <p className="font-medium text-ink">Catatan akses</p>
                    <p className="mt-1">
                      {editingUser
                        ? "Perubahan nama, email, dan role akan langsung diterapkan setelah disimpan."
                        : "Akun baru akan dibuat aktif. Untuk keamanan, role Super Admin tidak dapat diberikan dari formulir ini."}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 border-t-2 border-dashed border-line px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
                  <button
                    type="button"
                    onClick={closePanel}
                    disabled={submitting}
                    className="h-12 flex-1 rounded-lg border-2 border-line text-base font-semibold hover:bg-mist disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex h-12 flex-[1.6] items-center justify-center gap-2 rounded-lg bg-cobalt text-base font-semibold text-white transition-colors hover:bg-[#1a37ad] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting && (
                      <LoaderCircle size={18} className="animate-spin" />
                    )}
                    {submitting
                      ? "Menyimpan..."
                      : editingUser
                        ? "Simpan perubahan"
                        : "Simpan pengguna"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
