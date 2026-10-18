import { Link } from "react-router-dom";
import { useLoginForm } from "../hooks/useLoginForm";
import PasswordField from "./PasswordField";
import SubmitButton from "./SubmitButton";
import TextField from "./TextField";

/** Email + password login form (US1.2 · AC1, AC3). */
export default function LoginForm() {
  const { fields, errors, isSubmitting, setField, handleSubmit } = useLoginForm();

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-5">
      <TextField
        id="email"
        label="Correu electrònic"
        type="email"
        autoComplete="email"
        placeholder="tu@correu.com"
        value={fields.email}
        onChange={(event) => setField("email", event.target.value)}
        error={errors.email}
        disabled={isSubmitting}
      />
      <PasswordField
        id="password"
        label="Contrasenya"
        autoComplete="current-password"
        value={fields.password}
        onChange={(event) => setField("password", event.target.value)}
        error={errors.password}
        disabled={isSubmitting}
      />
      <SubmitButton isLoading={isSubmitting} loadingText="Processant…">
        Inicia sessió
      </SubmitButton>
      <p className="text-center text-xs text-slate-500">
        No tens compte?{" "}
        <Link to="/register" className="font-medium text-blue-800 hover:underline">
          Registra't
        </Link>
      </p>
    </form>
  );
}
