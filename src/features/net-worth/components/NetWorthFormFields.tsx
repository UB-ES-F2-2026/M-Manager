import TextField from "../../../components/ui/TextField";
import {
  MAX_LABEL_LENGTH,
  type NetWorthFieldErrors,
  type NetWorthFields,
} from "../hooks/useNetWorthForm";
import AssetTypeField from "./AssetTypeField";

type NetWorthFormFieldsProps = {
  fields: NetWorthFields;
  fieldErrors: NetWorthFieldErrors;
  disabled: boolean;
  setField: <K extends keyof NetWorthFields>(name: K, value: NetWorthFields[K]) => void;
};

/** Asset or debt fields shared by the new and edit screens; which ones depends on `fields.kind`. */
export default function NetWorthFormFields({
  fields,
  fieldErrors,
  disabled,
  setField,
}: NetWorthFormFieldsProps) {
  const isAsset = fields.kind === "asset";

  return (
    <>
      <TextField
        label={isAsset ? "Nom" : "Concepte"}
        name="label"
        autoComplete="off"
        maxLength={MAX_LABEL_LENGTH}
        placeholder={isAsset ? "Ex. Compte d'estalvi" : "Ex. Préstec del cotxe"}
        value={fields.label}
        onChange={(event) => setField("label", event.target.value)}
        error={fieldErrors.label}
        disabled={disabled}
      />
      {isAsset && (
        <AssetTypeField
          value={fields.assetType}
          onChange={(assetType) => setField("assetType", assetType)}
          error={fieldErrors.assetType}
          disabled={disabled}
        />
      )}
      <TextField
        label={isAsset ? "Valor" : "Import pendent"}
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
      {!isAsset && (
        <TextField
          label="Data de venciment"
          name="dueDate"
          type="date"
          value={fields.dueDate}
          onChange={(event) => setField("dueDate", event.target.value)}
          error={fieldErrors.dueDate}
          disabled={disabled}
        />
      )}
    </>
  );
}
