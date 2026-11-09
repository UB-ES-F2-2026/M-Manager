/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import schema from "./schema";

// US2.4 · Veure l'estalvi del mes: the monthlySavings query on the backend.

const modules = import.meta.glob("./**/!(*.*.*)*.*s");

function setup() {
  return convexTest(schema, modules);
}

type TestConvex = ReturnType<typeof setup>;

const MONTH_START = Date.UTC(2026, 9, 1);
const MONTH_END = Date.UTC(2026, 10, 1) - 1;
const OCTOBER = { monthStart: MONTH_START, monthEnd: MONTH_END };
const MID_MONTH = Date.UTC(2026, 9, 15);

async function signedInAs(t: TestConvex, name: string) {
  const userId = await t.run((ctx) => ctx.db.insert("users", { name }));
  return { userId, client: t.withIdentity({ subject: `${userId}|session` }) };
}

function addTransaction(
  t: TestConvex,
  userId: Id<"users">,
  type: Doc<"transactions">["type"],
  amountCents: number,
  date = MID_MONTH,
) {
  return t.run((ctx) =>
    ctx.db.insert("transactions", {
      userId,
      type,
      amountCents,
      date,
      category: "other",
      concept: "Moviment",
    }),
  );
}

async function expectConvexError(promise: Promise<unknown>, code: string) {
  const error: unknown = await promise.then(
    () => expect.fail(`Expected ${code}`),
    (rejection: unknown) => rejection,
  );
  expect(error).toBeInstanceOf(ConvexError);
  // convex-test hands the data back serialized.
  const data: unknown = (error as { data: unknown }).data;
  const parsed: unknown = typeof data === "string" ? JSON.parse(data) : data;
  expect(parsed).toMatchObject({ code });
}

describe("transactions.monthlySavings · calculation", () => {
  it("returns zero for a month without transactions", async () => {
    const t = setup();
    const { client } = await signedInAs(t, "Ana");

    expect(await client.query(api.transactions.monthlySavings, OCTOBER)).toEqual({
      incomeCents: 0,
      expenseCents: 0,
      savingsCents: 0,
    });
  });

  it("subtracts the month's expenses from its income", async () => {
    const t = setup();
    const { userId, client } = await signedInAs(t, "Ana");
    await addTransaction(t, userId, "income", 185000);
    await addTransaction(t, userId, "income", 5000);
    await addTransaction(t, userId, "expense", 4290);
    await addTransaction(t, userId, "expense", 1299);

    expect(await client.query(api.transactions.monthlySavings, OCTOBER)).toEqual({
      incomeCents: 190000,
      expenseCents: 5589,
      savingsCents: 184411,
    });
  });

  it("returns negative savings when expenses exceed income", async () => {
    const t = setup();
    const { userId, client } = await signedInAs(t, "Ana");
    await addTransaction(t, userId, "income", 1000);
    await addTransaction(t, userId, "expense", 1500);

    const result = await client.query(api.transactions.monthlySavings, OCTOBER);

    expect(result.savingsCents).toBe(-500);
  });

  it("returns zero savings when income and expenses match", async () => {
    const t = setup();
    const { userId, client } = await signedInAs(t, "Ana");
    await addTransaction(t, userId, "income", 1000);
    await addTransaction(t, userId, "expense", 1000);

    const result = await client.query(api.transactions.monthlySavings, OCTOBER);

    expect(result.savingsCents).toBe(0);
  });
});

describe("transactions.monthlySavings · month bounds", () => {
  it("counts transactions on the first and last millisecond of the month", async () => {
    const t = setup();
    const { userId, client } = await signedInAs(t, "Ana");
    await addTransaction(t, userId, "income", 1000, MONTH_START);
    await addTransaction(t, userId, "expense", 300, MONTH_END);

    expect(await client.query(api.transactions.monthlySavings, OCTOBER)).toEqual({
      incomeCents: 1000,
      expenseCents: 300,
      savingsCents: 700,
    });
  });

  it("ignores transactions right before and after the month", async () => {
    const t = setup();
    const { userId, client } = await signedInAs(t, "Ana");
    await addTransaction(t, userId, "income", 1000, MONTH_START - 1);
    await addTransaction(t, userId, "expense", 300, MONTH_END + 1);

    const result = await client.query(api.transactions.monthlySavings, OCTOBER);

    expect(result.savingsCents).toBe(0);
  });
});

describe("transactions.monthlySavings · updates", () => {
  it("reflects added, edited and removed transactions", async () => {
    const t = setup();
    const { userId, client } = await signedInAs(t, "Ana");
    const savings = async () =>
      (await client.query(api.transactions.monthlySavings, OCTOBER)).savingsCents;

    await addTransaction(t, userId, "income", 1000);
    const expenseId = await addTransaction(t, userId, "expense", 300);
    expect(await savings()).toBe(700);

    await t.run((ctx) => ctx.db.patch(expenseId, { amountCents: 500 }));
    expect(await savings()).toBe(500);

    await t.run((ctx) => ctx.db.delete(expenseId));
    expect(await savings()).toBe(1000);
  });
});

describe("transactions.monthlySavings · access", () => {
  it("only counts the signed-in user's transactions", async () => {
    const t = setup();
    const ana = await signedInAs(t, "Ana");
    const biel = await signedInAs(t, "Biel");
    await addTransaction(t, ana.userId, "income", 1000);
    await addTransaction(t, biel.userId, "income", 9999);
    await addTransaction(t, biel.userId, "expense", 8888);

    expect(await ana.client.query(api.transactions.monthlySavings, OCTOBER)).toEqual({
      incomeCents: 1000,
      expenseCents: 0,
      savingsCents: 1000,
    });
  });

  it("rejects anonymous callers", async () => {
    const t = setup();

    await expectConvexError(
      t.query(api.transactions.monthlySavings, OCTOBER),
      "UNAUTHENTICATED",
    );
  });
});

describe("transactions.monthlySavings · invalid bounds", () => {
  it("rejects a month start after its end", async () => {
    const t = setup();
    const { client } = await signedInAs(t, "Ana");

    await expectConvexError(
      client.query(api.transactions.monthlySavings, {
        monthStart: MONTH_END,
        monthEnd: MONTH_START,
      }),
      "INVALID_DATE_RANGE",
    );
  });

  it("rejects bounds that are not integer timestamps", async () => {
    const t = setup();
    const { client } = await signedInAs(t, "Ana");

    await expectConvexError(
      client.query(api.transactions.monthlySavings, { ...OCTOBER, monthStart: 1.5 }),
      "INVALID_DATE",
    );
    await expectConvexError(
      client.query(api.transactions.monthlySavings, { ...OCTOBER, monthEnd: NaN }),
      "INVALID_DATE",
    );
  });
});
