import { useId } from "react";
import TextField from "../../../components/ui/TextField";
import {
  TRANSACTION_CATEGORIES,
  type TransactionCategory,
} from "../../../../convex/lib/transactionCategories";
import { CATEGORY_LABELS } from "../categoryLabels";
import { hasActiveFilters, type HistoryFilters } from "../hooks/useTransactionHistory";

type HistoryFilterBarProps = {
  filters: HistoryFilters;
  onChange: (filters: HistoryFilters) => void;
  onClear: () => void;
  /** Shown under "Fins a" when the dates are the wrong way round. */
  rangeError?: string;
};

/** Date range and category filters of the history (US2.3). */
export default function HistoryFilterBar({
  filters,
  onChange,
  onClear,
  rangeError,
}: HistoryFilterBarProps) {
  const categoryId = useId();

  return (
    <section
      aria-label="Filtres"
      className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="Des de"
          name="from"
          type="date"
          value={filters.from}
          max={filters.to || undefined}
          onChange={(event) => onChange({ ...filters, from: event.target.value })}
        />
        <TextField
          label="Fins a"
          name="to"
          type="date"
          value={filters.to}
          min={filters.from || undefined}
          onChange={(event) => onChange({ ...filters, to: event.target.value })}
          error={rangeError}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={categoryId} className="text-sm font-medium text-slate-900">
          Categoria
        </label>
        <select
          id={categoryId}
          name="category"
          value={filters.category}
          onChange={(event) =>
            onChange({ ...filters, category: event.target.value as TransactionCategory | "" })
          }
          className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-primary"
        >
          <option value="">Totes les categories</option>
          {TRANSACTION_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {CATEGORY_LABELS[category]}
            </option>
          ))}
        </select>
      </div>

      {hasActiveFilters(filters) && (
        <button
          type="button"
          onClick={onClear}
          className="self-start text-sm font-medium text-primary"
        >
          Esborrar els filtres
        </button>
      )}
    </section>
  );
}
