import { v } from "convex/values";
import { mutation } from "./_generated/server";
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
