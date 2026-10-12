import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "../../../../convex/_generated/api";
import { Button } from "../../../components/ui/Button";

/** Temporary home shell so registration redirect can be verified. */
export function HomePage() {
  const user = useQuery(api.users.currentUser);
  const { signOut } = useAuthActions();

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">M-Manager</h1>
      {user === undefined ? (
        <p>Carregant…</p>
      ) : user === null ? (
        <>
          <p>No has iniciat sessió.</p>
          <Link className="text-slate-900 underline" to="/register">
            Crear un compte
          </Link>
        </>
      ) : (
        <>
          <p>
            Benvingut/da, <strong>{user.name || user.email}</strong>.
          </p>
          <p className="text-sm text-slate-600">{user.email}</p>
          <Button type="button" onClick={() => void signOut()}>
            Tancar sessió
          </Button>
        </>
      )}
    </main>
  );
}
