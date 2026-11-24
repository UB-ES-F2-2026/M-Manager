/**
 * Router state that RequireSession leaves when it sends a visitor to /login,
 * so after signing in (or signing up) they land on the page they asked for,
 * e.g. an invite link /groups/join?code=K7M2QX (US4.1 AC3).
 */
export type AuthRedirectState = { from: string };

/**
 * Where to go after signing in: the stored in-app path, or home.
 * Only paths of this app are accepted ("/..."), never "//other.site".
 */
export function redirectPathAfterAuth(state: unknown): string {
  if (
    typeof state === "object" &&
    state !== null &&
    "from" in state &&
    typeof state.from === "string" &&
    state.from.startsWith("/") &&
    !state.from.startsWith("//")
  ) {
    return state.from;
  }
  return "/";
}
