import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Doc } from "../../../../convex/_generated/dataModel";
import type { TransactionCategory } from "../../../../convex/lib/transactionCategories";

export type Transaction = Doc<"transactions">;

/** Transactions of one calendar day, in the order they came from the backend. */
export type TransactionDay = {
  /** Local midnight of the day, in ms. */
  dayStartMs: number;
  transactions: Transaction[];
};

/** Filter values as the form holds them: dates as "YYYY-MM-DD", "" when not set. */
export type HistoryFilters = {
  from: string;
  to: string;
  category: TransactionCategory | "";
};

/** Arguments of `api.transactions.list`. */
export type HistoryQueryArgs = {
  from?: number;
  to?: number;
  category?: TransactionCategory;
};

export const EMPTY_HISTORY_FILTERS: HistoryFilters = { from: "", to: "", category: "" };

/** Same text the backend uses for INVALID_DATE_RANGE. */
export const INVALID_RANGE_MESSAGE = "La data d'inici no pot ser posterior a la data de fi.";

function startOfDay(timestampMs: number): number {
  const date = new Date(timestampMs);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/** "YYYY-MM-DD" → local midnight of that day in ms, or null if it is not a real day. */
export function parseDayInput(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date.getTime();
}

/**
 * Turns the filter form into query arguments. Both days are inclusive:
 * `from` starts at local midnight and `to` ends at the last ms of its day.
 * Returns `args: null` and an error when the range is the wrong way round.
 */
export function buildHistoryQueryArgs(filters: HistoryFilters): {
  args: HistoryQueryArgs | null;
  rangeError?: string;
} {
  const args: HistoryQueryArgs = {};

  const fromDay = parseDayInput(filters.from);
  if (fromDay !== null) {
    args.from = fromDay;
  }

  const toDay = parseDayInput(filters.to);
  if (toDay !== null) {
    const nextDay = new Date(toDay);
    nextDay.setDate(nextDay.getDate() + 1);
    args.to = nextDay.getTime() - 1;
  }

  if (filters.category !== "") {
    args.category = filters.category;
  }

  if (args.from !== undefined && args.to !== undefined && args.from > args.to) {
    return { args: null, rangeError: INVALID_RANGE_MESSAGE };
  }
  return { args };
}

/** True when at least one filter is set. */
export function hasActiveFilters(filters: HistoryFilters): boolean {
  return filters.from !== "" || filters.to !== "" || filters.category !== "";
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

/**
 * History of the signed-in user grouped by day (US2.3), filtered by dates
 * and category. `days` is undefined while it loads or when the range is wrong.
 */
export function useTransactionHistory(filters: HistoryFilters = EMPTY_HISTORY_FILTERS): {
  days: TransactionDay[] | undefined;
  rangeError?: string;
} {
  const { args, rangeError } = buildHistoryQueryArgs(filters);
  const transactions = useQuery(api.transactions.list, args ?? "skip");
  return {
    days: transactions === undefined ? undefined : groupTransactionsByDay(transactions),
    rangeError,
  };
}
