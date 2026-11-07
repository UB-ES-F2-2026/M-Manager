/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import schema from "./schema";

// US2.3 · Consultar l'historial de moviments: the list query on the backend.

const modules = import.meta.glob("./**/!(*.*.*)*.*s");

function setup() {
  return convexTest(schema, modules);
}

type TestConvex = ReturnType<typeof setup>;
type NewTransaction = Omit<Doc<"transactions">, "_id" | "_creationTime" | "userId">;

async function signedInAs(t: TestConvex, name: string) {
  const userId = await t.run((ctx) => ctx.db.insert("users", { name }));
  return { userId, client: t.withIdentity({ subject: `${userId}|session` }) };
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

/** Inserts the transactions directly, so these tests do not depend on transactions.create. */
function insertTransactions(t: TestConvex, userId: Id<"users">, transactions: NewTransaction[]) {
  return t.run(async (ctx) => {
    for (const transaction of transactions) {
      await ctx.db.insert("transactions", { ...transaction, userId });
    }
  });
}

const SALARY: NewTransaction = {
  type: "income",
  amountCents: 150000,
  date: Date.UTC(2026, 9, 1),
  category: "salary",
  concept: "Nòmina",
};
const GROCERIES: NewTransaction = {
  type: "expense",
  amountCents: 4290,
  date: Date.UTC(2026, 9, 15),
  category: "groceries",
  concept: "Supermercat",
};
const TRAIN: NewTransaction = {
  type: "expense",
  amountCents: 1120,
  date: Date.UTC(2026, 9, 20),
  category: "transport",
  concept: "Bitllet de tren",
};
const MORE_GROCERIES: NewTransaction = {
  type: "expense",
  amountCents: 2575,
  date: Date.UTC(2026, 9, 28),
  category: "groceries",
  concept: "Fruiteria",
};

const ALL = [SALARY, GROCERIES, TRAIN, MORE_GROCERIES];

function concepts(transactions: { concept: string }[]) {
  return transactions.map((transaction) => transaction.concept);
}

describe("US2.3 AC1 · all transactions, newest first", () => {
  it("returns every transaction of the user sorted by date descending", async () => {
    const t = setup();
    const { userId, client } = await signedInAs(t, "Ana");
    // Inserted out of order on purpose: the order must come from the date.
    await insertTransactions(t, userId, [GROCERIES, MORE_GROCERIES, SALARY, TRAIN]);

    const history = await client.query(api.transactions.list, {});

    expect(concepts(history)).toEqual(["Fruiteria", "Bitllet de tren", "Supermercat", "Nòmina"]);
  });

  it("returns an empty list when the user has no transactions", async () => {
    const t = setup();
    const { client } = await signedInAs(t, "Ana");

    expect(await client.query(api.transactions.list, {})).toEqual([]);
  });

  it("only returns the caller's transactions", async () => {
    const t = setup();
    const ana = await signedInAs(t, "Ana");
    const bernat = await signedInAs(t, "Bernat");
    await insertTransactions(t, ana.userId, [GROCERIES]);
    await insertTransactions(t, bernat.userId, [SALARY, TRAIN]);

    const history = await ana.client.query(api.transactions.list, {});

    expect(concepts(history)).toEqual(["Supermercat"]);
  });

  it("rejects anonymous callers", async () => {
    const t = setup();
    const { userId } = await signedInAs(t, "Ana");
    await insertTransactions(t, userId, ALL);

    await expectConvexError(t.query(api.transactions.list, {}), "UNAUTHENTICATED");
  });
});

describe("US2.3 AC2 · filter by date range or category", () => {
  it("keeps transactions inside the range, both ends included", async () => {
    const t = setup();
    const { userId, client } = await signedInAs(t, "Ana");
    await insertTransactions(t, userId, ALL);

    const history = await client.query(api.transactions.list, {
      from: GROCERIES.date,
      to: TRAIN.date,
    });

    expect(concepts(history)).toEqual(["Bitllet de tren", "Supermercat"]);
  });

  it("accepts only a start date", async () => {
    const t = setup();
    const { userId, client } = await signedInAs(t, "Ana");
    await insertTransactions(t, userId, ALL);

    const history = await client.query(api.transactions.list, { from: TRAIN.date });

    expect(concepts(history)).toEqual(["Fruiteria", "Bitllet de tren"]);
  });

  it("accepts only an end date", async () => {
    const t = setup();
    const { userId, client } = await signedInAs(t, "Ana");
    await insertTransactions(t, userId, ALL);

    const history = await client.query(api.transactions.list, { to: GROCERIES.date });

    expect(concepts(history)).toEqual(["Supermercat", "Nòmina"]);
  });

  it("filters by category", async () => {
    const t = setup();
    const { userId, client } = await signedInAs(t, "Ana");
    await insertTransactions(t, userId, ALL);

    const history = await client.query(api.transactions.list, { category: "groceries" });

    expect(concepts(history)).toEqual(["Fruiteria", "Supermercat"]);
  });

  it("combines the date range and the category", async () => {
    const t = setup();
    const { userId, client } = await signedInAs(t, "Ana");
    await insertTransactions(t, userId, ALL);

    const history = await client.query(api.transactions.list, {
      from: Date.UTC(2026, 9, 10),
      to: Date.UTC(2026, 9, 25),
      category: "groceries",
    });

    expect(concepts(history)).toEqual(["Supermercat"]);
  });

  it("returns an empty list when nothing matches", async () => {
    const t = setup();
    const { userId, client } = await signedInAs(t, "Ana");
    await insertTransactions(t, userId, ALL);

    const history = await client.query(api.transactions.list, { category: "health" });

    expect(history).toEqual([]);
  });

  it("does not leak other users' transactions through the filters", async () => {
    const t = setup();
    const ana = await signedInAs(t, "Ana");
    const bernat = await signedInAs(t, "Bernat");
    await insertTransactions(t, ana.userId, [GROCERIES]);
    await insertTransactions(t, bernat.userId, [MORE_GROCERIES]);

    const history = await ana.client.query(api.transactions.list, { category: "groceries" });

    expect(concepts(history)).toEqual(["Supermercat"]);
  });

  it("rejects a start date after the end date", async () => {
    const t = setup();
    const { client } = await signedInAs(t, "Ana");

    await expectConvexError(
      client.query(api.transactions.list, { from: TRAIN.date, to: GROCERIES.date }),
      "INVALID_DATE_RANGE",
    );
  });

  it.each([
    ["decimal", 1.5],
    ["infinite", Number.POSITIVE_INFINITY],
  ])("rejects a %s date", async (_label, from) => {
    const t = setup();
    const { client } = await signedInAs(t, "Ana");

    await expectConvexError(client.query(api.transactions.list, { from }), "INVALID_DATE");
  });
});

describe("US2.3 AC3 · data to colour income and expenses", () => {
  it("returns the type of each transaction with the rest of its fields", async () => {
    const t = setup();
    const { userId, client } = await signedInAs(t, "Ana");
    await insertTransactions(t, userId, [SALARY, GROCERIES]);

    const history = await client.query(api.transactions.list, {});

    // The UI paints `income` green and `expense` red.
    expect(history).toEqual([
      expect.objectContaining({ ...GROCERIES, userId }),
      expect.objectContaining({ ...SALARY, userId }),
    ]);
  });
});
