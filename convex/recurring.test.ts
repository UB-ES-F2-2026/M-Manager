/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { DAY_OF_MONTH_MESSAGE } from "./lib/recurrenceFrequencies";
import schema from "./schema";

// US2.5 · Recurring movements: rules from the form, upcoming payments, daily cron.

const modules = import.meta.glob("./**/!(*.*.*)*.*s");

const RENT = {
  type: "expense" as const,
  amountCents: 75000,
  date: Date.UTC(2026, 2, 15), // 15 Mar 2026
  category: "housing" as const,
  concept: "Lloguer",
};

const MONTHLY = {
  frequency: "monthly" as const,
  dayOfMonth: 15,
  monthOfYear: 3,
};

const YEARLY = {
  frequency: "yearly" as const,
  dayOfMonth: 15,
  monthOfYear: 3,
};

function setup() {
  return convexTest(schema, modules);
}

type TestConvex = ReturnType<typeof setup>;

async function signedInAs(t: TestConvex, name: string) {
  const userId = await t.run((ctx) => ctx.db.insert("users", { name }));
  return { userId, client: t.withIdentity({ subject: `${userId}|session` }) };
}

async function expectConvexError(
  promise: Promise<unknown>,
  expected: { code: string; message?: string },
) {
  const error: unknown = await promise.then(
    () => expect.fail(`Expected ${expected.code}`),
    (rejection: unknown) => rejection,
  );
  expect(error).toBeInstanceOf(ConvexError);
  const data: unknown = (error as { data: unknown }).data;
  const parsed: unknown = typeof data === "string" ? JSON.parse(data) : data;
  expect(parsed).toMatchObject(expected);
}

function listRules(t: TestConvex) {
  return t.run((ctx) => ctx.db.query("recurringTransactions").collect());
}

function listTransactions(t: TestConvex) {
  return t.run((ctx) => ctx.db.query("transactions").collect());
}

function getRuleForSource(t: TestConvex, sourceTransactionId: Id<"transactions">) {
  return t.run(async (ctx) =>
    ctx.db
      .query("recurringTransactions")
      .withIndex("by_source_transaction", (q) =>
        q.eq("sourceTransactionId", sourceTransactionId),
      )
      .unique(),
  );
}

