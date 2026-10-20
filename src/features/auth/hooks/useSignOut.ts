import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const SIGN_OUT_ERROR_MESSAGE =
  "No s'ha pogut tancar la sessió. Torna-ho a provar.";

/** Ends the session in Convex Auth. Returns false when it could not be closed. */
export async function attemptSignOut(signOut: () => Promise<void>): Promise<boolean> {
  try {
    await signOut();
    return true;
  } catch {
    return false;
  }
}

/** Sign-out action and its state for the "Tancar sessió" button (US1.2). */
export function useSignOut() {
  const { signOut } = useAuthActions();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignOut() {
    setIsSigningOut(true);
    setError(null);
    if (await attemptSignOut(signOut)) {
      navigate("/login", { replace: true });
      return;
    }
    setError(SIGN_OUT_ERROR_MESSAGE);
    setIsSigningOut(false);
  }

  return { isSigningOut, error, handleSignOut };
}
