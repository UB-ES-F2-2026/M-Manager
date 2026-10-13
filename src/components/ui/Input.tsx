import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function Input({ label, id, className = "", ...props }: InputProps) {
  const inputId = id ?? props.name;
  return (
    <label className="flex flex-col gap-1 text-sm text-slate-700" htmlFor={inputId}>
      <span>{label}</span>
      <input
        id={inputId}
        className={`rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-500 ${className}`}
        {...props}
      />
    </label>
  );
}
