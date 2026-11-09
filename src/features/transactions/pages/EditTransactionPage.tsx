import { useQuery } from "convex/react";
import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../../../convex/_generated/api";
import type { Doc } from "../../../../convex/_generated/dataModel";
import Button from "../../../components/ui/Button";
import FormAlert from "../../../components/ui/FormAlert";
import SessionLoading from "../../auth/components/SessionLoading";
import TransactionFormFields from "../components/TransactionFormFields";
import { useTransactionForm } from "../hooks/useTransactionForm";

/** US2.2: edit one of the user's transactions, reached at /transactions/:transactionId/edit. */
export default function EditTransactionPage() {
  const { transactionId = "" } = useParams();
  const transaction = useQuery(api.transactions.get, { transactionId });

  if (transaction === undefined) {
    return <SessionLoading />;
  }

  if (transaction === null) {
    return (
      <EditLayout>
        <FormAlert
          title="No s'ha trobat aquest moviment"
          description="Potser s'ha eliminat o l'enllaç no és correcte."
        />
      </EditLayout>
    );
  }

  return (
    <EditLayout>
      <EditTransactionForm transaction={transaction} />
    </EditLayout>
  );
}

function EditLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen justify-center bg-white px-6 py-8">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <header className="flex flex-col gap-3">
          <Link to="/" className="self-start text-sm font-medium text-primary">
            ← Tornar
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Editar moviment</h1>
        </header>
        {children}
      </div>
    </main>
  );
}

/** Mounted only once the transaction has loaded, so the form starts filled in. */
function EditTransactionForm({ transaction }: { transaction: Doc<"transactions"> }) {
  const { fields, errors, isSubmitting, setField, handleSubmit } = useTransactionForm(transaction);
  const { fieldErrors, alert } = errors;

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      {alert && <FormAlert title={alert.title} description={alert.description} />}
      <TransactionFormFields
        fields={fields}
        fieldErrors={fieldErrors}
        disabled={isSubmitting}
        setField={setField}
      />

      <Button type="submit" loading={isSubmitting} className="mt-2">
        {isSubmitting ? "Desant…" : "Desar canvis"}
      </Button>
    </form>
  );
}
