/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

// US2.2 · Editar un moviment: the query that loads it into the edit form.

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

const GROCERIES = {
  type: "expense",
  amountCents: 4290,
  date: Date.UTC(2026, 9, 30),
  category: "groceries",
  concept: "Supermercat",
} as const;

describe("transactions.get", () => {
  it("returns the caller's own transaction", async () => {
    const t = setup();
    const { userId, client } = await signedInAs(t, "Ana");
    const id = await client.mutation(api.transactions.create, GROCERIES);

    const transaction = await client.query(api.transactions.get, { transactionId: id });

    expect(transaction).toMatchObject({ _id: id, userId, ...GROCERIES });
  });

  it("returns null for another user's transaction", async () => {
    const t = setup();
    const ana = await signedInAs(t, "Ana");
    const biel = await signedInAs(t, "Biel");
    const id = await ana.client.mutation(api.transactions.create, GROCERIES);

    await expect(
      biel.client.query(api.transactions.get, { transactionId: id }),
    ).resolves.toBeNull();
  });

  it("returns null for a deleted transaction", async () => {
    const t = setup();
    const { client } = await signedInAs(t, "Ana");
    const id = await client.mutation(api.transactions.create, GROCERIES);
    await client.mutation(api.transactions.remove, { transactionId: id });

    await expect(client.query(api.transactions.get, { transactionId: id })).resolves.toBeNull();
  });

  it("returns null for a malformed id", async () => {
    const t = setup();
    const { client } = await signedInAs(t, "Ana");

    await expect(
      client.query(api.transactions.get, { transactionId: "abc" }),
    ).resolves.toBeNull();
  });

  it("returns null for an id from another table", async () => {
    const t = setup();
    const { userId, client } = await signedInAs(t, "Ana");

    await expect(
      client.query(api.transactions.get, { transactionId: userId }),
    ).resolves.toBeNull();
  });

  it("rejects anonymous callers", async () => {
    const t = setup();
    const { client } = await signedInAs(t, "Ana");
    const id = await client.mutation(api.transactions.create, GROCERIES);

    await expectConvexError(
      t.query(api.transactions.get, { transactionId: id }),
      "UNAUTHENTICATED",
    );
  });
});
