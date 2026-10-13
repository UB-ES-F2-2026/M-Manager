import type { ButtonHTMLAttributes } from "react";
import { Spinner } from "./Spinner";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Shows a spinner and disables the button. */
  loading?: boolean;
};

export function Button({
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-base font-medium text-white transition hover:bg-brand-strong focus-visible:ring-4 focus-visible:ring-brand-soft focus-visible:outline-none disabled:cursor-not-allowed ${loading ? "" : "disabled:opacity-50"} ${className}`}
      {...props}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}
