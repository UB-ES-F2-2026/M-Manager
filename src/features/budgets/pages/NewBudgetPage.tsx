import Button from "../../../components/ui/Button";
import FormAlert from "../../../components/ui/FormAlert";
import BudgetFormFields from "../components/BudgetFormFields";
import BudgetFormLayout from "../components/BudgetFormLayout";
import { useBudgetForm } from "../hooks/useBudgetForm";

/** US3.1 AC1: set a monthly spending limit for one expense category. */
export default function NewBudgetPage() {
  const { fields, errors, isSubmitting, takenCategories, setField, handleSubmit } =
    useBudgetForm();
  const { fieldErrors, alert } = errors;

  return (
    <BudgetFormLayout title="Nou pressupost">
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
        {alert && <FormAlert title={alert.title} description={alert.description} />}
        <BudgetFormFields
          fields={fields}
          fieldErrors={fieldErrors}
          takenCategories={takenCategories}
          disabled={isSubmitting}
          setField={setField}
        />

        <Button type="submit" loading={isSubmitting} className="mt-2">
          {isSubmitting ? "Desant…" : "Desar pressupost"}
        </Button>
      </form>
    </BudgetFormLayout>
  );
}
