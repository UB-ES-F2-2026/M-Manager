import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { LogoutIcon } from "../../../components/ui/icons";
import { Spinner } from "../../../components/ui/Spinner";
import { formatLongDate } from "../../../lib/dates";
import { getGreeting } from "../greeting";

export function HomeHeader({ name }: { name: string }) {
  const { signOut } = useAuthActions();
  const [signingOut, setSigningOut] = useState(false);
  const [today] = useState(() => Date.now());

  async function onSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      setSigningOut(false);
    }
  }

  return (
    <header className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-ink">{getGreeting(name)}</h1>
        <p className="text-sm text-muted">{formatLongDate(today)}</p>
      </div>
      <button
        type="button"
        onClick={() => void onSignOut()}
        disabled={signingOut}
        aria-label="Tancar sessió"
        title="Tancar sessió"
        className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-white text-ink transition hover:bg-surface focus-visible:ring-4 focus-visible:ring-brand-soft focus-visible:outline-none disabled:text-subtle"
      >
        {signingOut ? <Spinner /> : <LogoutIcon className="size-5" />}
      </button>
    </header>
  );
}
