const LOCALE = "ca-ES";
const DAY_MS = 24 * 60 * 60 * 1000;

const LONG_DATE = new Intl.DateTimeFormat(LOCALE, {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const SHORT_DATE = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short" });

/** "Diumenge, 18 d’octubre": weekday, day and month with a capital letter. */
export function formatLongDate(timestampMs: number): string {
  const text = LONG_DATE.format(timestampMs);
  return text.charAt(0).toLocaleUpperCase(LOCALE) + text.slice(1);
}

/** "Avui", "Ahir" or a short date ("1 d’oct.") relative to `nowMs`. */
export function formatRelativeDay(timestampMs: number, nowMs: number): string {
  const daysAgo = Math.round((startOfDay(nowMs) - startOfDay(timestampMs)) / DAY_MS);
  if (daysAgo === 0) {
    return "Avui";
  }
  if (daysAgo === 1) {
    return "Ahir";
  }
  return SHORT_DATE.format(timestampMs);
}

function startOfDay(timestampMs: number): number {
  const date = new Date(timestampMs);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}
