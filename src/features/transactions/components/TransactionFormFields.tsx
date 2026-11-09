import TextField from "../../../components/ui/TextField";
import type { TransactionFieldErrors, TransactionFields } from "../hooks/useTransactionForm";
import CategoryField from "./CategoryField";
import TransactionTypeToggle from "./TransactionTypeToggle";

type TransactionFormFieldsProps = {
  fields: TransactionFields;
  fieldErrors: TransactionFieldErrors;
  disabled: boolean;
  setField: <K extends keyof TransactionFields>(name: K, value: TransactionFields[K]) => void;
};

/** Type, amount, date, category and concept inputs, shared by the new and edit screens. */
export default function TransactionFormFields({
  fields,
  fieldErrors,
  disabled,
  setField,
}: TransactionFormFieldsProps) {
  return (
    <>
      <TransactionTypeToggle
        value={fields.type}
        onChange={(type) => setField("type", type)}
        disabled={disabled}
      />
      <TextField
        label="Import"
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
      <TextField
        label="Data"
        name="date"
        type="date"
        value={fields.date}
        onChange={(event) => setField("date", event.target.value)}
        error={fieldErrors.date}
        disabled={disabled}
      />
      <CategoryField
        value={fields.category}
        onChange={(category) => setField("category", category)}
        error={fieldErrors.category}
        disabled={disabled}
      />
      <TextField
        label="Concepte"
        name="concept"
        autoComplete="off"
        placeholder="Ex. Compra al supermercat"
        value={fields.concept}
        onChange={(event) => setField("concept", event.target.value)}
        error={fieldErrors.concept}
        disabled={disabled}
      />
    </>
  );
}
