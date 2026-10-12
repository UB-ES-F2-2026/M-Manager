import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Database schema (source of truth).
 * US1.1: auth tables + user profile fields (name, email).
 * Other domains (transactions, budgets...) will be added in later stories.
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
});
