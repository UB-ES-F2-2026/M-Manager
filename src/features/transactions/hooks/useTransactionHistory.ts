import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Doc } from "../../../../convex/_generated/dataModel";

export type Transaction = Doc<"transactions">;

/** Transactions of one calendar day, in the order they came from the backend. */
export type TransactionDay = {
  /** Local midnight of the day, in ms. */
  dayStartMs: number;
  transactions: Transaction[];
};

function startOfDay(timestampMs: number): number {
  const date = new Date(timestampMs);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/**
 * Splits a newest-first list into one group per local calendar day,
 * keeping the order of the days and of the transactions inside each day.
 */
export function groupTransactionsByDay(transactions: Transaction[]): TransactionDay[] {
  const days: TransactionDay[] = [];
  for (const transaction of transactions) {
    const dayStartMs = startOfDay(transaction.date);
    const current = days.at(-1);
    if (current && current.dayStartMs === dayStartMs) {
      current.transactions.push(transaction);
    } else {
      days.push({ dayStartMs, transactions: [transaction] });
    }
  }
  return days;
}

/** History of the signed-in user grouped by day, or undefined while it loads (US2.3). */
export function useTransactionHistory(): TransactionDay[] | undefined {
  const transactions = useQuery(api.transactions.list, {});
  return transactions === undefined ? undefined : groupTransactionsByDay(transactions);
}
