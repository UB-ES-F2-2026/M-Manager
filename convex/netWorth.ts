import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assetTypeValidator } from "./lib/assetTypes";
import { requireAuthUserId } from "./lib/auth";
import { requireOwnedDocument } from "./lib/ownership";

type NetWorthErrorCode =
  | "INVALID_AMOUNT"
  | "INVALID_NAME"
  | "INVALID_CONCEPT"
  | "INVALID_DUE_DATE";

/** Cap for asset names and debt concepts shown in the UI. */
export const MAX_LABEL_LENGTH = 80;

const AMOUNT_MESSAGE = "L'import ha de ser més gran que zero.";

function throwNetWorthError(code: NetWorthErrorCode, message: string): never {
  throw new ConvexError({ code, message });
}

/** Amounts are stored as positive integer cents (README §6). */
function assertPositiveAmountCents(amountCents: number): void {
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
    throwNetWorthError("INVALID_AMOUNT", AMOUNT_MESSAGE);
  }
}

function assertLabel(
  value: string,
  code: "INVALID_NAME" | "INVALID_CONCEPT",
  emptyMessage: string,
  tooLongMessage: string,
): string {
  const trimmed = value.trim();
  if (trimmed.length < 1) {
    throwNetWorthError(code, emptyMessage);
  }
  if (trimmed.length > MAX_LABEL_LENGTH) {
    throwNetWorthError(code, tooLongMessage);
  }
  return trimmed;
}

function assertName(name: string): string {
  return assertLabel(
    name,
    "INVALID_NAME",
    "El nom de l'actiu és obligatori.",
    "El nom de l'actiu és massa llarg.",
  );
}

function assertConcept(concept: string): string {
  return assertLabel(
    concept,
    "INVALID_CONCEPT",
    "El concepte del deute és obligatori.",
    "El concepte del deute és massa llarg.",
  );
}

/** Due dates are integer timestamps in milliseconds (README §6). */
function assertDueDate(dueDate: number): void {
  if (
    !Number.isInteger(dueDate) ||
    Number.isNaN(new Date(dueDate).getTime())
  ) {
    throwNetWorthError(
      "INVALID_DUE_DATE",
      "La data de venciment no és vàlida.",
    );
  }
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
    await requireOwnedDocument(
      ctx,
      userId,
      args.assetId,
      "No s'ha trobat aquest actiu.",
    );
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
    await requireOwnedDocument(
      ctx,
      userId,
      args.assetId,
      "No s'ha trobat aquest actiu.",
    );
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
    await requireOwnedDocument(
      ctx,
      userId,
      args.debtId,
      "No s'ha trobat aquest deute.",
    );
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
    await requireOwnedDocument(
      ctx,
      userId,
      args.debtId,
      "No s'ha trobat aquest deute.",
    );
    await ctx.db.delete(args.debtId);
  },
});
