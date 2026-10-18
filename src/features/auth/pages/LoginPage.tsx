import { Link } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";
import LoginForm from "../components/LoginForm";

/** US1.2: login screen (email and password). Route: /login */
export default function LoginPage() {
  return (
    <main className="flex min-h-screen justify-center bg-white px-6 py-10">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <BrandLogo />

        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-slate-900">Hola de nou</h1>
          <p className="text-sm text-slate-500">
            Accedeix per veure i gestionar tots els teus comptes.
          </p>
        </header>

        <LoginForm />

        <p className="text-center text-sm text-slate-500">
          No tens compte?{" "}
          <Link to="/register" className="font-semibold text-primary">
            Registra't
          </Link>
        </p>
      </div>
    </main>
  );
}
