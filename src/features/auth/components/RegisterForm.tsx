import { useAuthActions } from "@convex-dev/auth/react";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Alert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { PasswordInput } from "../../../components/ui/PasswordInput";
import {
  mapRegisterError,
  REGISTER_MESSAGES,
  validateRegisterForm,
  type RegisterAlert,
  type RegisterField,
  type RegisterFieldErrors,
  type RegisterValues,
} from "../registerForm";
import { PasswordStrengthMeter } from "./PasswordStrengthMeter";

const EMPTY_VALUES: RegisterValues = { name: "", email: "", password: "" };

/**
 * Contract: signIn("password", { name, email, password, flow: "signUp" }).
 * The redirect after success is done by GuestOnly.
 */
export function RegisterForm() {
  const { signIn } = useAuthActions();
  const [values, setValues] = useState<RegisterValues>(EMPTY_VALUES);
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const [alert, setAlert] = useState<RegisterAlert | null>(null);
  const [pending, setPending] = useState(false);

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const field = event.target.name as RegisterField;
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAlert(null);

    const errors = validateRegisterForm(values);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setPending(true);
    try {
      await signIn("password", { ...values, flow: "signUp" });
    } catch (error) {
      const result = mapRegisterError(error);
      setAlert(result.alert);
      setFieldErrors(result.fieldErrors);
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {alert ? (
        <Alert tone="danger" title={alert.title}>
          {alert.description}
        </Alert>
      ) : null}

      <form noValidate onSubmit={(e) => void onSubmit(e)}>
        <fieldset disabled={pending} className="flex flex-col gap-5">
          <Input
            label="Nom"
            name="name"
            autoComplete="name"
            placeholder="El teu nom"
            value={values.name}
            onChange={onChange}
            error={fieldErrors.name}
          />
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
            autoComplete="new-password"
            placeholder="••••••••"
            value={values.password}
            onChange={onChange}
            error={fieldErrors.password}
            hint={
              values.password && !pending ? (
                <PasswordStrengthMeter password={values.password} />
              ) : (
                REGISTER_MESSAGES.passwordHint
              )
            }
          />
          <Button type="submit" loading={pending} className="mt-1 w-full">
            {pending ? "Processant…" : "Crear compte"}
          </Button>
        </fieldset>
      </form>

      <p className="text-center text-sm text-muted">
        Ja tens compte?{" "}
        <Link className="font-medium text-brand hover:text-brand-strong" to="/login">
          Inicia sessió
        </Link>
      </p>
    </div>
  );
}
