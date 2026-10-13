import { useAuthActions } from "@convex-dev/auth/react";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { Alert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { PasswordInput } from "../../../components/ui/PasswordInput";
import {
  getRedirectFrom,
  LOGIN_MESSAGES,
  validateLoginForm,
  type LoginField,
  type LoginFieldErrors,
  type LoginValues,
} from "../loginForm";

const EMPTY_VALUES: LoginValues = { email: "", password: "" };

/**
 * Contract: signIn("password", { email, password, flow: "signIn" }).
 * The redirect after success is done by GuestOnly.
 */
export function LoginForm() {
  const { signIn } = useAuthActions();
  const location = useLocation();
  const [values, setValues] = useState<LoginValues>(EMPTY_VALUES);
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [failed, setFailed] = useState(false);
  const [pending, setPending] = useState(false);

  const showSessionNotice = getRedirectFrom(location.state) !== null && !failed;

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const field = event.target.name as LoginField;
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFailed(false);

    const errors = validateLoginForm(values);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setPending(true);
    try {
      await signIn("password", { ...values, flow: "signIn" });
    } catch {
      setFailed(true);
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {failed ? (
        <Alert tone="danger" title={LOGIN_MESSAGES.invalidCredentials.title}>
          {LOGIN_MESSAGES.invalidCredentials.description}
        </Alert>
      ) : null}
      {showSessionNotice ? (
        <Alert tone="info" title={LOGIN_MESSAGES.sessionRequired.title}>
          {LOGIN_MESSAGES.sessionRequired.description}
        </Alert>
      ) : null}

      <form noValidate onSubmit={(e) => void onSubmit(e)}>
        <fieldset disabled={pending} className="flex flex-col gap-5">
          <Input
            label="Correu electrònic"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="tu@correu.com"
            value={values.email}
            onChange={onChange}
            error={fieldErrors.email}
          />
          <PasswordInput
            label="Contrasenya"
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={values.password}
            onChange={onChange}
            error={fieldErrors.password}
          />
          <Button type="submit" loading={pending} className="mt-1 w-full">
            {pending ? "Processant…" : "Inicia sessió"}
          </Button>
        </fieldset>
      </form>

      <p className="text-center text-sm text-muted">
        No tens compte?{" "}
        <Link className="font-medium text-brand hover:text-brand-strong" to="/register">
          Registra't
        </Link>
      </p>
    </div>
  );
}
