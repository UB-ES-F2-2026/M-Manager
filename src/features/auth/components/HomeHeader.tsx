import { useState } from "react";
import { LogoutIcon } from "../../../components/ui/icons";
import { formatLongDate } from "../../../lib/dates";
import { getGreeting } from "../../../lib/greeting";
import { useSignOut } from "../hooks/useSignOut";

/** "Hola, Ana" + today's date, with the sign-out button where the design has the bell. */
export default function HomeHeader({ name }: { name: string }) {
  const { isSigningOut, error, handleSignOut } = useSignOut();
  const [today] = useState(() => Date.now());

  return (
    <header className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{getGreeting(name)}</h1>
          <p className="text-sm text-slate-500">{formatLongDate(today)}</p>
        </div>
        <button
          type="button"
          onClick={() => void handleSignOut()}
          disabled={isSigningOut}
          aria-label="Tancar sessió"
          title="Tancar sessió"
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSigningOut ? (
            <span
              aria-hidden="true"
              className="size-5 animate-spin rounded-full border-2 border-slate-200 border-t-primary"
            />
          ) : (
            <LogoutIcon className="size-5" />
          )}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </header>
  );
}
