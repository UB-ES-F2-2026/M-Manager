import type { SplitMode } from "../../../../convex/lib/splitModes";

type SplitModeToggleProps = {
  value: SplitMode;
  onChange: (value: SplitMode) => void;
  disabled?: boolean;
};

const OPTIONS: { value: SplitMode; label: string }[] = [
  { value: "equal", label: "Igual" },
  { value: "amounts", label: "Imports" },
  { value: "percentages", label: "Percentatges" },
];

/** «Com es divideix»: three-option switch with the same look as TransactionTypeToggle. */
export default function SplitModeToggle({ value, onChange, disabled = false }: SplitModeToggleProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <p id="split-mode-label" className="text-sm font-medium text-slate-900">
        Com es divideix
      </p>
      <div
        role="radiogroup"
        aria-labelledby="split-mode-label"
        className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1"
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
              className={`rounded-md py-2 text-sm font-semibold transition-colors duration-150 ease-out disabled:cursor-not-allowed ${
                isSelected ? "bg-white text-primary shadow-sm" : "text-slate-500"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
