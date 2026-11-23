import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSessionStatus } from "../hooks/useSessionStatus";
import type { AuthRedirectState } from "../redirectAfterAuth";
import SessionLoading from "./SessionLoading";

/**
 * Shows its content only with an open session; otherwise sends the visitor to
 * /login, remembering this page so they come back to it after signing in.
 */
export default function RequireSession({ children }: { children: ReactNode }) {
  const status = useSessionStatus();
  const location = useLocation();

  if (status === "loading") {
    return <SessionLoading />;
  }
  if (status === "signedOut") {
    const state: AuthRedirectState = { from: location.pathname + location.search };
    return <Navigate to="/login" replace state={state} />;
  }
  return children;
}