describe("US2.5 AC1 · recurrence from the transaction form", () => {
  it("creates a monthly rule when create sends recurrence", async () => {
    const t = setup();
    const { userId, client } = await signedInAs(t, "Ana");

    const transactionId = await client.mutation(api.transactions.create, {
      ...RENT,
      recurrence: MONTHLY,
    });

    const rule = await getRuleForSource(t, transactionId);
    expect(rule).toMatchObject({
      userId,
      sourceTransactionId: transactionId,
      type: RENT.type,
      amountCents: RENT.amountCents,
      category: RENT.category,
      concept: RENT.concept,
      frequency: "monthly",
      dayOfMonth: 15,
      monthOfYear: 3,
      lastMaterializedAt: RENT.date,
    });
  });

  it("does not create a rule when create omits recurrence", async () => {
    const t = setup();
    const { client } = await signedInAs(t, "Ana");

    await client.mutation(api.transactions.create, RENT);

    expect(await listRules(t)).toHaveLength(0);
  });

  it("rejects a day outside 1–28 and stores nothing", async () => {
    const t = setup();
    const { client } = await signedInAs(t, "Ana");

    await expectConvexError(
      client.mutation(api.transactions.create, {
        ...RENT,
        recurrence: { ...MONTHLY, dayOfMonth: 29 },
      }),
      { code: "INVALID_DAY_OF_MONTH", message: DAY_OF_MONTH_MESSAGE },
    );
    expect(await listTransactions(t)).toHaveLength(0);
    expect(await listRules(t)).toHaveLength(0);
  });

  it("forTransaction returns the rule for the edit form", async () => {
    const t = setup();
    const { client } = await signedInAs(t, "Ana");
    const transactionId = await client.mutation(api.transactions.create, {
      ...RENT,
      recurrence: YEARLY,
    });

    expect(
      await client.query(api.recurring.forTransaction, {
        transactionId: String(transactionId),
      }),
    ).toEqual({
      frequency: "yearly",
      dayOfMonth: 15,
      monthOfYear: 3,
    });
  });

  it("forTransaction returns null for another user or a bad id", async () => {
    const t = setup();
    const ana = await signedInAs(t, "Ana");
    const biel = await signedInAs(t, "Biel");
    const transactionId = await ana.client.mutation(api.transactions.create, {
      ...RENT,
      recurrence: MONTHLY,
    });

    expect(
      await biel.client.query(api.recurring.forTransaction, {
        transactionId: String(transactionId),
      }),
    ).toBeNull();
    expect(
      await ana.client.query(api.recurring.forTransaction, {
        transactionId: "not-an-id",
      }),
    ).toBeNull();
  });

  it("update with null removes the rule and keeps the transaction", async () => {
    const t = setup();
    const { client } = await signedInAs(t, "Ana");
    const transactionId = await client.mutation(api.transactions.create, {
      ...RENT,
      recurrence: MONTHLY,
    });

    await client.mutation(api.transactions.update, {
      transactionId,
      ...RENT,
      recurrence: null,
    });

    expect(await getRuleForSource(t, transactionId)).toBeNull();
    expect(await listTransactions(t)).toHaveLength(1);
  });

  it("update without recurrence keeps the rule and syncs amount/concept", async () => {
    const t = setup();
    const { client } = await signedInAs(t, "Ana");
    const transactionId = await client.mutation(api.transactions.create, {
      ...RENT,
      recurrence: MONTHLY,
    });

    await client.mutation(api.transactions.update, {
      transactionId,
      ...RENT,
      amountCents: 80000,
      concept: "Lloguer pis",
    });

    const rule = await getRuleForSource(t, transactionId);
    expect(rule).toMatchObject({
      amountCents: 80000,
      concept: "Lloguer pis",
      frequency: "monthly",
      dayOfMonth: 15,
    });
  });

  it("remove deletes the rule together with the transaction", async () => {
    const t = setup();
    const { client } = await signedInAs(t, "Ana");
    const transactionId = await client.mutation(api.transactions.create, {
      ...RENT,
      recurrence: MONTHLY,
    });

    await client.mutation(api.transactions.remove, { transactionId });

    expect(await listTransactions(t)).toHaveLength(0);
    expect(await listRules(t)).toHaveLength(0);
  });

  it("requires a signed-in user for forTransaction", async () => {
    const t = setup();
    await expectConvexError(
      t.query(api.recurring.forTransaction, { transactionId: "x" }),
      { code: "UNAUTHENTICATED" },
    );
  });
});

describe("US2.5 AC2 · upcoming payments", () => {
  it("lists occurrences in the range, sorted by date", async () => {
    const t = setup();
    const { client } = await signedInAs(t, "Ana");
    const sourceId = await client.mutation(api.transactions.create, {
      ...RENT,
      recurrence: MONTHLY,
    });

    const rangeStart = Date.UTC(2026, 3, 1); // 1 Apr
    const rangeEnd = Date.UTC(2026, 4, 31); // 31 May
    const payments = await client.query(api.recurring.upcomingPayments, {
      rangeStart,
      rangeEnd,
    });

    expect(payments).toEqual([
      {
        date: Date.UTC(2026, 3, 15),
        type: "expense",
        amountCents: 75000,
        category: "housing",
        concept: "Lloguer",
        frequency: "monthly",
        sourceTransactionId: sourceId,
      },
      {
        date: Date.UTC(2026, 4, 15),
        type: "expense",
        amountCents: 75000,
        category: "housing",
        concept: "Lloguer",
        frequency: "monthly",
        sourceTransactionId: sourceId,
      },
    ]);
  });

  it("yearly rules only match the anchor month", async () => {
    const t = setup();
    const { client } = await signedInAs(t, "Ana");
    await client.mutation(api.transactions.create, {
      ...RENT,
      recurrence: YEARLY,
    });

    const april = await client.query(api.recurring.upcomingPayments, {
      rangeStart: Date.UTC(2026, 3, 1),
      rangeEnd: Date.UTC(2026, 3, 30),
    });
    const marchNextYear = await client.query(api.recurring.upcomingPayments, {
      rangeStart: Date.UTC(2027, 2, 1),
      rangeEnd: Date.UTC(2027, 2, 31),
    });

    expect(april).toHaveLength(0);
    expect(marchNextYear).toHaveLength(1);
    expect(marchNextYear[0]?.date).toBe(Date.UTC(2027, 2, 15));
  });

  it("does not show another user's rules", async () => {
    const t = setup();
    const ana = await signedInAs(t, "Ana");
    const biel = await signedInAs(t, "Biel");
    await ana.client.mutation(api.transactions.create, {
      ...RENT,
      recurrence: MONTHLY,
    });

    const payments = await biel.client.query(api.recurring.upcomingPayments, {
      rangeStart: Date.UTC(2026, 3, 1),
      rangeEnd: Date.UTC(2026, 3, 30),
    });
    expect(payments).toEqual([]);
  });

  it("rejects an inverted date range", async () => {
    const t = setup();
    const { client } = await signedInAs(t, "Ana");

    await expectConvexError(
      client.query(api.recurring.upcomingPayments, {
        rangeStart: Date.UTC(2026, 4, 1),
        rangeEnd: Date.UTC(2026, 3, 1),
      }),
      { code: "INVALID_DATE_RANGE" },
    );
  });

  it("requires a signed-in user", async () => {
    const t = setup();
    await expectConvexError(
      t.query(api.recurring.upcomingPayments, {
        rangeStart: Date.UTC(2026, 3, 1),
        rangeEnd: Date.UTC(2026, 3, 30),
      }),
      { code: "UNAUTHENTICATED" },
    );
  });
});

