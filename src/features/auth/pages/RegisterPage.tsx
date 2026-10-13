import { useAuthActions } from "@convex-dev/auth/react";
import { ConvexError } from "convex/values";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";

/**
 * Minimal registration UI to exercise US1.1 backend.
 * Frontend teammates should replace the visual design; keep the signIn contract:
 *
 *   signIn("password", { name, email, password, flow: "signUp" })
 *
 * On success → navigate to "/".
 * On invalid email / duplicate account → show Catalan error message.
 */
export function RegisterPage() {
  const { signIn } = useAuthActions();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(event.currentTarget);
    formData.set("flow", "signUp");

    try {
      await signIn("password", formData);
      navigate("/", { replace: true });
    } catch (err) {
      setError(mapRegisterError(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Crear un compte</h1>
        <p className="mt-1 text-sm text-slate-600">
          Registre amb correu i contrasenya (US1.1).
        </p>
      </div>

      <form className="flex flex-col gap-4" onSubmit={(e) => void onSubmit(e)}>
        <Input label="Nom" name="name" autoComplete="name" required />
        <Input
          label="Correu electrònic"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
        <Input
          label="Contrasenya"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />

        {error ? (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <Button type="submit" disabled={pending}>
          {pending ? "Creant compte…" : "Registrar-me"}
        </Button>
      </form>

      <Link className="text-sm text-slate-700 underline" to="/">
        Tornar a l&apos;inici
      </Link>
    </main>
  );
}

function mapRegisterError(error: unknown): string {
  if (error instanceof ConvexError) {
    const data = error.data as { code?: string; message?: string } | string;
    if (typeof data === "object" && data !== null) {
      if (typeof data.message === "string") {
        return data.message;
      }
      if (data.code === "INVALID_EMAIL") {
        return "El format del correu electrònic no és vàlid.";
      }
      if (data.code === "INVALID_NAME") {
        return "El nom és obligatori.";
      }
      if (data.code === "INVALID_PASSWORD") {
        return "La contrasenya ha de tenir almenys 8 caràcters.";
      }
    }
  }

  const message = error instanceof Error ? error.message : String(error);
  if (/already|exist|compte|account/i.test(message)) {
    return "Aquest correu electrònic ja està registrat.";
  }

  return "No s'ha pogut completar el registre. Torna-ho a provar.";
}
