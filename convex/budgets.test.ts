/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { BUDGET_EXISTS_MESSAGE } from "./budgets";
import schema from "./schema";

// US3.1 · Definir un límit de despesa mensual per categoria: backend.

const modules = import.meta.glob("./**/!(*.*.*)*.*s");

function setup() {
  return convexTest(schema, modules);
}

type TestConvex = ReturnType<typeof setup>;

async function signedInAs(t: TestConvex, name: string) {
  const userId = await t.run((ctx) => ctx.db.insert("users", { name }));
  return { userId, client: t.withIdentity({ subject: `${userId}|session` }) };
}

async function expectError(
  promise: Promise<unknown>,
  code: string,
  message?: string,
) {
  const error: unknown = await promise.then(
    () => expect.fail(`Expected ${code}`),
    (rejection: unknown) => rejection,
  );
  expect(error).toBeInstanceOf(ConvexError);
  const data: unknown = (error as { data: unknown }).data;
  const parsed: unknown = typeof data === "string" ? JSON.parse(data) : data;
  expect(parsed).toMatchObject(message === undefined ? { code } : { code, message });
}

const MONTH_START = Date.UTC(2026, 10, 1);
const MONTH_END = Date.UTC(2026, 11, 1) - 1;
const NOVEMBER = { monthStart: MONTH_START, monthEnd: MONTH_END };
const MID_MONTH = Date.UTC(2026, 10, 15);
const GROCERIES = { category: "groceries" as const, amountCents: 30000 };

function addTransaction(
  t: TestConvex,
  userId: Id<"users">,
  fields: Partial<Omit<Doc<"transactions">, "_id" | "_creationTime" | "userId">>,
) {
  return t.run((ctx) =>
    ctx.db.insert("transactions", {
      userId,
      type: "expense",
      amountCents: 1000,
      date: MID_MONTH,
      category: "groceries",
      concept: "Supermercat",
      ...fields,
    }),
  );
}

describe("budgets.create", () => {
  it("stores the category and the limit in cents for the signed-in user", async () => {
    const t = setup();
    const { userId, client } = await signedInAs(t, "Ana");

    const budgetId = await client.mutation(api.budgets.create, GROCERIES);

    const stored = await t.run((ctx) => ctx.db.get(budgetId));
    expect(stored).toMatchObject({ userId, category: "groceries", amountCents: 30000 });
  });

  it("rejects a logged-out caller", async () => {
    const t = setup();
    await expectError(t.mutation(api.budgets.create, GROCERIES), "UNAUTHENTICATED");
  });

  it("rejects an amount that is not a positive integer of cents", async () => {
    const t = setup();
    const { client } = await signedInAs(t, "Ana");

    for (const amountCents of [0, -100, 12.5]) {
      await expectError(
        client.mutation(api.budgets.create, { ...GROCERIES, amountCents }),
        "INVALID_AMOUNT",
        "L'import ha de ser més gran que zero.",
      );
    }
  });

  it("rejects an income category", async () => {
    const t = setup();
    const { client } = await signedInAs(t, "Ana");

    await expect(
      client.mutation(api.budgets.create, {
        // @ts-expect-error salary is an income category and cannot be budgeted
        category: "salary",
        amountCents: 1000,
      }),
    ).rejects.toThrow();
  });

  it("allows only one budget per category and user", async () => {
    const t = setup();
    const ana = await signedInAs(t, "Ana");
    const bert = await signedInAs(t, "Bert");
    await ana.client.mutation(api.budgets.create, GROCERIES);

    await expectError(
      ana.client.mutation(api.budgets.create, { ...GROCERIES, amountCents: 5000 }),
      "BUDGET_EXISTS",
      BUDGET_EXISTS_MESSAGE,
    );
    // Another user can budget the same category.
    await bert.client.mutation(api.budgets.create, GROCERIES);
  });
});

