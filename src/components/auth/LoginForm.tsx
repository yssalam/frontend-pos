import PasswordInput from "@/components/auth/PasswordInput";

type LoginFormProps = {
  email: string;
  password: string;
  loading: boolean;
  error: string;
  emailError: string;
  passwordError: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onEmailErrorClear: () => void;
  onPasswordErrorClear: () => void;
};

export default function LoginForm({
  email,
  password,
  loading,
  error,
  emailError,
  passwordError,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onEmailErrorClear,
  onPasswordErrorClear,
}: LoginFormProps) {
  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-5" noValidate>
      {error && (
        <div
          role="alert"
          className="rounded-lg bg-danger-bg px-4 py-3 text-sm text-danger"
        >
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-sm font-medium"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => {
            onEmailChange(event.target.value);
            onEmailErrorClear();
          }}
          placeholder="nama@toko.com"
          aria-invalid={!!emailError}
          className="h-12 w-full rounded-lg border-2 border-line bg-paper px-4 text-base outline-none focus:border-cobalt focus:ring-4 focus:ring-cobalt/20 aria-[invalid=true]:border-danger"
        />
        {emailError && (
          <p className="mt-1.5 text-sm text-danger">{emailError}</p>
        )}
      </div>

      <PasswordInput
        value={password}
        onChange={(value) => {
          onPasswordChange(value);
          onPasswordErrorClear();
        }}
        error={passwordError}
      />

      <button
        type="submit"
        disabled={loading}
        className="h-13 w-full rounded-lg bg-cobalt text-base font-semibold text-white transition-colors hover:bg-cobalt-dark disabled:cursor-wait disabled:opacity-70"
      >
        {loading ? "Memproses..." : "Masuk"}
      </button>
    </form>
  );
}
