/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

// US2.1 · Registrar un moviment: the create mutation on the backend.

const modules = import.meta.glob("./**/!(*.*.*)*.*s");

function setup() {
  return convexTest(schema, modules);
}

type TestConvex = ReturnType<typeof setup>;

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

function listTransactions(t: TestConvex) {
  return t.run((ctx) => ctx.db.query("transactions").collect());
}

const GROCERIES = {
  type: "expense",
  amountCents: 4290,
  date: Date.UTC(2026, 9, 30),
  category: "groceries",
  concept: "Supermercat",
} as const;

describe("transactions.create", () => {
  it("stores the transaction for the signed-in user", async () => {
    const t = setup();
    const { userId, client } = await signedInAs(t, "Ana");

    const id = await client.mutation(api.transactions.create, GROCERIES);

    const stored = await t.run((ctx) => ctx.db.get(id));
    expect(stored).toMatchObject({ ...GROCERIES, userId });
  });

  it("stores income with a positive amount", async () => {
    const t = setup();
    const { client } = await signedInAs(t, "Ana");

    await client.mutation(api.transactions.create, {
      ...GROCERIES,
      type: "income",
      category: "salary",
      amountCents: 185000,
      concept: "Nòmina",
    });

    const [stored] = await listTransactions(t);
    expect(stored).toMatchObject({ type: "income", amountCents: 185000 });
  });

  it("trims the concept", async () => {
    const t = setup();
    const { client } = await signedInAs(t, "Ana");

    await client.mutation(api.transactions.create, {
      ...GROCERIES,
      concept: "  Supermercat  ",
    });

    const [stored] = await listTransactions(t);
    expect(stored?.concept).toBe("Supermercat");
  });

  it("assigns the transaction to the caller, not to another user", async () => {
    const t = setup();
    const ana = await signedInAs(t, "Ana");
    const biel = await signedInAs(t, "Biel");

    await biel.client.mutation(api.transactions.create, GROCERIES);

    const [stored] = await listTransactions(t);
    expect(stored?.userId).toBe(biel.userId);
    expect(stored?.userId).not.toBe(ana.userId);
  });

  it("rejects anonymous callers and stores nothing", async () => {
    const t = setup();

    await expectConvexError(
      t.mutation(api.transactions.create, GROCERIES),
      "UNAUTHENTICATED",
    );
    expect(await listTransactions(t)).toHaveLength(0);
  });

  it.each([
    ["zero", 0],
    ["negative", -100],
    ["decimal", 12.5],
  ])("rejects a %s amount and stores nothing", async (_label, amountCents) => {
    const t = setup();
    const { client } = await signedInAs(t, "Ana");

    await expectConvexError(
      client.mutation(api.transactions.create, { ...GROCERIES, amountCents }),
      "INVALID_AMOUNT",
    );
    expect(await listTransactions(t)).toHaveLength(0);
  });

  it("rejects an invalid date and stores nothing", async () => {
    const t = setup();
    const { client } = await signedInAs(t, "Ana");

    await expectConvexError(
      client.mutation(api.transactions.create, { ...GROCERIES, date: 1.5 }),
      "INVALID_DATE",
    );
    expect(await listTransactions(t)).toHaveLength(0);
  });

  it("rejects a blank concept and stores nothing", async () => {
    const t = setup();
    const { client } = await signedInAs(t, "Ana");

    await expectConvexError(
      client.mutation(api.transactions.create, { ...GROCERIES, concept: "   " }),
      "INVALID_CONCEPT",
    );
    expect(await listTransactions(t)).toHaveLength(0);
  });
});
