/** Days ahead covered by "Pròxims pagaments" (US2.5 · AC2): from today up to today + 30. */
export const UPCOMING_DAYS = 30;

/** Maximum rows of the home section; only the nearest ones are shown (US2.5 · AC2). */
export const HOME_UPCOMING_LIMIT = 5;

export type UpcomingRange = {
  /** UTC midnight of today's civil day in the user's calendar, in ms. */
  rangeStart: number;
  /** UTC midnight of the civil day `UPCOMING_DAYS` later (inclusive), in ms. */
  rangeEnd: number;
};

/**
 * Arguments of `api.recurring.upcomingPayments`. The query works with UTC
 * midnights of civil days, so today's local date is sent as a UTC midnight;
 * sending local midnight would shift every day by one in Spain (UTC+1/+2).
 */
export function getUpcomingRange(nowMs: number): UpcomingRange {
  const today = new Date(nowMs);
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();
  return {
    rangeStart: Date.UTC(year, month, day),
    rangeEnd: Date.UTC(year, month, day + UPCOMING_DAYS),
  };
}

/**
 * Turns an occurrence date from the query (UTC midnight of a civil day) into
 * local midnight of that same day, so formatRelativeDay shows the right day.
 */
export function upcomingDateToLocal(utcMidnightMs: number): number {
  const date = new Date(utcMidnightMs);
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()).getTime();
}

/** The nearest payments for the home section. The query already sorts them by date. */
export function selectHomeUpcomingPayments<T>(payments: readonly T[]): T[] {
  return payments.slice(0, HOME_UPCOMING_LIMIT);
}