describe("US2.5 AC3 · daily materialization", () => {
  it("creates a normal transaction on the matching day", async () => {
    const t = setup();
    const { userId, client } = await signedInAs(t, "Ana");
    // Source date is a different day so the cron is allowed to materialize today.
    await client.mutation(api.transactions.create, {
      ...RENT,
      date: Date.UTC(2026, 2, 1),
      recurrence: MONTHLY,
    });

    const result = await t.mutation(internal.recurring.materializeDue, {
      nowMs: Date.UTC(2026, 3, 15, 12, 0, 0), // 15 Apr noon UTC
    });

    expect(result).toEqual({ created: 1 });
    const transactions = await listTransactions(t);
    expect(transactions).toHaveLength(2);
    const generated = transactions.find((row) => row.date === Date.UTC(2026, 3, 15));
    expect(generated).toMatchObject({
      userId,
      type: "expense",
      amountCents: 75000,
      category: "housing",
      concept: "Lloguer",
      date: Date.UTC(2026, 3, 15),
    });
    expect(await listRules(t)).toHaveLength(1);
    expect((await listRules(t))[0]?.lastMaterializedAt).toBe(Date.UTC(2026, 3, 15));
  });

  it("does not create a second transaction the same day", async () => {
    const t = setup();
    const { client } = await signedInAs(t, "Ana");
    await client.mutation(api.transactions.create, {
      ...RENT,
      date: Date.UTC(2026, 2, 1),
      recurrence: MONTHLY,
    });

    const nowMs = Date.UTC(2026, 3, 15, 8, 0, 0);
    expect(await t.mutation(internal.recurring.materializeDue, { nowMs })).toEqual({
      created: 1,
    });
    expect(await t.mutation(internal.recurring.materializeDue, { nowMs })).toEqual({
      created: 0,
    });
    expect(await listTransactions(t)).toHaveLength(2);
  });

  it("skips the create day because lastMaterializedAt was set on insert", async () => {
    const t = setup();
    const { client } = await signedInAs(t, "Ana");
    await client.mutation(api.transactions.create, {
      ...RENT,
      date: Date.UTC(2026, 2, 15),
      recurrence: MONTHLY,
    });

    expect(
      await t.mutation(internal.recurring.materializeDue, {
        nowMs: Date.UTC(2026, 2, 15, 10, 0, 0),
      }),
    ).toEqual({ created: 0 });
    expect(await listTransactions(t)).toHaveLength(1);
  });

  it("does not materialize a yearly rule in the wrong month", async () => {
    const t = setup();
    const { client } = await signedInAs(t, "Ana");
    await client.mutation(api.transactions.create, {
      ...RENT,
      date: Date.UTC(2026, 2, 1),
      recurrence: YEARLY,
    });

    expect(
      await t.mutation(internal.recurring.materializeDue, {
        nowMs: Date.UTC(2026, 3, 15, 12, 0, 0), // April
      }),
    ).toEqual({ created: 0 });
    expect(await listTransactions(t)).toHaveLength(1);
  });
});
