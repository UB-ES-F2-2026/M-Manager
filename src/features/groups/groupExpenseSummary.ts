const EXPENSE_DATE = new Intl.DateTimeFormat("ca-ES", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** Name of whoever paid, or a placeholder when that user has no name. */
export function payerName(name: string): string {
  return name.trim() === "" ? "Membre sense nom" : name.trim();
}

/** "1 persona" or "3 persones". */
export function participantCountText(count: number): string {
  return count === 1 ? "1 persona" : `${count} persones`;
}

/**
 * Second line of a row of the group history (US4.2 AC3):
 * «Pagat per {nom} · {N} persones · {data}», with the date in Catalan.
 */
export function groupExpenseSummary(expense: {
  paidByName: string;
  participantCount: number;
  _creationTime: number;
}): string {
  return [
    `Pagat per ${payerName(expense.paidByName)}`,
    participantCountText(expense.participantCount),
    EXPENSE_DATE.format(expense._creationTime),
  ].join(" · ");
}
