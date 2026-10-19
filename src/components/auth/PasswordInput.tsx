import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type PasswordInputProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

export default function PasswordInput({
  value,
  onChange,
  error,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <label
        htmlFor="password"
        className="mb-1.5 block text-sm font-medium"
      >
        Kata sandi
      </label>

      <div className="relative">
        <input
          id="password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          data-1p-ignore
          data-lpignore="true"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Masukkan kata sandi"
          aria-invalid={!!error}
          className="h-12 w-full rounded-lg border-2 border-line bg-paper px-4 pr-32 text-base outline-none focus:border-cobalt focus:ring-4 focus:ring-cobalt/20 aria-[invalid=true]:border-danger"
        />

        <button
          type="button"
          onClick={() => setShowPassword((current) => !current)}
          className="absolute inset-y-1 right-1 z-10 flex items-center gap-1 rounded-md px-3 text-sm font-medium text-cobalt hover:bg-mist"
          aria-label={
            showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
          }
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          {showPassword ? "Sembunyikan" : "Tampilkan"}
        </button>
      </div>

      {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
    </div>
  );
}
