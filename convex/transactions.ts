import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuthUserId } from "./lib/auth";
import { assertValidDateRange } from "./lib/dateRange";
import { requireOwnedDocument } from "./lib/ownership";
import { transactionCategoryValidator } from "./lib/transactionCategories";
import {
  assertValidAmountCents,
  assertValidConcept,
  assertValidDate,
} from "./lib/validation";

const NOT_FOUND_MESSAGE = "No s'ha trobat aquest moviment.";

/** Fields the user fills in, shared by create and update. */
const transactionFields = {
  type: v.union(v.literal("expense"), v.literal("income")),
  amountCents: v.number(),
  date: v.number(),
  category: transactionCategoryValidator,
  concept: v.string(),
};

/** Validates the user's fields and returns them ready to store (trimmed concept). */
function validateTransactionFields(fields: {
  type: "expense" | "income";
  amountCents: number;
  date: number;
  category: typeof transactionCategoryValidator.type;
  concept: string;
}) {
  assertValidAmountCents(fields.amountCents);
  assertValidDate(fields.date);
  return { ...fields, concept: assertValidConcept(fields.concept) };
}

/**
 * Transaction history of the signed-in user, newest first (US2.3).
 * Optional filters: date range (`from`/`to`, ms, inclusive) and category.
 */
export const list = query({
  args: {
    from: v.optional(v.number()),
    to: v.optional(v.number()),
    category: v.optional(transactionCategoryValidator),
  },
  handler: async (ctx, { from, to, category }) => {
    const userId = await requireAuthUserId(ctx);
    assertValidDateRange(from, to);

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user_and_date", (q) => {
        const byUser = q.eq("userId", userId);
        if (from !== undefined && to !== undefined) {
          return byUser.gte("date", from).lte("date", to);
        }
        if (from !== undefined) {
          return byUser.gte("date", from);
        }
        if (to !== undefined) {
          return byUser.lte("date", to);
        }
        return byUser;
      })
      .order("desc")
      .collect();

    // No index on category: the date range already limits the rows we read.
    return category === undefined
      ? transactions
      : transactions.filter((transaction) => transaction.category === category);
  },
});

/**
 * Income, expenses and savings (income − expenses) of the signed-in user
 * for one month (US2.4). Savings can be negative.
 *
 * The client sends the month bounds in ms (both inclusive), because the
 * month depends on the user's timezone and Convex runs in UTC.
 * Being a query, the result updates on its own when a transaction changes.
 */
export const monthlySavings = query({
  args: {
    monthStart: v.number(),
    monthEnd: v.number(),
  },
  handler: async (ctx, { monthStart, monthEnd }) => {
    const userId = await requireAuthUserId(ctx);
    assertValidDateRange(monthStart, monthEnd);

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", userId).gte("date", monthStart).lte("date", monthEnd),
      )
      .collect();

    let incomeCents = 0;
    let expenseCents = 0;
    for (const transaction of transactions) {
      if (transaction.type === "income") {
        incomeCents += transaction.amountCents;
      } else {
        expenseCents += transaction.amountCents;
      }
    }

    return { incomeCents, expenseCents, savingsCents: incomeCents - expenseCents };
  },
});

/** Registers an income or expense for the signed-in user (US2.1). */
export const create = mutation({
  args: transactionFields,
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const fields = validateTransactionFields(args);

    return await ctx.db.insert("transactions", { userId, ...fields });
  },
});

/** Edits one of the signed-in user's transactions (US2.2). */
export const update = mutation({
  args: {
    transactionId: v.id("transactions"),
    ...transactionFields,
  },
  handler: async (ctx, { transactionId, ...args }) => {
    const userId = await requireAuthUserId(ctx);
    await requireOwnedDocument(ctx, userId, transactionId, NOT_FOUND_MESSAGE);
    const fields = validateTransactionFields(args);

    await ctx.db.patch(transactionId, fields);
  },
});

/** Deletes one of the signed-in user's transactions (US2.2). */
export const remove = mutation({
  args: { transactionId: v.id("transactions") },
  handler: async (ctx, { transactionId }) => {
    const userId = await requireAuthUserId(ctx);
    await requireOwnedDocument(ctx, userId, transactionId, NOT_FOUND_MESSAGE);

    await ctx.db.delete(transactionId);
  },
});

/**
 * One of the signed-in user's transactions, to fill the edit form (US2.2).
 * Returns null when the id is malformed, missing or another user's, so the
 * screen can show "not found" without revealing which case it was.
 */
export const get = query({
  args: { transactionId: v.string() },
  handler: async (ctx, { transactionId }) => {
    const userId = await requireAuthUserId(ctx);
    const id = ctx.db.normalizeId("transactions", transactionId);
    if (id === null) {
      return null;
    }
    const transaction = await ctx.db.get(id);
    if (transaction === null || transaction.userId !== userId) {
      return null;
    }
    return transaction;
  },
});
