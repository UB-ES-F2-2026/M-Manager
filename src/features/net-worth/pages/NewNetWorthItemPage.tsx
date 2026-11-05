import { Link } from "react-router-dom";
import Button from "../../../components/ui/Button";
import FormAlert from "../../../components/ui/FormAlert";
import TextField from "../../../components/ui/TextField";
import AssetTypeField from "../components/AssetTypeField";
import NetWorthKindToggle from "../components/NetWorthKindToggle";
import { MAX_LABEL_LENGTH, useNetWorthForm } from "../hooks/useNetWorthForm";

/** US3.2: add an asset (what you own) or a debt (what you owe). */
export default function NewNetWorthItemPage() {
  const { fields, errors, isSubmitting, setField, handleSubmit } = useNetWorthForm();
  const { fieldErrors, alert } = errors;
  const isAsset = fields.kind === "asset";

  return (
    <main className="flex min-h-screen justify-center bg-white px-6 py-8">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <header className="flex flex-col gap-3">
          <Link to="/" className="self-start text-sm font-medium text-primary">
            ← Tornar
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">
            {isAsset ? "Nou actiu" : "Nou deute"}
          </h1>
        </header>

        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
          {alert && <FormAlert title={alert.title} description={alert.description} />}
          <NetWorthKindToggle
            value={fields.kind}
            onChange={(kind) => setField("kind", kind)}
            disabled={isSubmitting}
          />
          <TextField
            label={isAsset ? "Nom" : "Concepte"}
            name="label"
            autoComplete="off"
            maxLength={MAX_LABEL_LENGTH}
            placeholder={isAsset ? "Ex. Compte d'estalvi" : "Ex. Préstec del cotxe"}
            value={fields.label}
            onChange={(event) => setField("label", event.target.value)}
            error={fieldErrors.label}
            disabled={isSubmitting}
          />
          {isAsset && (
            <AssetTypeField
              value={fields.assetType}
              onChange={(assetType) => setField("assetType", assetType)}
              error={fieldErrors.assetType}
              disabled={isSubmitting}
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
            disabled={isSubmitting}
          />
          {!isAsset && (
            <TextField
              label="Data de venciment"
              name="dueDate"
              type="date"
              value={fields.dueDate}
              onChange={(event) => setField("dueDate", event.target.value)}
              error={fieldErrors.dueDate}
              disabled={isSubmitting}
            />
          )}

          <Button type="submit" loading={isSubmitting} className="mt-2">
            {isSubmitting ? "Desant…" : isAsset ? "Desar actiu" : "Desar deute"}
          </Button>
        </form>
      </div>
    </main>
  );
}
