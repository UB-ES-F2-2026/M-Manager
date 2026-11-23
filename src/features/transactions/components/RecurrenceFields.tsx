import { useId } from "react";
import TextField from "../../../components/ui/TextField";
import {
  RECURRENCE_FREQUENCIES,
  type RecurrenceFrequency,
} from "../../../../convex/lib/recurrenceFrequencies";
import type { TransactionFieldErrors, TransactionFields } from "../hooks/useTransactionForm";
import { FREQUENCY_LABELS } from "../recurrenceFields";

type RecurrenceFieldsProps = {
  fields: TransactionFields;
  fieldErrors: TransactionFieldErrors;
  disabled: boolean;
  setField: <K extends keyof TransactionFields>(name: K, value: TransactionFields[K]) => void;
};

const SWITCH_OPTIONS: { value: boolean; label: string; activeClasses: string }[] = [
  { value: false, label: "No", activeClasses: "bg-white text-slate-500 shadow-sm" },
  { value: true, label: "Sí", activeClasses: "bg-white text-primary shadow-sm" },
];

/**
 * US2.5 · AC1: "Moviment recurrent" switch and, while it is on, the frequency and
 * payment day fields. Hidden fields keep their values but are not focusable.
 */
export default function RecurrenceFields({
  fields,
  fieldErrors,
  disabled,
  setField,
}: RecurrenceFieldsProps) {
  const labelId = useId();
  const isOpen = fields.isRecurring;

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-4">
        <span id={labelId} className="text-sm font-medium text-slate-900">
          Moviment recurrent
        </span>
        {/* Same look as TransactionTypeToggle (slate-100 track, white active option). */}
        <div
          role="radiogroup"
          aria-labelledby={labelId}
          className="grid w-28 grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1"
        >
          {SWITCH_OPTIONS.map((option) => {
            const isSelected = option.value === fields.isRecurring;
            return (
              <button
                key={option.label}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={disabled}
                onClick={() => setField("isRecurring", option.value)}
                className={`rounded-md py-1.5 text-sm font-semibold transition-colors duration-150 ease-out disabled:cursor-not-allowed ${
                  isSelected ? option.activeClasses : "text-slate-500"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 200 ms ease-out on opacity and height; the padding lives inside so it collapses too. */}
      <div
        inert={!isOpen}
        aria-hidden={!isOpen}
        className={`overflow-hidden transition-all duration-200 ease-out ${
          isOpen ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex flex-col gap-5 pt-5">
          <FrequencyField
            value={fields.frequency}
            onChange={(frequency) => setField("frequency", frequency)}
            disabled={disabled}
          />
          <TextField
            label="Dia de cobrament/pagament"
            name="dayOfMonth"
            type="number"
            inputMode="numeric"
            min={1}
            max={28}
            step={1}
            autoComplete="off"
            value={fields.dayOfMonth}
            onChange={(event) => setField("dayOfMonth", event.target.value)}
            error={fieldErrors.dayOfMonth}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}

function FrequencyField({
  value,
  onChange,
  disabled,
}: {
  value: RecurrenceFrequency;
  onChange: (value: RecurrenceFrequency) => void;
  disabled: boolean;
}) {
  const selectId = useId();

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-sm font-medium text-slate-900">
        Freqüència
      </label>
      <select
        id={selectId}
        name="frequency"
        value={value}
        onChange={(event) => onChange(event.target.value as RecurrenceFrequency)}
        disabled={disabled}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-primary disabled:bg-slate-100 disabled:text-slate-400"
      >
        {RECURRENCE_FREQUENCIES.map((frequency) => (
          <option key={frequency} value={frequency}>
            {FREQUENCY_LABELS[frequency]}
          </option>
        ))}
      </select>
    </div>
  );
}
