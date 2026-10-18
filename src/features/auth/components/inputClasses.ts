/** Tailwind classes and helpers shared by TextField and PasswordField. */
const INPUT_BASE_CLASSES =
  "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 disabled:bg-slate-100 disabled:text-slate-400";

export function inputClasses(hasError: boolean): string {
  const stateClasses = hasError
    ? "border-red-600 focus:ring-red-200"
    : "border-slate-300 focus:border-blue-800 focus:ring-blue-100";
  return `${INPUT_BASE_CLASSES} ${stateClasses}`;
}

/** Id of the error message linked to an input through aria-describedby. */
export function fieldErrorId(inputId: string): string {
  return `${inputId}-error`;
}
