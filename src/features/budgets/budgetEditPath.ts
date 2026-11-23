/** URL of the edit screen of a budget. Must match the route in App.tsx. */
export function budgetEditPath(id: string): string {
  return `/budgets/${id}/edit`;
}
