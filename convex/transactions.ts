import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuthUserId } from "./lib/auth";
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
