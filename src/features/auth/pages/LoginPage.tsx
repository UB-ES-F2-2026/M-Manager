import { useAuthActions } from "@convex-dev/auth/react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { LOGIN_ERROR_MESSAGE } from "../loginMessages";

/**
 * Minimal login UI for US1.2.
 * Frontend teammates can restyle; keep this contract:
 *
 *   signIn("password", { email, password, flow: "signIn" })
 *
 * Success → "/". Wrong credentials → generic Catalan error (do not reveal which field failed).
 * Session persistence and logout are handled by Convex Auth + HomePage signOut.
 */
export function LoginPage() {
  const { signIn } = useAuthActions();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(event.currentTarget);
    formData.set("flow", "signIn");

    try {
      await signIn("password", formData);
      navigate("/", { replace: true });
    } catch {
      setError(LOGIN_ERROR_MESSAGE);
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Iniciar sessió</h1>
        <p className="mt-1 text-sm text-slate-600">
          Accedeix amb el teu correu i contrasenya (US1.2).
        </p>
      </div>

      <form className="flex flex-col gap-4" onSubmit={(e) => void onSubmit(e)}>
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
          autoComplete="current-password"
          required
        />

        {error ? (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <Button type="submit" disabled={pending}>
          {pending ? "Entrant…" : "Entrar"}
        </Button>
      </form>

      <p className="text-sm text-slate-700">
        Encara no tens compte?{" "}
        <Link className="underline" to="/register">
          Registrar-me
        </Link>
      </p>
      <Link className="text-sm text-slate-700 underline" to="/">
        Tornar a l&apos;inici
      </Link>
    </main>
  );
}
