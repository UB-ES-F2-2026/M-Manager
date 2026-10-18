import AuthHeader from "../components/AuthHeader";
import LoginForm from "../components/LoginForm";

/** Login screen (US1.2). Route: /login */
export default function LoginPage() {
  return (
    <main className="flex min-h-screen justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <AuthHeader
          title="Hola de nou"
          subtitle="Accedeix per veure i gestionar tots els teus comptes."
        />
        <LoginForm />
      </div>
    </main>
  );
}
