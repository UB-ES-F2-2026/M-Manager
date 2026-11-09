import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Shows a spinner and disables the button while an action is running. */
  loading?: boolean;
  /** "danger" for destructive actions such as deleting. */
  variant?: "primary" | "danger";
};

const VARIANT_CLASSES = {
  primary: "bg-primary",
  danger: "bg-danger",
};

export default function Button({
  loading = false,
  variant = "primary",
  disabled,
  className = "",
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading}
      className={`flex w-full items-center justify-center gap-2 rounded-lg ${VARIANT_CLASSES[variant]} px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...props}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
        />
      )}
      {children}
    </button>
  );
}
