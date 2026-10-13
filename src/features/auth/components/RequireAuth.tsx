import { useConvexAuth } from "convex/react";
import { useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { FullPageSpinner } from "../../../components/ui/Spinner";
import type { AuthRedirectState } from "../loginForm";

/** Protected route: guests are sent to /login, remembering where they wanted to go. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const location = useLocation();
  const [hadSession, setHadSession] = useState(false);

  if (isAuthenticated && !hadSession) {
    setHadSession(true);
  }

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (!isAuthenticated) {
    // After a logout there is nothing to resume, so no "sign in to continue" notice.
    const state: AuthRedirectState | undefined = hadSession
      ? undefined
      : { from: `${location.pathname}${location.search}` };
    return <Navigate to="/login" replace state={state} />;
  }

  return children;
}
