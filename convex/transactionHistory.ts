import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireAuthUserId } from "./lib/auth";
import { assertValidDateRange } from "./lib/dateRange";
import { transactionCategoryValidator } from "./lib/transactionCategories";

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
