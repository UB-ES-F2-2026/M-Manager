import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useSessionStatus } from "../hooks/useSessionStatus";
import SessionLoading from "./SessionLoading";

/** Shows its content only with an open session; otherwise sends the visitor to /login. */
export default function RequireSession({ children }: { children: ReactNode }) {
  const status = useSessionStatus();

  if (status === "loading") {
    return <SessionLoading />;
  }
  if (status === "signedOut") {
    return <Navigate to="/login" replace />;
  }
  return children;
}
