import Button from "../../../components/ui/Button";
import PasswordField from "../../../components/ui/PasswordField";
import TextField from "../../../components/ui/TextField";
import { LOGIN_ERROR_ALERT, useLoginForm } from "../hooks/useLoginForm";
import FormAlert from "./FormAlert";

/** Email + password login form (US1.2 · AC1, AC2, AC3). */
export default function LoginForm() {
  const { fields, errors, hasCredentialsError, isSubmitting, setField, handleSubmit } =
    useLoginForm();

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      {hasCredentialsError && (
        <FormAlert title={LOGIN_ERROR_ALERT.title} description={LOGIN_ERROR_ALERT.description} />
      )}
      <TextField
        label="Correu electrònic"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="tu@email.com"
        value={fields.email}
        onChange={(event) => setField("email", event.target.value)}
        error={errors.email}
        disabled={isSubmitting}
      />
      <PasswordField
        label="Contrasenya"
        name="password"
        autoComplete="current-password"
        placeholder="••••••••"
        value={fields.password}
        onChange={(event) => setField("password", event.target.value)}
        error={errors.password}
        disabled={isSubmitting}
      />

      <Button type="submit" loading={isSubmitting} className="mt-2">
        {isSubmitting ? "Processant…" : "Inicia sessió"}
      </Button>
    </form>
  );
}
