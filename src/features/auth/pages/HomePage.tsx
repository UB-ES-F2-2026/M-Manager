import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import BrandLogo from "../components/BrandLogo";
import SessionLoading from "../components/SessionLoading";
import SignOutButton from "../components/SignOutButton";

/**
 * Temporary main screen (US1.2): shows who is signed in and lets them sign out.
 * The real main screen will replace this page in its own task.
 */
export default function HomePage() {
  const user = useQuery(api.users.currentUser);

  if (!user) {
    return <SessionLoading />;
  }

  return (
    <main className="flex min-h-screen justify-center bg-white px-6 py-10">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <BrandLogo />

        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-slate-900">
            {user.name ? `Hola, ${user.name}` : "Hola!"}
          </h1>
          <p className="text-sm text-slate-500">{user.email}</p>
        </header>

        <SignOutButton />
      </div>
    </main>
  );
}
