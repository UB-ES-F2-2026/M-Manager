const LOCALE = "ca-ES";

export type MonthBounds = {
  /** Local midnight of the 1st day of the month, in ms. */
  monthStart: number;
  /** Last ms of the last day of the month (inclusive), in ms. */
  monthEnd: number;
};

/**
 * Local-time bounds of the month that contains `nowMs`.
 * The client must send these because Convex runs in UTC (US2.4).
 */
export function getMonthBounds(nowMs: number): MonthBounds {
  const date = new Date(nowMs);
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
  const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 1).getTime() - 1;
  return { monthStart, monthEnd };
}

/** "Novembre de 2026" with a capital letter, for the savings card subtitle. */
export function formatMonthLabel(nowMs: number): string {
  const text = new Intl.DateTimeFormat(LOCALE, {
    month: "long",
    year: "numeric",
  }).format(nowMs);
  return text.charAt(0).toLocaleUpperCase(LOCALE) + text.slice(1);
}
