import { useId } from "react";
import {
  BUDGET_CATEGORIES,
  type BudgetCategory,
} from "../../../../convex/lib/budgetCategories";
import { CATEGORY_LABELS } from "../../transactions/categoryLabels";

type BudgetCategoryFieldProps = {
  value: BudgetCategory | "";
  onChange: (value: BudgetCategory | "") => void;
  /** Categories that already have a budget: shown but not selectable. */
  takenCategories: readonly BudgetCategory[];
  /** On the edit screen the category cannot change. */
  locked?: boolean;
  error?: string;
  disabled?: boolean;
};

/** Expense category dropdown of the budget form, with the same look as CategoryField. */
export default function BudgetCategoryField({
  value,
  onChange,
  takenCategories,
  locked = false,
  error,
  disabled = false,
}: BudgetCategoryFieldProps) {
  const selectId = useId();
  const messageId = `${selectId}-message`;
  const message = error ?? (locked ? "La categoria no es pot canviar." : undefined);
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
        onChange={(event) => onChange(event.target.value as BudgetCategory | "")}
        disabled={disabled || locked}
        aria-invalid={Boolean(error)}
        aria-describedby={message ? messageId : undefined}
        className={`rounded-lg border bg-white px-3 py-2.5 text-sm outline-none disabled:bg-slate-100 disabled:text-slate-400 ${borderClasses} ${
          value === "" ? "text-slate-400" : "text-slate-900"
        }`}
      >
        <option value="" disabled>
          Tria una categoria
        </option>
        {BUDGET_CATEGORIES.map((category) => {
          const isTaken = takenCategories.includes(category);
          return (
            <option key={category} value={category} disabled={isTaken} className="text-slate-900">
              {CATEGORY_LABELS[category]}
              {isTaken ? " · ja té pressupost" : ""}
            </option>
          );
        })}
      </select>
      {error ? (
        <p id={messageId} role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : (
        message && (
          <p id={messageId} className="text-xs text-slate-500">
            {message}
          </p>
        )
      )}
    </div>
  );
}
