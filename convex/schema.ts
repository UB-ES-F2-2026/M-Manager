import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { assetTypeValidator } from "./lib/assetTypes";
import { transactionCategoryValidator } from "./lib/transactionCategories";

/**
 * Database schema (source of truth).
 * Auth tables + user profile fields (name, email) + transactions (US2.1)
 * + assets and debts (US3.2).
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
