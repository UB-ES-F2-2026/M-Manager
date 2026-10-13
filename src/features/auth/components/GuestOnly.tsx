import { useConvexAuth } from "convex/react";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { FullPageSpinner } from "../../../components/ui/Spinner";
import { getPostLoginPath } from "../loginForm";

/**
 * Wraps /login and /register. Redirecting here, instead of right after
 * signIn() resolves, waits until Convex confirms the session; otherwise
 * RequireAuth would briefly see a guest and bounce back to /login.
 */
export function GuestOnly({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const location = useLocation();

  if (isAuthenticated) {
    return <Navigate to={getPostLoginPath(location.state)} replace />;
  }

  if (isLoading) {
    return <FullPageSpinner />;
  }

  return children;
}
