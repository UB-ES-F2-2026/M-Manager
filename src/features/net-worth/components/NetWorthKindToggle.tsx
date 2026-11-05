import type { NetWorthKind } from "../hooks/useNetWorthForm";

type NetWorthKindToggleProps = {
  value: NetWorthKind;
  onChange: (value: NetWorthKind) => void;
  disabled?: boolean;
};

const OPTIONS: { value: NetWorthKind; label: string }[] = [
  { value: "asset", label: "Actiu" },
  { value: "debt", label: "Deute" },
];

/** Two-option switch between asset and debt. */
export default function NetWorthKindToggle({
  value,
  onChange,
  disabled = false,
}: NetWorthKindToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Què vols afegir"
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
              isSelected ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
