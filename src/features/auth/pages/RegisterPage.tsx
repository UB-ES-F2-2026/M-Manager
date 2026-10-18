import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import Button from "../../../components/ui/Button";
import PasswordField from "../../../components/ui/PasswordField";
import TextField from "../../../components/ui/TextField";
import BrandLogo from "../components/BrandLogo";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";

/** US1.1: sign-up screen (name, email and password). */
export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Sending the form to Convex Auth, showing errors and redirecting
    // are done in a separate task.
  }

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
          <TextField
            label="Nom"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <TextField
            label="Correu electrònic"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <PasswordField
            label="Contrasenya"
            name="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            hint={<PasswordStrengthMeter password={password} />}
          />

          <Button type="submit" className="mt-2">
            Crear compte
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
