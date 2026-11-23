import { Link } from "react-router-dom";
import Button from "../../../components/ui/Button";
import FormAlert from "../../../components/ui/FormAlert";
import TextField from "../../../components/ui/TextField";
import { useNewGroupForm } from "../hooks/useNewGroupForm";

/** US4.1: /groups/new, create a group; the creator becomes its owner. */
export default function NewGroupPage() {
  const { fields, errors, isSubmitting, setField, handleSubmit } = useNewGroupForm();
  const { fieldErrors, alert } = errors;

  return (
    <main className="flex min-h-screen justify-center bg-white px-6 py-8">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <header className="flex flex-col gap-3">
          <Link to="/groups" className="self-start text-sm font-medium text-primary">
            ← Tornar
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Nou grup</h1>
        </header>

        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
          {alert && <FormAlert title={alert.title} description={alert.description} />}
          <TextField
            label="Nom"
            placeholder="Viatge a Roma"
            value={fields.name}
            onChange={(event) => setField("name", event.target.value)}
            error={fieldErrors.name}
            disabled={isSubmitting}
            autoFocus
          />
          <TextField
            label="Descripció"
            placeholder="Despeses del viatge d'estiu"
            hint="Opcional"
            value={fields.description}
            onChange={(event) => setField("description", event.target.value)}
            error={fieldErrors.description}
            disabled={isSubmitting}
          />

          <Button type="submit" loading={isSubmitting} className="mt-2">
            {isSubmitting ? "Creant…" : "Crear grup"}
          </Button>
        </form>
      </div>
    </main>
  );
}
