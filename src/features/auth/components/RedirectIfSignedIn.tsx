import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useSessionStatus } from "../hooks/useSessionStatus";
import SessionLoading from "./SessionLoading";

/** Wraps /login and /register: a user with an open session goes straight to the app. */
export default function RedirectIfSignedIn({ children }: { children: ReactNode }) {
  const status = useSessionStatus();

  if (status === "loading") {
    return <SessionLoading />;
  }
  if (status === "signedIn") {
    return <Navigate to="/" replace />;
  }
  return children;
}
