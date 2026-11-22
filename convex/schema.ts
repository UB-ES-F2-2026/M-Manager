import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { assetTypeValidator } from "./lib/assetTypes";
import { groupRoleValidator } from "./lib/groupRoles";
import { transactionCategoryValidator } from "./lib/transactionCategories";

/**
 * Database schema (source of truth).
 * Auth tables + user profile fields (name, email) + transactions (US2.1)
 * + assets and debts (US3.2) + groups and their members (US4.1).
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

  /**
   * Shared-expense group (US4.1). Who belongs to it lives in `groupMembers`.
   * `name` is trimmed, 1–80 characters. `description` is trimmed, at most 200
   * characters, and is always stored: an empty description is "".
   * `code` is the unique invite code: 6 uppercase characters from A–Z and 2–9
   * without 0, O, 1 or I. Unique because the join mutation looks it up with
   * `by_code` and the create mutation retries until it is free.
   */
  groups: defineTable({
    name: v.string(),
    description: v.string(),
    code: v.string(),
  }).index("by_code", ["code"]),

  /**
   * Membership of a user in a group (US4.1): one row per (groupId, userId).
   * Only members can see a group. The creator is the "owner"; users who join
   * with the code are "member".
   * `by_group_and_user` checks membership and, by `groupId` alone, lists the
   * members of a group; `by_user` lists the groups of a user.
   */
  groupMembers: defineTable({
    groupId: v.id("groups"),
    userId: v.id("users"),
    role: groupRoleValidator,
  })
    .index("by_group_and_user", ["groupId", "userId"])
    .index("by_user", ["userId"]),
});
