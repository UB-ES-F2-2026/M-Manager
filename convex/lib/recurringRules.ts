import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { RecurrenceInput } from "./recurrenceFrequencies";
import { assertValidRecurrenceInput } from "./recurrenceFrequencies";

type DbCtx = QueryCtx | MutationCtx;

type TransactionSnapshot = {
  type: "expense" | "income";
  amountCents: number;
  category: Doc<"transactions">["category"];
  concept: string;
};

/** Loads the recurrence rule linked to a source transaction, if any. */
export async function findRuleBySourceTransaction(
  ctx: DbCtx,
  sourceTransactionId: Id<"transactions">,
): Promise<Doc<"recurringTransactions"> | null> {
  return await ctx.db
    .query("recurringTransactions")
    .withIndex("by_source_transaction", (q) =>
      q.eq("sourceTransactionId", sourceTransactionId),
    )
    .unique();
}

/**
 * Creates or updates the rule for `sourceTransactionId`.
 * Sets `lastMaterializedAt` on insert so the cron does not recreate the
 * same day as the original form save (US2.5 AC3).
 */
export async function upsertRuleForTransaction(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    sourceTransactionId: Id<"transactions">;
    snapshot: TransactionSnapshot;
    recurrence: RecurrenceInput;
    /** Date of the source transaction (ms); used as initial lastMaterializedAt. */
    sourceDateMs: number;
  },
): Promise<Id<"recurringTransactions">> {
  const recurrence = assertValidRecurrenceInput(args.recurrence);
  const existing = await findRuleBySourceTransaction(
    ctx,
    args.sourceTransactionId,
  );

  const fields = {
    userId: args.userId,
    sourceTransactionId: args.sourceTransactionId,
    type: args.snapshot.type,
    amountCents: args.snapshot.amountCents,
    category: args.snapshot.category,
    concept: args.snapshot.concept,
    frequency: recurrence.frequency,
    dayOfMonth: recurrence.dayOfMonth,
    monthOfYear: recurrence.monthOfYear,
  };

  if (existing === null) {
    return await ctx.db.insert("recurringTransactions", {
      ...fields,
      lastMaterializedAt: args.sourceDateMs,
    });
  }

  await ctx.db.patch(existing._id, fields);
  return existing._id;
}

/** Deletes the rule for this source transaction, if it exists (AC1: switch off). */
export async function deleteRuleForSourceTransaction(
  ctx: MutationCtx,
  sourceTransactionId: Id<"transactions">,
): Promise<void> {
  const existing = await findRuleBySourceTransaction(ctx, sourceTransactionId);
  if (existing !== null) {
    await ctx.db.delete(existing._id);
  }
}

/**
 * Keeps amount/type/concept/category on an existing rule in sync when the
 * source transaction is edited without changing the recurrence toggle.
 */
export async function syncRuleSnapshotForTransaction(
  ctx: MutationCtx,
  sourceTransactionId: Id<"transactions">,
  snapshot: TransactionSnapshot,
): Promise<void> {
  const existing = await findRuleBySourceTransaction(ctx, sourceTransactionId);
  if (existing === null) {
    return;
  }
  await ctx.db.patch(existing._id, {
    type: snapshot.type,
    amountCents: snapshot.amountCents,
    category: snapshot.category,
    concept: snapshot.concept,
  });
}
