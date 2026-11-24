import { ConvexError, v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { requireAuthUserId } from "./lib/auth";
import {
  budgetCategoryValidator,
  type BudgetCategory,
} from "./lib/budgetCategories";
import { assertValidDateRange } from "./lib/dateRange";
import { requireOwnedDocument } from "./lib/ownership";
import { assertValidAmountCents } from "./lib/validation";

const NOT_FOUND_MESSAGE = "No s'ha trobat aquest pressupost.";

/** Message shown when the user already has a budget for that category (US3.1). */
export const BUDGET_EXISTS_MESSAGE =
  "Ja tens un pressupost per a aquesta categoria.";

/** Fields the user fills in, shared by create and update. */
const budgetFields = {
  category: budgetCategoryValidator,
  amountCents: v.number(),
};

/**
 * Rejects a second budget for the same category and user.
 * `exceptBudgetId` lets an update keep its own category.
 */
async function assertCategoryIsFree(
  ctx: MutationCtx,
  userId: Id<"users">,
  category: BudgetCategory,
  exceptBudgetId?: Id<"budgets">,
): Promise<void> {
  const existing = await ctx.db
    .query("budgets")
    .withIndex("by_user_and_category", (q) =>
      q.eq("userId", userId).eq("category", category),
    )
    .first();
  if (existing !== null && existing._id !== exceptBudgetId) {
    throw new ConvexError({
      code: "BUDGET_EXISTS",
      message: BUDGET_EXISTS_MESSAGE,
    });
  }
}

/**
 * Budgets of the signed-in user with what they have spent in each category
 * this month (US3.1). `spentCents` is the sum of the user's "expense"
 * transactions of that category dated within the month.
 *
 * The client sends the month bounds in ms (both inclusive), because the
 * month depends on the user's timezone and Convex runs in UTC (same as
 * `transactions.monthlySavings`). Being a query, it updates on its own
 * when a budget or a transaction changes.
 */
export const list = query({
  args: {
    monthStart: v.number(),
    monthEnd: v.number(),
  },
  handler: async (ctx, { monthStart, monthEnd }) => {
    const userId = await requireAuthUserId(ctx);
    assertValidDateRange(monthStart, monthEnd);

    const budgets = await ctx.db
      .query("budgets")
      .withIndex("by_user_and_category", (q) => q.eq("userId", userId))
      .collect();
    if (budgets.length === 0) {
      return [];
    }

    // One read of the month's transactions, grouped by category in memory.
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", userId).gte("date", monthStart).lte("date", monthEnd),
      )
      .collect();

    const spentByCategory = new Map<string, number>();
    for (const transaction of transactions) {
      if (transaction.type === "expense") {
        spentByCategory.set(
          transaction.category,
          (spentByCategory.get(transaction.category) ?? 0) +
            transaction.amountCents,
        );
      }
    }

    return budgets.map((budget) => ({
      ...budget,
      spentCents: spentByCategory.get(budget.category) ?? 0,
    }));
  },
});

/**
 * Loads one budget into the edit screen (/budgets/:id/edit). The id comes
 * from the URL, so a malformed id, a deleted budget or someone else's
 * budget all return null.
 */
export const get = query({
  args: { budgetId: v.string() },
  handler: async (ctx, { budgetId }) => {
    const userId = await requireAuthUserId(ctx);
    const id = ctx.db.normalizeId("budgets", budgetId);
    if (id === null) {
      return null;
    }
    const budget = await ctx.db.get(id);
    if (budget === null || budget.userId !== userId) {
      return null;
    }
    return budget;
  },
});

/** Creates a monthly budget for one expense category (US3.1). */
export const create = mutation({
  args: budgetFields,
  handler: async (ctx, { category, amountCents }) => {
    const userId = await requireAuthUserId(ctx);
    assertValidAmountCents(amountCents);
    await assertCategoryIsFree(ctx, userId, category);

    return await ctx.db.insert("budgets", { userId, category, amountCents });
  },
});

/** Edits the category or the limit of one of the user's budgets (US3.1). */
export const update = mutation({
  args: {
    budgetId: v.id("budgets"),
    ...budgetFields,
  },
  handler: async (ctx, { budgetId, category, amountCents }) => {
    const userId = await requireAuthUserId(ctx);
    await requireOwnedDocument(ctx, userId, budgetId, NOT_FOUND_MESSAGE);
    assertValidAmountCents(amountCents);
    await assertCategoryIsFree(ctx, userId, category, budgetId);

    await ctx.db.patch(budgetId, { category, amountCents });
  },
});
