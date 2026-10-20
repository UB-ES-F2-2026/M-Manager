import { useAuthToken } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";

export type SessionStatus = "loading" | "signedIn" | "signedOut";

export type SessionSignals = {
  /** Convex is still checking the stored session (e.g. right after a reload). */
  isLoading: boolean;
  /** Convex has confirmed the session with the backend. */
  isAuthenticated: boolean;
  /** Convex Auth holds a token in the browser. */
  hasToken: boolean;
};

/**
 * Right after signIn() there is a moment where the token is already stored
 * but Convex has not confirmed it yet and reports "not authenticated".
 * Treating that moment as loading avoids bouncing the user back to /login.
 */
export function getSessionStatus({
  isLoading,
  isAuthenticated,
  hasToken,
}: SessionSignals): SessionStatus {
  if (isAuthenticated) {
    return "signedIn";
  }
  if (isLoading || hasToken) {
    return "loading";
  }
  return "signedOut";
}

/** Session state of the current visitor. Convex Auth keeps it across reloads. */
export function useSessionStatus(): SessionStatus {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const token = useAuthToken();
  return getSessionStatus({ isLoading, isAuthenticated, hasToken: token !== null });
}
