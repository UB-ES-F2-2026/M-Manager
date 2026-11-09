import { v } from "convex/values";

/**
 * Fixed category list for transactions (US2.1).
 * Values are stored in English; the UI shows Catalan labels later.
 */
export const TRANSACTION_CATEGORIES = [
  "groceries",
  "transport",
  "housing",
  "leisure",
  "health",
  "education",
  "restaurants",
  "shopping",
  "subscriptions",
  "salary",
  "freelance",
  "gifts",
  "refunds",
  "other",
] as const;

export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number];

/** Convex validator for `transactions.category`. Keep in sync with TRANSACTION_CATEGORIES. */
export const transactionCategoryValidator = v.union(
  v.literal("groceries"),
  v.literal("transport"),
  v.literal("housing"),
  v.literal("leisure"),
  v.literal("health"),
  v.literal("education"),
  v.literal("restaurants"),
  v.literal("shopping"),
  v.literal("subscriptions"),
  v.literal("salary"),
  v.literal("freelance"),
  v.literal("gifts"),
  v.literal("refunds"),
  v.literal("other"),
);
