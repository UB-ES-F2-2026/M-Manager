import type { NetWorthKind } from "./hooks/useNetWorthForm";

/** URL of the edit screen of an asset or a debt. Must match the routes in App.tsx. */
export function netWorthEditPath(kind: NetWorthKind, id: string): string {
  return `/net-worth/${kind === "asset" ? "assets" : "debts"}/${id}/edit`;
}
