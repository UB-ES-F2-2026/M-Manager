/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";

// US2.2 · Editar o eliminar un moviment: the update and remove mutations on the backend.

const modules = import.meta.glob("./**/!(*.*.*)*.*s");

const NOT_FOUND = {
  code: "NOT_FOUND",
  message: "No s'ha trobat aquest moviment.",
};

const GROCERIES = {
  type: "expense",
  amountCents: 4290,
  date: Date.UTC(2026, 9, 15),
  category: "groceries",
  concept: "Supermercat",
} as const;

function setup() {
  return convexTest(schema, modules);
}

type TestConvex = ReturnType<typeof setup>;

async function signedInAs(t: TestConvex, name: string) {
  const userId = await t.run((ctx) => ctx.db.insert("users", { name }));
  return { userId, client: t.withIdentity({ subject: `${userId}|session` }) };
}

/** Ana with one transaction, inserted directly so the setup does not depend on create. */
async function setupAnaWithTransaction() {
  const t = setup();
  const ana = await signedInAs(t, "Ana");
  const transactionId = await t.run((ctx) =>
    ctx.db.insert("transactions", { ...GROCERIES, userId: ana.userId }),
  );
  return { t, ana, transactionId };
}

function getTransaction(t: TestConvex, transactionId: Id<"transactions">) {
  return t.run((ctx) => ctx.db.get(transactionId));
}

function listTransactions(t: TestConvex) {
  return t.run((ctx) => ctx.db.query("transactions").collect());
}

async function expectConvexError(promise: Promise<unknown>, expected: { code: string }) {
  const error: unknown = await promise.then(
    () => expect.fail(`Expected ${expected.code}`),
    (rejection: unknown) => rejection,
  );
  expect(error).toBeInstanceOf(ConvexError);
  // convex-test hands the data back serialized.
  const data: unknown = (error as { data: unknown }).data;
  const parsed: unknown = typeof data === "string" ? JSON.parse(data) : data;
  expect(parsed).toMatchObject(expected);
}

describe("US2.2 AC1 · edit a transaction", () => {
  it.each([
    ["amount", { amountCents: 9999 }],
    ["date", { date: Date.UTC(2026, 9, 20) }],
    ["category", { category: "transport" }],
  ] as const)("changes the %s and keeps the other fields", async (_label, change) => {
    const { t, ana, transactionId } = await setupAnaWithTransaction();

    await ana.client.mutation(api.transactions.update, {
      transactionId,
      ...GROCERIES,
      ...change,
    });

    expect(await getTransaction(t, transactionId)).toMatchObject({
      ...GROCERIES,
      ...change,
      userId: ana.userId,
    });
  });

  it("changes the type and trims the concept", async () => {
    const { t, ana, transactionId } = await setupAnaWithTransaction();

    await ana.client.mutation(api.transactions.update, {
      transactionId,
      ...GROCERIES,
      type: "income",
      concept: "  Devolució  ",
    });

    expect(await getTransaction(t, transactionId)).toMatchObject({
      type: "income",
      concept: "Devolució",
    });
  });

  it("edits the row in place, without creating another one", async () => {
    const { t, ana, transactionId } = await setupAnaWithTransaction();

    await ana.client.mutation(api.transactions.update, {
      transactionId,
      ...GROCERIES,
      amountCents: 100,
    });

    const transactions = await listTransactions(t);
    expect(transactions).toHaveLength(1);
    expect(transactions[0]._id).toBe(transactionId);
  });

  it("does not touch the user's other transactions", async () => {
    const { t, ana, transactionId } = await setupAnaWithTransaction();
    const otherId = await t.run((ctx) =>
      ctx.db.insert("transactions", { ...GROCERIES, userId: ana.userId, concept: "Fruiteria" }),
    );

    await ana.client.mutation(api.transactions.update, {
      transactionId,
      ...GROCERIES,
      amountCents: 100,
    });

    expect(await getTransaction(t, otherId)).toMatchObject({
      amountCents: GROCERIES.amountCents,
      concept: "Fruiteria",
    });
  });

  it.each([
    ["zero amount", { amountCents: 0 }, "INVALID_AMOUNT"],
    ["negative amount", { amountCents: -100 }, "INVALID_AMOUNT"],
    ["decimal amount", { amountCents: 12.5 }, "INVALID_AMOUNT"],
    ["decimal date", { date: 1.5 }, "INVALID_DATE"],
    ["blank concept", { concept: "   " }, "INVALID_CONCEPT"],
    ["concept over 80 characters", { concept: "a".repeat(81) }, "INVALID_CONCEPT"],
  ])("rejects a %s and keeps the stored values", async (_label, change, code) => {
    const { t, ana, transactionId } = await setupAnaWithTransaction();

    await expectConvexError(
      ana.client.mutation(api.transactions.update, { transactionId, ...GROCERIES, ...change }),
      { code },
    );

    expect(await getTransaction(t, transactionId)).toMatchObject(GROCERIES);
  });

  it("rejects a non-numeric amount and keeps the stored values", async () => {
    const { t, ana, transactionId } = await setupAnaWithTransaction();

    await expect(
      ana.client.mutation(api.transactions.update, {
        transactionId,
        ...GROCERIES,
        amountCents: "abc" as unknown as number,
      }),
    ).rejects.toThrow();

    expect(await getTransaction(t, transactionId)).toMatchObject(GROCERIES);
  });

  it("does not let the owner be changed through the arguments", async () => {
    const { t, ana, transactionId } = await setupAnaWithTransaction();
    const bernat = await signedInAs(t, "Bernat");

    await expect(
      ana.client.mutation(api.transactions.update, {
        transactionId,
        ...GROCERIES,
        userId: bernat.userId,
      } as never),
    ).rejects.toThrow();

    expect(await getTransaction(t, transactionId)).toMatchObject({ userId: ana.userId });
  });
});

