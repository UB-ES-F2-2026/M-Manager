import { ConvexError } from "convex/values";

export type DateRangeErrorCode = "INVALID_DATE" | "INVALID_DATE_RANGE";

/**
 * Checks an optional date range in ms timestamps (both ends inclusive).
 * Either end can be missing; when both are given, `from` cannot be after `to`.
 */
export function assertValidDateRange(from?: number, to?: number): void {
  for (const date of [from, to]) {
    if (date !== undefined && !Number.isSafeInteger(date)) {
      throw new ConvexError({
        code: "INVALID_DATE" satisfies DateRangeErrorCode,
        message: "La data no és vàlida.",
      });
    }
  }

  if (from !== undefined && to !== undefined && from > to) {
    throw new ConvexError({
      code: "INVALID_DATE_RANGE" satisfies DateRangeErrorCode,
      message: "La data d'inici no pot ser posterior a la data de fi.",
    });
  }
}
