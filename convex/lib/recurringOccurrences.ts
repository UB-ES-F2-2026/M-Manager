import type { Doc } from "../_generated/dataModel";

const DAY_MS = 24 * 60 * 60 * 1000;

export type UpcomingPayment = {
  /** Planned occurrence timestamp (UTC midnight of that civil day), ms. */
  date: number;
  type: Doc<"recurringTransactions">["type"];
  amountCents: number;
  category: Doc<"recurringTransactions">["category"];
  concept: string;
  frequency: Doc<"recurringTransactions">["frequency"];
  sourceTransactionId: Doc<"recurringTransactions">["sourceTransactionId"];
};

/** UTC civil parts of a timestamp that was stored as UTC midnight. */
export function utcCivilParts(timestampMs: number): {
  year: number;
  month: number;
  day: number;
} {
  const date = new Date(timestampMs);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

/** UTC midnight for a civil Y-M-D. */
export function utcMidnight(year: number, month: number, day: number): number {
  return Date.UTC(year, month - 1, day);
}

/** True when both timestamps fall on the same UTC civil day. */
export function sameUtcCivilDay(aMs: number, bMs: number): boolean {
  const a = utcCivilParts(aMs);
  const b = utcCivilParts(bMs);
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

/**
 * Whether this civil day is an occurrence of the rule (US2.5).
 * Monthly: same day-of-month. Yearly: same month and day.
 */
export function ruleMatchesCivilDay(
  rule: Pick<
    Doc<"recurringTransactions">,
    "frequency" | "dayOfMonth" | "monthOfYear"
  >,
  month: number,
  day: number,
): boolean {
  if (day !== rule.dayOfMonth) {
    return false;
  }
  if (rule.frequency === "yearly" && month !== rule.monthOfYear) {
    return false;
  }
  return true;
}

/**
 * Expands recurring rules into pending occurrences inside `[rangeStart, rangeEnd]`
 * (inclusive, UTC midnights). Sorted ascending by date (US2.5 AC2).
 *
 * The client must send bounds as UTC midnights for the civil days of the
 * user's local calendar (same pattern as month bounds for US2.4).
 */
export function expandUpcomingPayments(
  rules: Doc<"recurringTransactions">[],
  rangeStart: number,
  rangeEnd: number,
): UpcomingPayment[] {
  const payments: UpcomingPayment[] = [];

  for (let t = rangeStart; t <= rangeEnd; t += DAY_MS) {
    const { month, day } = utcCivilParts(t);
    for (const rule of rules) {
      if (!ruleMatchesCivilDay(rule, month, day)) {
        continue;
      }
      payments.push({
        date: t,
        type: rule.type,
        amountCents: rule.amountCents,
        category: rule.category,
        concept: rule.concept,
        frequency: rule.frequency,
        sourceTransactionId: rule.sourceTransactionId,
      });
    }
  }

  payments.sort((a, b) => a.date - b.date || a.concept.localeCompare(b.concept));
  return payments;
}
