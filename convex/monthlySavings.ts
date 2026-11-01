import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireAuthUserId } from "./lib/auth";
import { assertValidDateRange } from "./lib/dateRange";

/**
 * Income, expenses and savings (income − expenses) of the signed-in user
 * for one month (US2.4). Savings can be negative.
 *
 * The client sends the month bounds in ms (both inclusive), because the
 * month depends on the user's timezone and Convex runs in UTC.
 * Being a query, the result updates on its own when a transaction changes.
 */
export const get = query({
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
