/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import schema from "./schema";

// US3.3 · Veure el patrimoni net i la liquiditat: the summary query.

const modules = import.meta.glob("./**/!(*.*.*)*.*s");

function setup() {
  return convexTest(schema, modules);
}

type TestConvex = ReturnType<typeof setup>;

async function signedInAs(t: TestConvex, name: string) {
  const userId = await t.run((ctx) => ctx.db.insert("users", { name }));
  return { userId, client: t.withIdentity({ subject: `${userId}|session` }) };
}

function addAsset(
  t: TestConvex,
  userId: Id<"users">,
  type: Doc<"assets">["type"],
  amountCents: number,
) {
  return t.run((ctx) =>
    ctx.db.insert("assets", { userId, name: "Actiu", type, amountCents }),
  );
}

function addDebt(t: TestConvex, userId: Id<"users">, amountCents: number) {
  return t.run((ctx) =>
    ctx.db.insert("debts", {
      userId,
      concept: "Deute",
      amountCents,
      dueDate: Date.UTC(2027, 0, 1),
    }),
  );
}

describe("netWorth.summary", () => {
  it("returns zero for both totals when there are no assets or debts", async () => {
    const t = setup();
    const { client } = await signedInAs(t, "Ana");

    expect(await client.query(api.netWorth.summary, {})).toEqual({
      netWorthCents: 0,
      liquidityCents: 0,
    });
  });

  it("subtracts all debts from all assets", async () => {
    const t = setup();
    const { userId, client } = await signedInAs(t, "Ana");
    await addAsset(t, userId, "bankAccount", 150000);
    await addAsset(t, userId, "realEstate", 20000000);
    await addDebt(t, userId, 12000000);
    await addDebt(t, userId, 50000);

    const summary = await client.query(api.netWorth.summary, {});

    expect(summary.netWorthCents).toBe(150000 + 20000000 - 12000000 - 50000);
  });

  it("can be negative when debts are larger than assets", async () => {
    const t = setup();
    const { userId, client } = await signedInAs(t, "Ana");
    await addAsset(t, userId, "cash", 10000);
    await addDebt(t, userId, 25000);

    expect(await client.query(api.netWorth.summary, {})).toEqual({
      netWorthCents: -15000,
      liquidityCents: 10000,
    });
  });

  it("counts only bank accounts and cash as liquidity", async () => {
    const t = setup();
    const { userId, client } = await signedInAs(t, "Ana");
    await addAsset(t, userId, "bankAccount", 150000);
    await addAsset(t, userId, "cash", 2500);
    await addAsset(t, userId, "investment", 800000);
    await addAsset(t, userId, "realEstate", 20000000);
    await addAsset(t, userId, "vehicle", 900000);
    await addAsset(t, userId, "other", 100);
    await addDebt(t, userId, 50000);

    const summary = await client.query(api.netWorth.summary, {});

    // Debts do not reduce liquidity.
    expect(summary.liquidityCents).toBe(152500);
  });

  it("only counts the signed-in user's assets and debts", async () => {
    const t = setup();
    const ana = await signedInAs(t, "Ana");
    const bert = await signedInAs(t, "Bert");
    await addAsset(t, ana.userId, "cash", 1000);
    await addAsset(t, bert.userId, "bankAccount", 999999);
    await addDebt(t, bert.userId, 500);

    expect(await ana.client.query(api.netWorth.summary, {})).toEqual({
      netWorthCents: 1000,
      liquidityCents: 1000,
    });
  });

  it("rejects a logged-out caller", async () => {
    const t = setup();

    const error: unknown = await t.query(api.netWorth.summary, {}).then(
      () => expect.fail("Expected UNAUTHENTICATED"),
      (rejection: unknown) => rejection,
    );
    expect(error).toBeInstanceOf(ConvexError);
    const data: unknown = (error as { data: unknown }).data;
    const parsed: unknown = typeof data === "string" ? JSON.parse(data) : data;
    expect(parsed).toMatchObject({ code: "UNAUTHENTICATED" });
  });
});
