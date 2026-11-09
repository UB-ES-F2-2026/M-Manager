import { useId } from "react";
import {
  TRANSACTION_CATEGORIES,
  type TransactionCategory,
} from "../../../../convex/lib/transactionCategories";
import { CATEGORY_LABELS } from "../categoryLabels";

type CategoryFieldProps = {
  value: TransactionCategory | "";
  onChange: (value: TransactionCategory | "") => void;
  error?: string;
  disabled?: boolean;
};

/** Category dropdown with the same look as TextField. */
export default function CategoryField({ value, onChange, error, disabled }: CategoryFieldProps) {
  const selectId = useId();
  const messageId = `${selectId}-message`;
  const borderClasses = error ? "border-danger" : "border-slate-300 focus:border-primary";

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-sm font-medium text-slate-900">
        Categoria
      </label>
      <select
        id={selectId}
        name="category"
        value={value}
        onChange={(event) => onChange(event.target.value as TransactionCategory | "")}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? messageId : undefined}
        className={`rounded-lg border bg-white px-3 py-2.5 text-sm outline-none disabled:bg-slate-100 disabled:text-slate-400 ${borderClasses} ${
          value === "" ? "text-slate-400" : "text-slate-900"
        }`}
      >
        <option value="" disabled>
          Tria una categoria
        </option>
        {TRANSACTION_CATEGORIES.map((category) => (
          <option key={category} value={category} className="text-slate-900">
            {CATEGORY_LABELS[category]}
          </option>
        ))}
      </select>
      {error && (
        <p id={messageId} role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
