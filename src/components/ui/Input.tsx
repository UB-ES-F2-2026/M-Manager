import type { InputHTMLAttributes, ReactNode } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string | null;
  hint?: ReactNode;
  /** Element rendered inside the field, on the right (e.g. "Mostrar"). */
  trailing?: ReactNode;
};

export function Input({
  label,
  error,
  hint,
  trailing,
  id,
  className = "",
  ...props
}: InputProps) {
  const inputId = id ?? props.name;
  const errorId = error ? `${inputId}-error` : undefined;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  const stateClasses = error
    ? "border-danger-strong focus:border-danger-strong focus:ring-danger-soft"
    : "border-line focus:border-brand focus:ring-brand-soft";

  return (
    <div className="flex flex-col gap-1.5 has-disabled:text-subtle">
      <label className="text-sm font-medium" htmlFor={inputId}>
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`h-12 w-full rounded-lg border bg-white px-4 text-base text-ink outline-none transition placeholder:text-subtle focus:ring-4 disabled:border-transparent disabled:bg-disabled disabled:text-subtle ${trailing ? "pr-24" : ""} ${stateClasses} ${className}`}
          {...props}
        />
        {trailing ? (
          <div className="absolute inset-y-0 right-0 flex items-center pr-4">
            {trailing}
          </div>
        ) : null}
      </div>
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
      {hint ? (
        <div id={hintId} className="text-xs text-muted">
          {hint}
        </div>
      ) : null}
    </div>
  );
}

function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} className="flex items-center gap-1 text-xs text-danger">
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="size-3.5 shrink-0 fill-current"
      >
        <path d="M8.9 1.6a1 1 0 0 0-1.8 0L.2 13.5A1 1 0 0 0 1.1 15h13.8a1 1 0 0 0 .9-1.5L8.9 1.6ZM7.25 6h1.5v4.5h-1.5V6Zm0 5.75h1.5v1.5h-1.5v-1.5Z" />
      </svg>
      <span>{children}</span>
    </p>
  );
}
