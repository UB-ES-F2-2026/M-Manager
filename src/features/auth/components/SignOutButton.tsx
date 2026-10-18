import Button from "../../../components/ui/Button";
import { useSignOut } from "../hooks/useSignOut";

/** "Tancar sessió" button: closes the session and goes back to /login. */
export default function SignOutButton() {
  const { isSigningOut, error, handleSignOut } = useSignOut();

  return (
    <div className="flex flex-col gap-2">
      <Button loading={isSigningOut} onClick={() => void handleSignOut()}>
        {isSigningOut ? "Tancant sessió…" : "Tancar sessió"}
      </Button>
      {error && (
        <p role="alert" className="text-center text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
