import { Link } from "react-router-dom";
import Button from "../../../components/ui/Button";
import FormAlert from "../../../components/ui/FormAlert";
import TransactionFormFields from "../components/TransactionFormFields";
import { useTransactionForm } from "../hooks/useTransactionForm";

/** US2.1: register an income or an expense. */
export default function NewTransactionPage() {
  const { fields, errors, isSubmitting, setField, handleSubmit } = useTransactionForm();
  const { fieldErrors, alert } = errors;

  return (
    <main className="flex min-h-screen justify-center bg-white px-6 py-8">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <header className="flex flex-col gap-3">
          <Link to="/" className="self-start text-sm font-medium text-primary">
            ← Tornar
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Nou moviment</h1>
        </header>

        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
          {alert && <FormAlert title={alert.title} description={alert.description} />}
          <TransactionFormFields
            fields={fields}
            fieldErrors={fieldErrors}
            disabled={isSubmitting}
            setField={setField}
          />

          <Button type="submit" loading={isSubmitting} className="mt-2">
            {isSubmitting ? "Desant…" : "Desar moviment"}
          </Button>
        </form>
      </div>
    </main>
  );
}
