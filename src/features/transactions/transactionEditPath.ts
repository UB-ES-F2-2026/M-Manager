/** URL of the edit screen of a transaction. Must match the route in App.tsx. */
export function transactionEditPath(id: string): string {
  return `/transactions/${id}/edit`;
}
