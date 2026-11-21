/** Percentage of the monthly limit from which a budget shows the warning (US3.1 · AC3). */
export const MAX_BUDGET_ALERT = 80;

/** Percentage from which a budget is exceeded (US3.1 · AC3). */
export const BUDGET_EXCEEDED = 100;

/** How close a budget is to its limit: below 80%, from 80% to 99%, or 100% and above. */
export type BudgetStatus = "ok" | "warning" | "exceeded";

/** What the progress row needs from a budget returned by `api.budgets.list`. */
export type BudgetSpending = {
  amountCents: number;
  spentCents: number;
};

/**
 * Whole percentage of the limit already spent, rounded down (e.g. 72).
 * Rounding down keeps the number and the colour in agreement: 79.9% shows
 * "79%" without the warning, never "80%" without it. Can go above 100.
 */
export function budgetPercent({ amountCents, spentCents }: BudgetSpending): number {
  if (amountCents <= 0) {
    return 0;
  }
  return Math.floor((spentCents * 100) / amountCents);
}

/** Alert level of a whole percentage (see `budgetPercent`). */
export function budgetStatus(percent: number): BudgetStatus {
  if (percent >= BUDGET_EXCEEDED) {
    return "exceeded";
  }
  if (percent >= MAX_BUDGET_ALERT) {
    return "warning";
  }
  return "ok";
}

/** Width of the bar fill, as a percentage: min(percent, 100). */
export function budgetBarWidth(percent: number): number {
  return Math.min(Math.max(percent, 0), 100);
}

/**
 * The `limit` budgets with the highest share of their limit spent, highest first
 * (home summary shows 3). Budgets with the same share keep their original order.
 */
export function selectTopBudgets<T extends BudgetSpending>(budgets: readonly T[], limit: number): T[] {
  const share = (budget: T) =>
    budget.amountCents > 0 ? budget.spentCents / budget.amountCents : 0;
  return [...budgets].sort((a, b) => share(b) - share(a)).slice(0, limit);
}
