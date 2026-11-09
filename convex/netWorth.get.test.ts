/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

// US3.2 AC3 · Editar un actiu o un deute: the queries that load it into the edit form.

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

const SAVINGS = { name: "Compte d'estalvi", type: "bankAccount", amountCents: 150000 } as const;
const MORTGAGE = {
  concept: "Hipoteca",
  amountCents: 25000000,
  dueDate: new Date(2027, 0, 15).getTime(),
};

describe("netWorth.getAsset", () => {
  it("returns the caller's own asset", async () => {
    const t = setup();
    const { userId, client } = await signedInAs(t, "Ana");
    const id = await client.mutation(api.netWorth.createAsset, SAVINGS);

    const asset = await client.query(api.netWorth.getAsset, { assetId: id });

    expect(asset).toMatchObject({ _id: id, userId, ...SAVINGS });
  });

  it("returns null for another user's asset", async () => {
    const t = setup();
    const ana = await signedInAs(t, "Ana");
    const biel = await signedInAs(t, "Biel");
    const id = await ana.client.mutation(api.netWorth.createAsset, SAVINGS);

    await expect(biel.client.query(api.netWorth.getAsset, { assetId: id })).resolves.toBeNull();
  });

  it("returns null for a deleted asset", async () => {
    const t = setup();
    const { client } = await signedInAs(t, "Ana");
    const id = await client.mutation(api.netWorth.createAsset, SAVINGS);
    await client.mutation(api.netWorth.removeAsset, { assetId: id });

    await expect(client.query(api.netWorth.getAsset, { assetId: id })).resolves.toBeNull();
  });

  it("returns null for a malformed id", async () => {
    const t = setup();
    const { client } = await signedInAs(t, "Ana");

    await expect(client.query(api.netWorth.getAsset, { assetId: "abc" })).resolves.toBeNull();
  });

  it("returns null for a debt id", async () => {
    const t = setup();
    const { client } = await signedInAs(t, "Ana");
    const debtId = await client.mutation(api.netWorth.createDebt, MORTGAGE);

    await expect(client.query(api.netWorth.getAsset, { assetId: debtId })).resolves.toBeNull();
  });

  it("rejects anonymous callers", async () => {
    const t = setup();
    const { client } = await signedInAs(t, "Ana");
    const id = await client.mutation(api.netWorth.createAsset, SAVINGS);

    await expectConvexError(t.query(api.netWorth.getAsset, { assetId: id }), "UNAUTHENTICATED");
  });
});

describe("netWorth.getDebt", () => {
  it("returns the caller's own debt", async () => {
    const t = setup();
    const { userId, client } = await signedInAs(t, "Ana");
    const id = await client.mutation(api.netWorth.createDebt, MORTGAGE);

    const debt = await client.query(api.netWorth.getDebt, { debtId: id });

    expect(debt).toMatchObject({ _id: id, userId, ...MORTGAGE });
  });

  it("returns null for another user's debt", async () => {
    const t = setup();
    const ana = await signedInAs(t, "Ana");
    const biel = await signedInAs(t, "Biel");
    const id = await ana.client.mutation(api.netWorth.createDebt, MORTGAGE);

    await expect(biel.client.query(api.netWorth.getDebt, { debtId: id })).resolves.toBeNull();
  });

  it("returns null for a deleted debt", async () => {
    const t = setup();
    const { client } = await signedInAs(t, "Ana");
    const id = await client.mutation(api.netWorth.createDebt, MORTGAGE);
    await client.mutation(api.netWorth.removeDebt, { debtId: id });

    await expect(client.query(api.netWorth.getDebt, { debtId: id })).resolves.toBeNull();
  });

  it("returns null for a malformed id", async () => {
    const t = setup();
    const { client } = await signedInAs(t, "Ana");

    await expect(client.query(api.netWorth.getDebt, { debtId: "abc" })).resolves.toBeNull();
  });

  it("returns null for an asset id", async () => {
    const t = setup();
    const { client } = await signedInAs(t, "Ana");
    const assetId = await client.mutation(api.netWorth.createAsset, SAVINGS);

    await expect(client.query(api.netWorth.getDebt, { debtId: assetId })).resolves.toBeNull();
  });

  it("rejects anonymous callers", async () => {
    const t = setup();
    const { client } = await signedInAs(t, "Ana");
    const id = await client.mutation(api.netWorth.createDebt, MORTGAGE);

    await expectConvexError(t.query(api.netWorth.getDebt, { debtId: id }), "UNAUTHENTICATED");
  });
});
