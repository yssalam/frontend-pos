import { ReceiptText } from "lucide-react";
import LoginForm from "@/components/auth/LoginForm";
import { useLogin } from "@/hooks/useLogin";

export default function Login() {
  const {
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
  } = useLogin();

  return (
    <div className="grid min-h-dvh grid-rows-[auto_1fr] bg-ink font-sans text-ink lg:grid-cols-[minmax(0,1fr)_minmax(0,34rem)] lg:grid-rows-1">
      <header className="flex flex-col gap-10 px-5 pb-8 pt-6 text-white sm:px-8 lg:justify-between lg:bg-ink lg:px-14 lg:py-14">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-cobalt">
            <ReceiptText size={24} aria-hidden="true" />
          </span>
          <span className="font-display text-xl font-bold">POS-APP</span>
        </div>

        <div className="hidden lg:block">
          <h2 className="max-w-[16ch] font-display text-5xl font-bold leading-tight">
            Semua penjualan hari ini, satu layar.
          </h2>
          <p className="mt-5 max-w-[38ch] text-lg leading-relaxed text-[#b8c4d4]">
            Catat transaksi, cek stok, dan lihat omzet harian sampai tahunan
            dari satu akun.
          </p>
        </div>

        <p className="hidden text-sm text-[#8fa0b6] lg:block">
          Untuk kasir dan admin toko.
        </p>
      </header>

      <main className="flex items-center justify-center bg-mist px-4 pb-8 sm:px-8 lg:items-center lg:px-12 lg:pb-0">
        <section className="receipt w-full max-w-md rounded-t-2xl bg-paper px-5 pt-6 sm:px-8 sm:pt-8">
          <div className="flex justify-between font-mono text-xs text-subtle">
            <span>POS-APP LOGIN</span>
            <time>
              {new Intl.DateTimeFormat("id-ID", {
                dateStyle: "short",
                timeStyle: "short",
              }).format(new Date())}
            </time>
          </div>

          <div className="my-4 border-t-2 border-dashed border-line" />

          <h1 className="font-display text-3xl font-bold">Masuk ke kasir</h1>
          <p className="mt-2 leading-relaxed text-subtle">
            Gunakan akun yang dibuat admin tokomu.
          </p>

          <LoginForm
            email={email}
            password={password}
            loading={loading}
            error={error}
            emailError={emailError}
            passwordError={passwordError}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onEmailErrorClear={() => setEmailError("")}
            onPasswordErrorClear={() => setPasswordError("")}
            onSubmit={handleSubmit}
          />

          <div className="mt-6 border-t-2 border-dashed border-line" />
          <p className="mt-4 pb-8 text-center text-sm text-subtle">
            Belum punya akun? Minta admin tokomu membuatkannya.
          </p>
        </section>
      </main>
    </div>
  );
}
