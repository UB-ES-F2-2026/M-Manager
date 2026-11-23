import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { requireAuthUserId } from "./lib/auth";
import { assertValidDateRange } from "./lib/dateRange";
import {
  expandUpcomingPayments,
  ruleMatchesCivilDay,
  sameUtcCivilDay,
  utcCivilParts,
  utcMidnight,
} from "./lib/recurringOccurrences";
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

/**
 * Pending occurrences of the caller's recurring rules in the next window
 * (US2.5 AC2). Sorted ascending by date.
 *
 * `rangeStart` / `rangeEnd` are inclusive UTC midnights for the civil days of
 * the user's local calendar (client builds them, like month bounds in US2.4).
 */
export const upcomingPayments = query({
  args: {
    rangeStart: v.number(),
    rangeEnd: v.number(),
  },
  handler: async (ctx, { rangeStart, rangeEnd }) => {
    const userId = await requireAuthUserId(ctx);
    assertValidDateRange(rangeStart, rangeEnd);

    const rules = await ctx.db
      .query("recurringTransactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return expandUpcomingPayments(rules, rangeStart, rangeEnd);
  },
});

/**
 * Daily job (US2.5 AC3): for each rule that matches today's UTC civil day,
 * inserts a normal transaction and records lastMaterializedAt so it is not
 * duplicated if the cron runs again the same day.
 */
export const materializeDue = internalMutation({
  args: {
    /** Optional override for tests; defaults to Date.now(). */
    nowMs: v.optional(v.number()),
  },
  handler: async (ctx, { nowMs }) => {
    const now = nowMs ?? Date.now();
    const { year, month, day } = utcCivilParts(now);
    const todayMidnight = utcMidnight(year, month, day);

    const candidates = await ctx.db
      .query("recurringTransactions")
      .withIndex("by_day_of_month", (q) => q.eq("dayOfMonth", day))
      .collect();

    let created = 0;
    for (const rule of candidates) {
      if (!ruleMatchesCivilDay(rule, month, day)) {
        continue;
      }
      if (
        rule.lastMaterializedAt !== undefined &&
        sameUtcCivilDay(rule.lastMaterializedAt, todayMidnight)
      ) {
        continue;
      }

      await ctx.db.insert("transactions", {
        userId: rule.userId,
        type: rule.type,
        amountCents: rule.amountCents,
        category: rule.category,
        concept: rule.concept,
        date: todayMidnight,
      });
      await ctx.db.patch(rule._id, { lastMaterializedAt: todayMidnight });
      created += 1;
    }

    return { created };
  },
});