describe("budgets.update", () => {
  it("changes the limit and the category of an owned budget", async () => {
    const t = setup();
    const { client } = await signedInAs(t, "Ana");
    const budgetId = await client.mutation(api.budgets.create, GROCERIES);

    await client.mutation(api.budgets.update, {
      budgetId,
      category: "leisure",
      amountCents: 12000,
    });

    const stored = await t.run((ctx) => ctx.db.get(budgetId));
    expect(stored).toMatchObject({ category: "leisure", amountCents: 12000 });
  });

  it("keeps the same category when only the limit changes", async () => {
    const t = setup();
    const { client } = await signedInAs(t, "Ana");
    const budgetId = await client.mutation(api.budgets.create, GROCERIES);

    await client.mutation(api.budgets.update, { budgetId, ...GROCERIES, amountCents: 40000 });

    const stored = await t.run((ctx) => ctx.db.get(budgetId));
    expect(stored).toMatchObject({ category: "groceries", amountCents: 40000 });
  });

  it("rejects moving a budget to a category that already has one", async () => {
    const t = setup();
    const { client } = await signedInAs(t, "Ana");
    await client.mutation(api.budgets.create, GROCERIES);
    const leisureId = await client.mutation(api.budgets.create, {
      category: "leisure",
      amountCents: 5000,
    });

    await expectError(
      client.mutation(api.budgets.update, { budgetId: leisureId, ...GROCERIES }),
      "BUDGET_EXISTS",
      BUDGET_EXISTS_MESSAGE,
    );
  });

  it("rejects an invalid amount", async () => {
    const t = setup();
    const { client } = await signedInAs(t, "Ana");
    const budgetId = await client.mutation(api.budgets.create, GROCERIES);

    await expectError(
      client.mutation(api.budgets.update, { budgetId, ...GROCERIES, amountCents: 0 }),
      "INVALID_AMOUNT",
    );
  });

  it("does not let a user edit someone else's budget", async () => {
    const t = setup();
    const ana = await signedInAs(t, "Ana");
    const bert = await signedInAs(t, "Bert");
    const budgetId = await ana.client.mutation(api.budgets.create, GROCERIES);

    await expectError(
      bert.client.mutation(api.budgets.update, { budgetId, ...GROCERIES, amountCents: 1 }),
      "NOT_FOUND",
      "No s'ha trobat aquest pressupost.",
    );
    const stored = await t.run((ctx) => ctx.db.get(budgetId));
    expect(stored?.amountCents).toBe(30000);
  });
});

describe("budgets.get", () => {
  it("returns an owned budget and null for anything else", async () => {
    const t = setup();
    const ana = await signedInAs(t, "Ana");
    const bert = await signedInAs(t, "Bert");
    const budgetId = await ana.client.mutation(api.budgets.create, GROCERIES);

    expect(await ana.client.query(api.budgets.get, { budgetId })).toMatchObject(GROCERIES);
    expect(await bert.client.query(api.budgets.get, { budgetId })).toBeNull();
    expect(await ana.client.query(api.budgets.get, { budgetId: "not-an-id" })).toBeNull();
  });

  it("rejects a logged-out caller", async () => {
    const t = setup();
    await expectError(
      t.query(api.budgets.get, { budgetId: "anything" }),
      "UNAUTHENTICATED",
    );
  });
});

describe("budgets.list", () => {
  it("returns only the signed-in user's budgets", async () => {
    const t = setup();
    const ana = await signedInAs(t, "Ana");
    const bert = await signedInAs(t, "Bert");
    await ana.client.mutation(api.budgets.create, GROCERIES);
    await bert.client.mutation(api.budgets.create, { category: "leisure", amountCents: 100 });

    const budgets = await ana.client.query(api.budgets.list, NOVEMBER);

    expect(budgets).toHaveLength(1);
    expect(budgets[0]).toMatchObject({ ...GROCERIES, spentCents: 0 });
  });

  it("sums only this month's expenses of the budget's category", async () => {
    const t = setup();
    const ana = await signedInAs(t, "Ana");
    const bert = await signedInAs(t, "Bert");
    await ana.client.mutation(api.budgets.create, GROCERIES);
    await ana.client.mutation(api.budgets.create, { category: "leisure", amountCents: 5000 });

    // Counted: groceries expenses inside the month, including both bounds.
    await addTransaction(t, ana.userId, { amountCents: 1250, date: MONTH_START });
    await addTransaction(t, ana.userId, { amountCents: 2000 });
    await addTransaction(t, ana.userId, { amountCents: 750, date: MONTH_END });
    // Not counted: other category, income, outside the month, other user.
    await addTransaction(t, ana.userId, { category: "transport", amountCents: 900 });
    await addTransaction(t, ana.userId, { type: "income", amountCents: 50000 });
    await addTransaction(t, ana.userId, { date: MONTH_START - 1, amountCents: 300 });
    await addTransaction(t, ana.userId, { date: MONTH_END + 1, amountCents: 300 });
    await addTransaction(t, bert.userId, { amountCents: 9999 });

    const budgets = await ana.client.query(api.budgets.list, NOVEMBER);
    const spent = Object.fromEntries(
      budgets.map((budget) => [budget.category, budget.spentCents]),
    );

    expect(spent).toEqual({ groceries: 4000, leisure: 0 });
  });

  it("returns an empty list when the user has no budgets", async () => {
    const t = setup();
    const { client } = await signedInAs(t, "Ana");

    expect(await client.query(api.budgets.list, NOVEMBER)).toEqual([]);
  });

  it("rejects a logged-out caller and an inverted month range", async () => {
    const t = setup();
    const { client } = await signedInAs(t, "Ana");

    await expectError(t.query(api.budgets.list, NOVEMBER), "UNAUTHENTICATED");
    await expectError(
      client.query(api.budgets.list, { monthStart: MONTH_END, monthEnd: MONTH_START }),
      "INVALID_DATE_RANGE",
    );
  });
});
