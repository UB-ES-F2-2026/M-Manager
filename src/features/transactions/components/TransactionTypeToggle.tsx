import type { TransactionType } from "../hooks/useTransactionForm";

type TransactionTypeToggleProps = {
  value: TransactionType;
  onChange: (value: TransactionType) => void;
  disabled?: boolean;
};

const OPTIONS: { value: TransactionType; label: string; activeClasses: string }[] = [
  { value: "expense", label: "Despesa", activeClasses: "bg-white text-slate-900 shadow-sm" },
  { value: "income", label: "Ingrés", activeClasses: "bg-white text-success shadow-sm" },
];

/** Two-option switch between expense and income. */
export default function TransactionTypeToggle({
  value,
  onChange,
  disabled = false,
}: TransactionTypeToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Tipus de moviment"
      className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1"
    >
      {OPTIONS.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={`rounded-md py-2 text-sm font-semibold disabled:cursor-not-allowed ${
              isSelected ? option.activeClasses : "text-slate-500"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
