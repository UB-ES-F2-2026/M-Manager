import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSessionStatus } from "../hooks/useSessionStatus";
import { redirectPathAfterAuth } from "../redirectAfterAuth";
import SessionLoading from "./SessionLoading";

/**
 * Wraps /login and /register: a user with an open session goes straight to the
 * app, to the page that asked for the session if there was one.
 */
export default function RedirectIfSignedIn({ children }: { children: ReactNode }) {
  const status = useSessionStatus();
  const location = useLocation();

  if (status === "loading") {
    return <SessionLoading />;
  }
  if (status === "signedIn") {
    return <Navigate to={redirectPathAfterAuth(location.state)} replace />;
  }
  return children;
}