describe("US2.2 AC2 · delete a transaction", () => {
  it("deletes the transaction", async () => {
    const { t, ana, transactionId } = await setupAnaWithTransaction();

    await ana.client.mutation(api.transactions.remove, { transactionId });

    expect(await getTransaction(t, transactionId)).toBeNull();
  });

  it("deletes only that transaction", async () => {
    const { t, ana, transactionId } = await setupAnaWithTransaction();
    const otherId = await t.run((ctx) =>
      ctx.db.insert("transactions", { ...GROCERIES, userId: ana.userId }),
    );

    await ana.client.mutation(api.transactions.remove, { transactionId });

    expect(await getTransaction(t, otherId)).not.toBeNull();
    expect(await listTransactions(t)).toHaveLength(1);
  });
});

describe("US2.2 · access", () => {
  it("rejects anonymous callers and changes nothing", async () => {
    const { t, transactionId } = await setupAnaWithTransaction();

    await expectConvexError(
      t.mutation(api.transactions.update, { transactionId, ...GROCERIES, amountCents: 1 }),
      { code: "UNAUTHENTICATED" },
    );
    await expectConvexError(t.mutation(api.transactions.remove, { transactionId }), {
      code: "UNAUTHENTICATED",
    });

    expect(await getTransaction(t, transactionId)).toMatchObject(GROCERIES);
  });

  it("does not let another user edit or delete it, and changes nothing", async () => {
    const { t, transactionId } = await setupAnaWithTransaction();
    const bernat = await signedInAs(t, "Bernat");

    await expectConvexError(
      bernat.client.mutation(api.transactions.update, {
        transactionId,
        ...GROCERIES,
        amountCents: 1,
      }),
      NOT_FOUND,
    );
    await expectConvexError(
      bernat.client.mutation(api.transactions.remove, { transactionId }),
      NOT_FOUND,
    );

    expect(await getTransaction(t, transactionId)).toMatchObject(GROCERIES);
  });

  it("checks the owner before the data, so invalid values reveal nothing", async () => {
    const { t, transactionId } = await setupAnaWithTransaction();
    const bernat = await signedInAs(t, "Bernat");

    await expectConvexError(
      bernat.client.mutation(api.transactions.update, {
        transactionId,
        ...GROCERIES,
        amountCents: 0,
      }),
      NOT_FOUND,
    );
  });

  it("returns NOT_FOUND when the transaction was already deleted", async () => {
    const { ana, transactionId } = await setupAnaWithTransaction();
    await ana.client.mutation(api.transactions.remove, { transactionId });

    await expectConvexError(
      ana.client.mutation(api.transactions.update, { transactionId, ...GROCERIES }),
      NOT_FOUND,
    );
    await expectConvexError(
      ana.client.mutation(api.transactions.remove, { transactionId }),
      NOT_FOUND,
    );
  });
});
