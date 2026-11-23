import type { BudgetCategory } from "../../../../convex/lib/budgetCategories";
import TextField from "../../../components/ui/TextField";
import type { BudgetFieldErrors, BudgetFields } from "../hooks/useBudgetForm";
import BudgetCategoryField from "./BudgetCategoryField";

type BudgetFormFieldsProps = {
  fields: BudgetFields;
  fieldErrors: BudgetFieldErrors;
  takenCategories: readonly BudgetCategory[];
  /** True on the edit screen, where only the limit can change. */
  categoryLocked?: boolean;
  disabled: boolean;
  setField: <K extends keyof BudgetFields>(name: K, value: BudgetFields[K]) => void;
};

/** Category and monthly limit inputs, shared by the new and edit budget screens. */
export default function BudgetFormFields({
  fields,
  fieldErrors,
  takenCategories,
  categoryLocked = false,
  disabled,
  setField,
}: BudgetFormFieldsProps) {
  return (
    <>
      <BudgetCategoryField
        value={fields.category}
        onChange={(category) => setField("category", category)}
        takenCategories={takenCategories}
        locked={categoryLocked}
        error={fieldErrors.category}
        disabled={disabled}
      />
      <TextField
        label="Límit mensual"
        name="amount"
        inputMode="decimal"
        autoComplete="off"
        placeholder="0,00"
        value={fields.amount}
        onChange={(event) => setField("amount", event.target.value)}
        error={fieldErrors.amount}
        trailing={<span className="pr-3 text-sm text-slate-500">€</span>}
        disabled={disabled}
      />
    </>
  );
}
