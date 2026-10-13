import { AuthLayout } from "../components/AuthLayout";
import { LoginForm } from "../components/LoginForm";

/** US1.2 — sign in with email and password. */
export function LoginPage() {
  return (
    <AuthLayout
      title="Hola de nou"
      subtitle="Accedeix per veure i gestionar les teves finances."
    >
      <LoginForm />
    </AuthLayout>
  );
}
