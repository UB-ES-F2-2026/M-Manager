import { Link } from "react-router-dom";
import Button from "../../../components/ui/Button";
import FormAlert from "../../../components/ui/FormAlert";
import NetWorthFormFields from "../components/NetWorthFormFields";
import NetWorthKindToggle from "../components/NetWorthKindToggle";
import { useNetWorthForm } from "../hooks/useNetWorthForm";

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
          <NetWorthFormFields
            fields={fields}
            fieldErrors={fieldErrors}
            disabled={isSubmitting}
            setField={setField}
          />

          <Button type="submit" loading={isSubmitting} className="mt-2">
            {isSubmitting ? "Desant…" : isAsset ? "Desar actiu" : "Desar deute"}
          </Button>
        </form>
      </div>
    </main>
  );
}
