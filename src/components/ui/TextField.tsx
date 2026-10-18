import { useId, type InputHTMLAttributes, type ReactNode } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  /** Help text shown under the field when there is no error. */
  hint?: ReactNode;
  /** Error message; turns the field red and replaces the hint. */
  error?: string;
  /** Element rendered inside the input, on the right (e.g. a show/hide button). */
  trailing?: ReactNode;
};

export default function TextField({
  label,
  hint,
  error,
  trailing,
  id,
  className = "",
  ...props
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;
  const hasMessage = Boolean(error || hint);

  const borderClasses = error
    ? "border-danger"
    : "border-slate-300 focus-within:border-primary";

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={inputId} className="text-sm font-medium text-slate-900">
        {label}
      </label>
      <div
        className={`flex items-center rounded-lg border bg-white has-disabled:bg-slate-100 ${borderClasses}`}
      >
        <input
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={hasMessage ? messageId : undefined}
          className="w-full min-w-0 rounded-lg bg-transparent px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:text-slate-400"
          {...props}
        />
        {trailing}
      </div>
      {error ? (
        <p id={messageId} className="flex items-center gap-1 text-xs text-danger">
          <WarningIcon />
          {error}
        </p>
      ) : (
        hint && (
          <div id={messageId} className="text-xs text-slate-500">
            {hint}
          </div>
        )
      )}
    </div>
  );
}

function WarningIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="size-3.5 shrink-0"
    >
      <path
        fillRule="evenodd"
        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 6a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
