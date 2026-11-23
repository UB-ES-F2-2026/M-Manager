import {
  MAX_DAY_OF_MONTH,
  MIN_DAY_OF_MONTH,
  type RecurrenceFrequency,
} from "../../../convex/lib/recurrenceFrequencies";

/** Catalan label shown in the UI for each stored frequency value (US2.5). */
export const FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  monthly: "Mensual",
  yearly: "Anual",
};

/**
 * Starting value of the payment day when the recurrence switch is turned on:
 * the day of the "Data" field ("YYYY-MM-DD"), capped at 28. Empty if the date is not set.
 */
export function defaultDayOfMonth(dateInput: string): string {
  const match = /^\d{4}-\d{2}-(\d{2})$/.exec(dateInput);
  if (!match) {
    return "";
  }
  const day = Number(match[1]);
  if (day < MIN_DAY_OF_MONTH) {
    return "";
  }
  return String(Math.min(day, MAX_DAY_OF_MONTH));
}

/** Payment day typed by the user, or null if it is empty, not a whole number or out of 1–28. */
export function parseDayOfMonth(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }
  const day = Number(trimmed);
  return day >= MIN_DAY_OF_MONTH && day <= MAX_DAY_OF_MONTH ? day : null;
}
