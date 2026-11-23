import { v } from "convex/values";

/**
 * Expense categories that can have a monthly budget (US3.1).
 * Subset of TRANSACTION_CATEGORIES: income-only categories
 * ("salary", "freelance", "refunds") cannot be budgeted.
 * Values are stored in English; the UI shows Catalan labels later.
 */
export const BUDGET_CATEGORIES = [
  "groceries",
  "transport",
  "housing",
  "leisure",
  "health",
  "education",
  "restaurants",
  "shopping",
  "subscriptions",
  "gifts",
  "other",
] as const;

export type BudgetCategory = (typeof BUDGET_CATEGORIES)[number];

/** Convex validator for `budgets.category`. Keep in sync with BUDGET_CATEGORIES. */
export const budgetCategoryValidator = v.union(
  v.literal("groceries"),
  v.literal("transport"),
  v.literal("housing"),
  v.literal("leisure"),
  v.literal("health"),
  v.literal("education"),
  v.literal("restaurants"),
  v.literal("shopping"),
  v.literal("subscriptions"),
  v.literal("gifts"),
  v.literal("other"),
);
