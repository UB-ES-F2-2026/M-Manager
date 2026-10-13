const LONG_DATE_FORMAT = new Intl.DateTimeFormat("ca-ES", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

/** Formats a timestamp in ms as a Catalan long date (e.g. "Dimarts, 13 d’octubre"). */
export function formatLongDate(timestampMs: number): string {
  const text = LONG_DATE_FORMAT.format(timestampMs);
  return text.charAt(0).toLocaleUpperCase("ca-ES") + text.slice(1);
}
