import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { assetTypeValidator } from "./lib/assetTypes";

/**
 * Database schema (source of truth).
 * Auth tables + user profile fields (name, email) + assets and debts (US3.2).
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
  }).index("by_user", ["userId"]).index("by_user_and_dueDate", ["userId", "dueDate"]),
});
