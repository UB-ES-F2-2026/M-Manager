/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { GROUP_NOT_FOUND_MESSAGE } from "./groups";
import { AMOUNTS_SUM_MESSAGE, PERCENTAGES_SUM_MESSAGE } from "./lib/splitExpense";
import schema from "./schema";

// US4.2 · Add a shared expense to a group.

const modules = import.meta.glob("./**/!(*.*.*)*.*s");

function setup() {
  return convexTest(schema, modules);
}

type TestConvex = ReturnType<typeof setup>;

async function asUser(t: TestConvex, name: string) {
  const userId = await t.run((ctx) => ctx.db.insert("users", { name }));
  return { userId, client: t.withIdentity({ subject: `${userId}|session` }) };
}

async function expectError(promise: Promise<unknown>, code: string, message?: string) {
  const error: unknown = await promise.then(
    () => expect.fail(`Expected ${code}`),
    (rejection: unknown) => rejection,
  );
  expect(error).toBeInstanceOf(ConvexError);
  const data: unknown = (error as { data: unknown }).data;
  const parsed: unknown = typeof data === "string" ? JSON.parse(data) : data;
  expect(parsed).toMatchObject(message === undefined ? { code } : { code, message });
}

/** Ana creates the group; Bert and Carla join it; Dani is not a member. */
async function seedGroup(t: TestConvex) {
  const ana = await asUser(t, "Ana");
  const bert = await asUser(t, "Bert");
  const carla = await asUser(t, "Carla");
  const dani = await asUser(t, "Dani");
  const groupId = await ana.client.mutation(api.groups.create, { name: "Viatge a Roma" });
  const code = (await t.run((ctx) => ctx.db.get(groupId)))?.code ?? "";
  await bert.client.mutation(api.groups.join, { code });
  await carla.client.mutation(api.groups.join, { code });
  return { ana, bert, carla, dani, groupId };
}

function sortedIds(...ids: Id<"users">[]) {
  return [...ids].sort();
}

function getExpenses(t: TestConvex) {
  return t.run((ctx) => ctx.db.query("groupExpenses").collect());
}

