/** How many rows the home screen shows under "Últims moviments". */
export const HOME_RECENT_TRANSACTION_LIMIT = 3;

/**
 * Keeps the first `limit` transactions. The backend already returns them
 * newest first, so this is just the home preview size.
 */
export function selectRecentTransactions<T>(
  transactions: T[],
  limit: number = HOME_RECENT_TRANSACTION_LIMIT,
): T[] {
  return transactions.slice(0, limit);
}
