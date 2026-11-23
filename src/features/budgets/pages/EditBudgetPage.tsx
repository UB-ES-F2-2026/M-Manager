import { useQuery } from "convex/react";
import { useParams } from "react-router-dom";
import { api } from "../../../../convex/_generated/api";
import type { Doc } from "../../../../convex/_generated/dataModel";
import Button from "../../../components/ui/Button";
import FormAlert from "../../../components/ui/FormAlert";
import SessionLoading from "../../auth/components/SessionLoading";
import BudgetFormFields from "../components/BudgetFormFields";
import BudgetFormLayout from "../components/BudgetFormLayout";
import { useBudgetForm } from "../hooks/useBudgetForm";

/** US3.1 AC1: change the monthly limit of a budget, reached at /budgets/:budgetId/edit. */
export default function EditBudgetPage() {
  const { budgetId = "" } = useParams();
  const budget = useQuery(api.budgets.get, { budgetId });

  if (budget === undefined) {
    return <SessionLoading />;
  }

  if (budget === null) {
    return (
      <BudgetFormLayout title="Editar pressupost">
        <FormAlert
          title="No s'ha trobat aquest pressupost"
          description="Potser s'ha eliminat o l'enllaç no és correcte."
        />
      </BudgetFormLayout>
    );
  }

  return (
    <BudgetFormLayout title="Editar pressupost">
      <EditBudgetForm budget={budget} />
    </BudgetFormLayout>
  );
}

/** Mounted only once the budget has loaded, so the form starts filled in. */
function EditBudgetForm({ budget }: { budget: Doc<"budgets"> }) {
  const { fields, errors, isSubmitting, setField, handleSubmit } = useBudgetForm(budget);
  const { fieldErrors, alert } = errors;

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      {alert && <FormAlert title={alert.title} description={alert.description} />}
      <BudgetFormFields
        fields={fields}
        fieldErrors={fieldErrors}
        takenCategories={[]}
        categoryLocked
        disabled={isSubmitting}
        setField={setField}
      />

      <Button type="submit" loading={isSubmitting} className="mt-2">
        {isSubmitting ? "Desant…" : "Desar canvis"}
      </Button>
    </form>
  );
}
