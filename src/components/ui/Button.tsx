import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}