describe("US4.2 · groups.createExpense", () => {
  it("splits equally, with the leftover cent to the first participant by userId", async () => {
    const t = setup();
    const { ana, bert, carla, groupId } = await seedGroup(t);

    const expenseId = await bert.client.mutation(api.groups.createExpense, {
      groupId,
      concept: "  Sopar  ",
      amountCents: 1000,
      paidBy: ana.userId,
      split: { mode: "equal", participants: [carla.userId, ana.userId, bert.userId] },
    });

    const expense = await t.run((ctx) => ctx.db.get(expenseId));
    expect(expense).toMatchObject({
      groupId,
      concept: "Sopar",
      amountCents: 1000,
      paidBy: ana.userId,
      splitMode: "equal",
    });
    const [first, second, third] = sortedIds(ana.userId, bert.userId, carla.userId);
    expect(expense?.shares).toEqual([
      { userId: first, amountCents: 334 },
      { userId: second, amountCents: 333 },
      { userId: third, amountCents: 333 },
    ]);
  });

  it("stores the amounts of each participant", async () => {
    const t = setup();
    const { ana, bert, groupId } = await seedGroup(t);

    const expenseId = await ana.client.mutation(api.groups.createExpense, {
      groupId,
      concept: "Hotel",
      amountCents: 5000,
      paidBy: ana.userId,
      split: {
        mode: "amounts",
        shares: [
          { userId: ana.userId, amountCents: 3000 },
          { userId: bert.userId, amountCents: 2000 },
        ],
      },
    });

    const expense = await t.run((ctx) => ctx.db.get(expenseId));
    expect(expense?.splitMode).toBe("amounts");
    expect(expense?.shares).toEqual(
      expect.arrayContaining([
        { userId: ana.userId, amountCents: 3000 },
        { userId: bert.userId, amountCents: 2000 },
      ]),
    );
  });

  it("converts the percentages to cents", async () => {
    const t = setup();
    const { ana, bert, groupId } = await seedGroup(t);

    const expenseId = await ana.client.mutation(api.groups.createExpense, {
      groupId,
      concept: "Cotxe",
      amountCents: 8000,
      paidBy: bert.userId,
      split: {
        mode: "percentages",
        shares: [
          { userId: ana.userId, percentage: 75 },
          { userId: bert.userId, percentage: 25 },
        ],
      },
    });

    const expense = await t.run((ctx) => ctx.db.get(expenseId));
    expect(expense?.splitMode).toBe("percentages");
    expect(expense?.shares).toEqual(
      expect.arrayContaining([
        { userId: ana.userId, amountCents: 6000 },
        { userId: bert.userId, amountCents: 2000 },
      ]),
    );
  });

  it("allows a payer who does not participate", async () => {
    const t = setup();
    const { ana, bert, carla, groupId } = await seedGroup(t);

    const expenseId = await ana.client.mutation(api.groups.createExpense, {
      groupId,
      concept: "Entrades",
      amountCents: 3000,
      paidBy: ana.userId,
      split: { mode: "equal", participants: [bert.userId, carla.userId] },
    });

    const expense = await t.run((ctx) => ctx.db.get(expenseId));
    expect(expense?.shares.map((share) => share.userId)).not.toContain(ana.userId);
  });

  it("rejects amounts that do not add up to the expense", async () => {
    const t = setup();
    const { ana, bert, groupId } = await seedGroup(t);

    await expectError(
      ana.client.mutation(api.groups.createExpense, {
        groupId,
        concept: "Hotel",
        amountCents: 5000,
        paidBy: ana.userId,
        split: {
          mode: "amounts",
          shares: [
            { userId: ana.userId, amountCents: 3000 },
            { userId: bert.userId, amountCents: 1000 },
          ],
        },
      }),
      "INVALID_SPLIT",
      AMOUNTS_SUM_MESSAGE,
    );
  });

  it("rejects percentages that do not add up to 100", async () => {
    const t = setup();
    const { ana, bert, groupId } = await seedGroup(t);

    await expectError(
      ana.client.mutation(api.groups.createExpense, {
        groupId,
        concept: "Cotxe",
        amountCents: 8000,
        paidBy: ana.userId,
        split: {
          mode: "percentages",
          shares: [
            { userId: ana.userId, percentage: 70 },
            { userId: bert.userId, percentage: 20 },
          ],
        },
      }),
      "INVALID_SPLIT",
      PERCENTAGES_SUM_MESSAGE,
    );
  });

  it("validates the concept and the amount like transactions", async () => {
    const t = setup();
    const { ana, groupId } = await seedGroup(t);
    const valid = {
      groupId,
      concept: "Sopar",
      amountCents: 1000,
      paidBy: ana.userId,
      split: { mode: "equal" as const, participants: [ana.userId] },
    };

    await expectError(
      ana.client.mutation(api.groups.createExpense, { ...valid, concept: "   " }),
      "INVALID_CONCEPT",
      "El concepte és obligatori.",
    );
    await expectError(
      ana.client.mutation(api.groups.createExpense, { ...valid, concept: "a".repeat(81) }),
      "INVALID_CONCEPT",
      "El concepte és massa llarg.",
    );
    for (const amountCents of [0, -500, 10.5]) {
      await expectError(
        ana.client.mutation(api.groups.createExpense, { ...valid, amountCents }),
        "INVALID_AMOUNT",
        "L'import ha de ser més gran que zero.",
      );
    }
  });

  it("requires the payer to be a member", async () => {
    const t = setup();
    const { ana, dani, groupId } = await seedGroup(t);

    await expectError(
      ana.client.mutation(api.groups.createExpense, {
        groupId,
        concept: "Sopar",
        amountCents: 1000,
        paidBy: dani.userId,
        split: { mode: "equal", participants: [ana.userId] },
      }),
      "INVALID_PAYER",
    );
  });

  it("requires at least one participant, without repeats, all of them members", async () => {
    const t = setup();
    const { ana, bert, dani, groupId } = await seedGroup(t);
    const base = { groupId, concept: "Sopar", amountCents: 1000, paidBy: ana.userId };

    await expectError(
      ana.client.mutation(api.groups.createExpense, {
        ...base,
        split: { mode: "equal", participants: [] },
      }),
      "INVALID_PARTICIPANTS",
      "Cal almenys un participant.",
    );
    await expectError(
      ana.client.mutation(api.groups.createExpense, {
        ...base,
        split: {
          mode: "amounts",
          shares: [
            { userId: bert.userId, amountCents: 500 },
            { userId: bert.userId, amountCents: 500 },
          ],
        },
      }),
      "INVALID_PARTICIPANTS",
      "Hi ha participants repetits.",
    );
    await expectError(
      ana.client.mutation(api.groups.createExpense, {
        ...base,
        split: { mode: "equal", participants: [ana.userId, dani.userId] },
      }),
      "INVALID_PARTICIPANTS",
      "Tots els participants han de ser membres del grup.",
    );
  });

  it("does not save anything when a check fails", async () => {
    const t = setup();
    const { ana, bert, groupId } = await seedGroup(t);

    await expectError(
      ana.client.mutation(api.groups.createExpense, {
        groupId,
        concept: "Hotel",
        amountCents: 5000,
        paidBy: ana.userId,
        split: { mode: "amounts", shares: [{ userId: bert.userId, amountCents: 1 }] },
      }),
      "INVALID_SPLIT",
    );
    expect(await getExpenses(t)).toEqual([]);
  });

  it("answers NOT_FOUND to a non-member, without checking anything else", async () => {
    const t = setup();
    const { ana, dani, groupId } = await seedGroup(t);

    await expectError(
      dani.client.mutation(api.groups.createExpense, {
        groupId,
        concept: "",
        amountCents: 0,
        paidBy: ana.userId,
        split: { mode: "equal", participants: [] },
      }),
      "NOT_FOUND",
      GROUP_NOT_FOUND_MESSAGE,
    );
    expect(await getExpenses(t)).toEqual([]);
  });

  it("answers NOT_FOUND for a malformed id or a group that does not exist", async () => {
    const t = setup();
    const { ana, groupId } = await seedGroup(t);
    const expense = {
      concept: "Sopar",
      amountCents: 1000,
      paidBy: ana.userId,
      split: { mode: "equal" as const, participants: [ana.userId] },
    };

    await expectError(
      ana.client.mutation(api.groups.createExpense, { ...expense, groupId: "not-an-id" }),
      "NOT_FOUND",
      GROUP_NOT_FOUND_MESSAGE,
    );
    await t.run((ctx) => ctx.db.delete(groupId));
    await expectError(
      ana.client.mutation(api.groups.createExpense, { ...expense, groupId }),
      "NOT_FOUND",
      GROUP_NOT_FOUND_MESSAGE,
    );
  });

  it("requires a signed-in user", async () => {
    const t = setup();
    const { ana, groupId } = await seedGroup(t);

    await expectError(
      t.mutation(api.groups.createExpense, {
        groupId,
        concept: "Sopar",
        amountCents: 1000,
        paidBy: ana.userId,
        split: { mode: "equal", participants: [ana.userId] },
      }),
      "UNAUTHENTICATED",
    );
  });
});
