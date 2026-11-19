import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { assetTypeValidator } from "./lib/assetTypes";
import { recurrenceFrequencyValidator } from "./lib/recurrenceFrequencies";
import { transactionCategoryValidator } from "./lib/transactionCategories";

/**
 * Database schema (source of truth).
 * Auth tables + user profile fields (name, email) + transactions (US2.1)
 * + assets and debts (US3.2) + recurring movement rules (US2.5).
 */
export default defineSchema({
  ...authTables,
  /**
   * Application users. Extends Convex Auth's users table with a display name.
   * Auth creates the row on sign-up; `name` comes from the Password profile().
   */
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
  }).index("email", ["email"]),

  /**
   * Money movements (income or expense) owned by a single user (US2.1).
   * Amounts are always positive cents; `type` says whether it is income or expense.
   * `date` is a Unix timestamp in milliseconds.
   */
  transactions: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("expense"), v.literal("income")),
    amountCents: v.number(),
    date: v.number(),
    category: transactionCategoryValidator,
    /** Short label shown in the history list (e.g. "Supermercat"). */
    concept: v.string(),
  }).index("by_user_and_date", ["userId", "date"]),

  /**
   * Recurrence rule for a movement (US2.5).
   * Configured from the transaction form; the daily cron materializes a normal
   * row in `transactions` (without making that new row recurrent).
   * `dayOfMonth` is 1–28; `monthOfYear` (1–12) is the anchor month for yearly rules.
   */
  recurringTransactions: defineTable({
    userId: v.id("users"),
    /** Transaction that owns this rule (the one edited in the form). */
    sourceTransactionId: v.id("transactions"),
    type: v.union(v.literal("expense"), v.literal("income")),
    amountCents: v.number(),
    category: transactionCategoryValidator,
    concept: v.string(),
    frequency: recurrenceFrequencyValidator,
    /** Payment day of the month (1–28). */
    dayOfMonth: v.number(),
    /** Calendar month 1–12 from the form date (needed for yearly frequency). */
    monthOfYear: v.number(),
    /** Last cron materialization timestamp in ms (dedup for AC3). */
    lastMaterializedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_source_transaction", ["sourceTransactionId"])
    .index("by_day_of_month", ["dayOfMonth"]),

  /**
   * User-owned assets that contribute to net worth (US3.2).
   * Value is always positive cents in `amountCents`.
   */
  assets: defineTable({
    userId: v.id("users"),
    name: v.string(),
    type: assetTypeValidator,
    amountCents: v.number(),
  }).index("by_user", ["userId"]),

  /**
   * User-owned debts that reduce net worth (US3.2).
   * Pending amount is positive cents; `dueDate` is a Unix timestamp in milliseconds.
   */
  debts: defineTable({
    userId: v.id("users"),
    concept: v.string(),
    amountCents: v.number(),
    dueDate: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_dueDate", ["userId", "dueDate"]),
});
