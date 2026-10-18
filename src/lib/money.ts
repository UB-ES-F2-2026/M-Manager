/** Formats an amount in cents as a Catalan euro string (e.g. 1250 → "12,50 €"). */
export function formatMoney(amountCents: number): string {
  return new Intl.NumberFormat("ca-ES", {
    style: "currency",
    currency: "EUR",
  }).format(amountCents / 100);
}

/** Amount with its sign from `type`: "−42,90 €" for expenses, "+1.850,00 €" for income. */
export function formatSignedMoney(amountCents: number, type: "expense" | "income"): string {
  return `${type === "expense" ? "−" : "+"}${formatMoney(amountCents)}`;
}

/**
 * Parses user input into positive integer cents.
 * Returns null when the text is not a valid amount.
 */
export function parseMoney(text: string): number | null {
  const normalized = text.trim().replace(/\s/g, "").replace(",", ".");
  if (normalized === "" || !/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }
  const euros = Number(normalized);
  if (!Number.isFinite(euros)) {
    return null;
  }
  return Math.round(euros * 100);
}
