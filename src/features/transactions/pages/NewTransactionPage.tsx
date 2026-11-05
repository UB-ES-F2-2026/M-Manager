import { Link } from "react-router-dom";
import Button from "../../../components/ui/Button";
import FormAlert from "../../../components/ui/FormAlert";
import TextField from "../../../components/ui/TextField";
import CategoryField from "../components/CategoryField";
import TransactionTypeToggle from "../components/TransactionTypeToggle";
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
          <TransactionTypeToggle
            value={fields.type}
            onChange={(type) => setField("type", type)}
            disabled={isSubmitting}
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
            disabled={isSubmitting}
          />
          <TextField
            label="Data"
            name="date"
            type="date"
            value={fields.date}
            onChange={(event) => setField("date", event.target.value)}
            error={fieldErrors.date}
            disabled={isSubmitting}
          />
          <CategoryField
            value={fields.category}
            onChange={(category) => setField("category", category)}
            error={fieldErrors.category}
            disabled={isSubmitting}
          />
          <TextField
            label="Concepte"
            name="concept"
            autoComplete="off"
            placeholder="Ex. Compra al supermercat"
            value={fields.concept}
            onChange={(event) => setField("concept", event.target.value)}
            error={fieldErrors.concept}
            disabled={isSubmitting}
          />

          <Button type="submit" loading={isSubmitting} className="mt-2">
            {isSubmitting ? "Desant…" : "Desar moviment"}
          </Button>
        </form>
      </div>
    </main>
  );
}
