import { ConvexError, v } from "convex/values";

/**
 * Allowed recurrence frequencies (US2.5).
 * Values are stored in English; the UI shows Catalan labels later.
 */
export const RECURRENCE_FREQUENCIES = ["monthly", "yearly"] as const;

export type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCIES)[number];

/** Payment day of month accepted by the product (US2.5): 1–28. */
export const MIN_DAY_OF_MONTH = 1;
export const MAX_DAY_OF_MONTH = 28;

/** Calendar month 1–12 (anchor month for yearly rules). */
export const MIN_MONTH_OF_YEAR = 1;
export const MAX_MONTH_OF_YEAR = 12;

/** Field error shown by the transaction form (US2.5 AC1). */
export const DAY_OF_MONTH_MESSAGE = "Indica un dia entre 1 i 28.";

export type RecurrenceErrorCode = "INVALID_DAY_OF_MONTH" | "INVALID_MONTH_OF_YEAR";

/** Convex validator for `recurringTransactions.frequency`. */
export const recurrenceFrequencyValidator = v.union(
  v.literal("monthly"),
  v.literal("yearly"),
);

/** Args the transaction form sends when the recurrence switch is on. */
export const recurrenceInputValidator = v.object({
  frequency: recurrenceFrequencyValidator,
  dayOfMonth: v.number(),
  /** Month 1–12 of the form date (needed for yearly frequency). */
  monthOfYear: v.number(),
});

export type RecurrenceInput = {
  frequency: RecurrenceFrequency;
  dayOfMonth: number;
  monthOfYear: number;
};

/** Rejects a payment day outside 1–28 or a non-integer. */
export function assertValidDayOfMonth(dayOfMonth: number): number {
  if (
    !Number.isInteger(dayOfMonth) ||
    dayOfMonth < MIN_DAY_OF_MONTH ||
    dayOfMonth > MAX_DAY_OF_MONTH
  ) {
    throw new ConvexError({
      code: "INVALID_DAY_OF_MONTH" satisfies RecurrenceErrorCode,
      message: DAY_OF_MONTH_MESSAGE,
    });
  }
  return dayOfMonth;
}

/** Rejects a calendar month outside 1–12 or a non-integer. */
export function assertValidMonthOfYear(monthOfYear: number): number {
  if (
    !Number.isInteger(monthOfYear) ||
    monthOfYear < MIN_MONTH_OF_YEAR ||
    monthOfYear > MAX_MONTH_OF_YEAR
  ) {
    throw new ConvexError({
      code: "INVALID_MONTH_OF_YEAR" satisfies RecurrenceErrorCode,
      message: "El mes de la recurrència no és vàlid.",
    });
  }
  return monthOfYear;
}

/** Validates frequency payload from the form and returns it ready to store. */
export function assertValidRecurrenceInput(
  input: RecurrenceInput,
): RecurrenceInput {
  return {
    frequency: input.frequency,
    dayOfMonth: assertValidDayOfMonth(input.dayOfMonth),
    monthOfYear: assertValidMonthOfYear(input.monthOfYear),
  };
}
