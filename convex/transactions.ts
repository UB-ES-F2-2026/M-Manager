import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireAuthUserId } from "./lib/auth";
import { transactionCategoryValidator } from "./lib/transactionCategories";
import {
  assertValidAmountCents,
  assertValidConcept,
  assertValidDate,
} from "./lib/validation";

/** Registers an income or expense for the signed-in user (US2.1). */
export const create = mutation({
  args: {
    type: v.union(v.literal("expense"), v.literal("income")),
    amountCents: v.number(),
    date: v.number(),
    category: transactionCategoryValidator,
    concept: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);

    assertValidAmountCents(args.amountCents);
    assertValidDate(args.date);
    const concept = assertValidConcept(args.concept);

    return await ctx.db.insert("transactions", {
      userId,
      type: args.type,
      amountCents: args.amountCents,
      date: args.date,
      category: args.category,
      concept,
    });
  },
});
