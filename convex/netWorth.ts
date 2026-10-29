import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { requireAuthUserId } from "./lib/auth";
import { assetTypeValidator } from "./lib/assetTypes";

type NetWorthErrorCode =
  | "INVALID_AMOUNT"
  | "INVALID_NAME"
  | "INVALID_CONCEPT"
  | "INVALID_DUE_DATE"
  | "NOT_FOUND";

function throwNetWorthError(code: NetWorthErrorCode, message: string): never {
  throw new ConvexError({ code, message });
}

/** Amounts are stored as positive integer cents (README §6). */
function assertPositiveAmountCents(amountCents: number): void {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throwNetWorthError(
      "INVALID_AMOUNT",
      "L'import ha de ser un nombre enter positiu en cèntims.",
    );
  }
}

function assertName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length < 1) {
    throwNetWorthError("INVALID_NAME", "El nom de l'actiu és obligatori.");
  }
  return trimmed;
}

function assertConcept(concept: string): string {
  const trimmed = concept.trim();
  if (trimmed.length < 1) {
    throwNetWorthError("INVALID_CONCEPT", "El concepte del deute és obligatori.");
  }
  return trimmed;
}

function assertDueDate(dueDate: number): void {
  if (!Number.isFinite(dueDate)) {
    throwNetWorthError(
      "INVALID_DUE_DATE",
      "La data de venciment no és vàlida.",
    );
  }
}

async function requireOwnedAsset(
  ctx: MutationCtx,
  userId: Id<"users">,
  assetId: Id<"assets">,
): Promise<Doc<"assets">> {
  const asset = await ctx.db.get(assetId);
  if (asset === null || asset.userId !== userId) {
    throwNetWorthError("NOT_FOUND", "No s'ha trobat aquest actiu.");
  }
  return asset;
}

async function requireOwnedDebt(
  ctx: MutationCtx,
  userId: Id<"users">,
  debtId: Id<"debts">,
): Promise<Doc<"debts">> {
  const debt = await ctx.db.get(debtId);
  if (debt === null || debt.userId !== userId) {
    throwNetWorthError("NOT_FOUND", "No s'ha trobat aquest deute.");
  }
  return debt;
}

/** Lists the signed-in user's assets and debts (US3.2). */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuthUserId(ctx);

    const assets = await ctx.db
      .query("assets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const debts = await ctx.db
      .query("debts")
      .withIndex("by_user_and_dueDate", (q) => q.eq("userId", userId))
      .collect();

    return { assets, debts };
  },
});

/** Creates an asset for the signed-in user (US3.2 AC1). */
export const createAsset = mutation({
  args: {
    name: v.string(),
    type: assetTypeValidator,
    amountCents: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const name = assertName(args.name);
    assertPositiveAmountCents(args.amountCents);

    return await ctx.db.insert("assets", {
      userId,
      name,
      type: args.type,
      amountCents: args.amountCents,
    });
  },
});

/** Updates an owned asset (US3.2 AC3). */
export const updateAsset = mutation({
  args: {
    assetId: v.id("assets"),
    name: v.string(),
    type: assetTypeValidator,
    amountCents: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    await requireOwnedAsset(ctx, userId, args.assetId);
    const name = assertName(args.name);
    assertPositiveAmountCents(args.amountCents);

    await ctx.db.patch(args.assetId, {
      name,
      type: args.type,
      amountCents: args.amountCents,
    });
  },
});

/** Deletes an owned asset (US3.2 AC3). */
export const removeAsset = mutation({
  args: { assetId: v.id("assets") },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    await requireOwnedAsset(ctx, userId, args.assetId);
    await ctx.db.delete(args.assetId);
  },
});

/** Creates a debt for the signed-in user (US3.2 AC2). */
export const createDebt = mutation({
  args: {
    concept: v.string(),
    amountCents: v.number(),
    dueDate: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const concept = assertConcept(args.concept);
    assertPositiveAmountCents(args.amountCents);
    assertDueDate(args.dueDate);

    return await ctx.db.insert("debts", {
      userId,
      concept,
      amountCents: args.amountCents,
      dueDate: args.dueDate,
    });
  },
});

/** Updates an owned debt (US3.2 AC3). */
export const updateDebt = mutation({
  args: {
    debtId: v.id("debts"),
    concept: v.string(),
    amountCents: v.number(),
    dueDate: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    await requireOwnedDebt(ctx, userId, args.debtId);
    const concept = assertConcept(args.concept);
    assertPositiveAmountCents(args.amountCents);
    assertDueDate(args.dueDate);

    await ctx.db.patch(args.debtId, {
      concept,
      amountCents: args.amountCents,
      dueDate: args.dueDate,
    });
  },
});

/** Deletes an owned debt (US3.2 AC3). */
export const removeDebt = mutation({
  args: { debtId: v.id("debts") },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    await requireOwnedDebt(ctx, userId, args.debtId);
    await ctx.db.delete(args.debtId);
  },
});
