import type { ReactNode } from "react";

type FieldProps = {
  label: string;
  children: ReactNode;
  hint?: string;
};

export default function Field({ label, children, hint }: FieldProps) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>

      {children}

      {hint && (
        <span className="mt-1.5 block text-xs leading-relaxed text-subtle">
          {hint}
        </span>
      )}
    </label>
  );
}
