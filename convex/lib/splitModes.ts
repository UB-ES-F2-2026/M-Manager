import { v } from "convex/values";

/**
 * How a group expense is divided among its participants (US4.2).
 * - "equal": the same share for everyone (remaining cents to the first ones).
 * - "amounts": each participant's share in cents; they add up to the total.
 * - "percentages": each participant's percentage; they add up to 100.
 */
export const SPLIT_MODES = ["equal", "amounts", "percentages"] as const;

export type SplitMode = (typeof SPLIT_MODES)[number];

/** Convex validator for `groupExpenses.splitMode`. Keep in sync with SPLIT_MODES. */
export const splitModeValidator = v.union(
  v.literal("equal"),
  v.literal("amounts"),
  v.literal("percentages"),
);
