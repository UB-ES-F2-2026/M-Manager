import { AuthLayout } from "../components/AuthLayout";
import { RegisterForm } from "../components/RegisterForm";

/** US1.1 — create an account with name, email and password. */
export function RegisterPage() {
  return (
    <AuthLayout
      title="Crea el teu compte"
      subtitle="Gestiona totes les teves finances en un sol lloc, de forma segura."
    >
      <RegisterForm />
    </AuthLayout>
  );
}
