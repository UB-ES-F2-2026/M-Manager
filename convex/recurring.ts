import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireAuthUserId } from "./lib/auth";
import { findRuleBySourceTransaction } from "./lib/recurringRules";

/**
 * Recurrence rule linked to a transaction, for the edit form (US2.5 AC1).
 * Returns null when there is no rule, the id is bad, or it is not the caller's.
 */
export const forTransaction = query({
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

    const rule = await findRuleBySourceTransaction(ctx, id);
    if (rule === null) {
      return null;
    }

    return {
      frequency: rule.frequency,
      dayOfMonth: rule.dayOfMonth,
      monthOfYear: rule.monthOfYear,
    };
  },
});
