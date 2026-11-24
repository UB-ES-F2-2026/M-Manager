/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";

// US4.2 · Schema of shared group expenses: the table and index the create
// mutation, the history and the balances (US4.3) will rely on.

const modules = import.meta.glob("./**/!(*.*.*)*.*s");

function setup() {
  return convexTest(schema, modules);
}

type TestConvex = ReturnType<typeof setup>;

async function seedGroup(t: TestConvex) {
  return t.run(async (ctx) => {
    const ana = await ctx.db.insert("users", { name: "Ana" });
    const bert = await ctx.db.insert("users", { name: "Bert" });
    const groupId = await ctx.db.insert("groups", {
      name: "Viatge a Roma",
      description: "",
      code: "K7M2QX",
    });
    const otherGroupId = await ctx.db.insert("groups", {
      name: "Pis",
      description: "",
      code: "P9ZT4W",
    });
    return { ana, bert, groupId, otherGroupId };
  });
}

function dinner(groupId: Id<"groups">, ana: Id<"users">, bert: Id<"users">) {
  return {
    groupId,
    concept: "Sopar",
    amountCents: 1001,
    paidBy: ana,
    splitMode: "equal" as const,
    shares: [
      { userId: ana, amountCents: 501 },
      { userId: bert, amountCents: 500 },
    ],
  };
}

describe("US4.2 · groupExpenses schema", () => {
  it("stores an expense with its payer, split mode and shares", async () => {
    const t = setup();
    const { ana, bert, groupId } = await seedGroup(t);
    const expense = dinner(groupId, ana, bert);

    const stored = await t.run(async (ctx) => ctx.db.get(await ctx.db.insert("groupExpenses", expense)));

    expect(stored).toMatchObject(expense);
    const sharesTotal = stored?.shares.reduce((sum, share) => sum + share.amountCents, 0);
    expect(sharesTotal).toBe(stored?.amountCents);
  });

  it("allows a payer who is not a participant", async () => {
    const t = setup();
    const { ana, bert, groupId } = await seedGroup(t);

    const stored = await t.run(async (ctx) =>
      ctx.db.get(
        await ctx.db.insert("groupExpenses", {
          groupId,
          concept: "Entrades",
          amountCents: 3000,
          paidBy: ana,
          splitMode: "amounts",
          shares: [{ userId: bert, amountCents: 3000 }],
        }),
      ),
    );

    expect(stored?.paidBy).toBe(ana);
    expect(stored?.shares.map((share) => share.userId)).toEqual([bert]);
  });

  it("lists only one group's expenses, most recent first", async () => {
    const t = setup();
    const { ana, bert, groupId, otherGroupId } = await seedGroup(t);

    const concepts = await t.run(async (ctx) => {
      await ctx.db.insert("groupExpenses", { ...dinner(groupId, ana, bert), concept: "Primera" });
      await ctx.db.insert("groupExpenses", { ...dinner(otherGroupId, ana, bert), concept: "Altre grup" });
      await ctx.db.insert("groupExpenses", { ...dinner(groupId, ana, bert), concept: "Segona" });

      const expenses = await ctx.db
        .query("groupExpenses")
        .withIndex("by_group", (q) => q.eq("groupId", groupId))
        .order("desc")
        .collect();
      return expenses.map((expense) => expense.concept);
    });

    expect(concepts).toEqual(["Segona", "Primera"]);
  });

  it("rejects a split mode that is not one of the three", async () => {
    const t = setup();
    const { ana, bert, groupId } = await seedGroup(t);

    await expect(
      t.run(async (ctx) => {
        await ctx.db.insert("groupExpenses", {
          ...dinner(groupId, ana, bert),
          // @ts-expect-error: only "equal", "amounts" or "percentages".
          splitMode: "shares",
        });
      }),
    ).rejects.toThrow();
  });

  it("rejects an expense with an income/expense type", async () => {
    const t = setup();
    const { ana, bert, groupId } = await seedGroup(t);

    await expect(
      t.run(async (ctx) => {
        await ctx.db.insert("groupExpenses", {
          ...dinner(groupId, ana, bert),
          // @ts-expect-error: group expenses are always expenses, there is no type.
          type: "income",
        });
      }),
    ).rejects.toThrow();
  });
});
