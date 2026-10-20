import { Link } from "react-router-dom";
import Button from "../../../components/ui/Button";
import PasswordField from "../../../components/ui/PasswordField";
import TextField from "../../../components/ui/TextField";
import BrandLogo from "../components/BrandLogo";
import FormAlert from "../components/FormAlert";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";
import { MAX_NAME_LENGTH, useRegisterForm } from "../hooks/useRegisterForm";

/** US1.1: sign-up screen (name, email and password). */
export default function RegisterPage() {
  const { fields, errors, isSubmitting, setField, handleSubmit } = useRegisterForm();
  const { fieldErrors, alert } = errors;

  return (
    <main className="flex min-h-screen justify-center bg-white px-6 py-10">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <BrandLogo />

        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-slate-900">Crea el teu compte</h1>
          <p className="text-sm text-slate-500">
            Unifica tots els teus comptes bancaris en un sol lloc, de forma segura.
          </p>
        </header>

        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
          {alert && <FormAlert title={alert.title} description={alert.description} />}
          <TextField
            label="Nom"
            name="name"
            autoComplete="name"
            maxLength={MAX_NAME_LENGTH}
            value={fields.name}
            onChange={(event) => setField("name", event.target.value)}
            error={fieldErrors.name}
            disabled={isSubmitting}
          />
          <TextField
            label="Correu electrònic"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="tu@email.com"
            value={fields.email}
            onChange={(event) => setField("email", event.target.value)}
            error={fieldErrors.email}
            disabled={isSubmitting}
          />
          <PasswordField
            label="Contrasenya"
            name="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={fields.password}
            onChange={(event) => setField("password", event.target.value)}
            error={fieldErrors.password}
            hint={<PasswordStrengthMeter password={fields.password} />}
            disabled={isSubmitting}
          />

          <Button type="submit" loading={isSubmitting} className="mt-2">
            {isSubmitting ? "Processant…" : "Crear compte"}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500">
          Ja tens compte?{" "}
          <Link to="/login" className="font-semibold text-primary">
            Inicia la sessió
          </Link>
        </p>
      </div>
    </main>
  );
}
