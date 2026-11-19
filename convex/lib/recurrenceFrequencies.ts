import { v } from "convex/values";

/**
 * Allowed recurrence frequencies (US2.5).
 * Values are stored in English; the UI shows Catalan labels later.
 */
export const RECURRENCE_FREQUENCIES = ["monthly", "yearly"] as const;

export type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCIES)[number];

/** Payment day of month accepted by the product (US2.5): 1–28. */
export const MIN_DAY_OF_MONTH = 1;
export const MAX_DAY_OF_MONTH = 28;

/** Convex validator for `recurringTransactions.frequency`. */
export const recurrenceFrequencyValidator = v.union(
  v.literal("monthly"),
  v.literal("yearly"),
);
