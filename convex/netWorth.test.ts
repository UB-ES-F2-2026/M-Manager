/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import { MAX_LABEL_LENGTH } from "./netWorth";
import schema from "./schema";

const modules = import.meta.glob("./**/!(*.*.*)*.*s");

function setup() {
  return convexTest(schema, modules);
}

type TestConvex = ReturnType<typeof setup>;

async function asUser(t: TestConvex, name: string) {
  const userId = await t.run((ctx) => ctx.db.insert("users", { name }));
  return t.withIdentity({ subject: `${userId}|session` });
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

const ASSET = { name: "Compte corrent", type: "bankAccount" as const, amountCents: 150000 };
const DUE_DATE = Date.parse("2026-12-01T00:00:00.000Z");

describe("US3.2 assets and debts", () => {
  it("lists only the signed-in user's assets and debts", async () => {
    const t = setup();
    const ana = await asUser(t, "Ana");
    const bert = await asUser(t, "Bert");

    await ana.mutation(api.netWorth.createAsset, ASSET);
    await bert.mutation(api.netWorth.createDebt, {
      concept: "Hipoteca",
      amountCents: 1000,
      dueDate: DUE_DATE,
    });

    const anaList = await ana.query(api.netWorth.list, {});
    expect(anaList.assets).toHaveLength(1);
    expect(anaList.assets[0]).toMatchObject({ name: "Compte corrent", amountCents: 150000 });
    expect(anaList.debts).toHaveLength(0);

    const bertList = await bert.query(api.netWorth.list, {});
    expect(bertList.assets).toHaveLength(0);
    expect(bertList.debts).toHaveLength(1);
  });

  it("trims the asset name and stores a positive amount in cents", async () => {
    const t = setup();
    const ana = await asUser(t, "Ana");

    const assetId = await ana.mutation(api.netWorth.createAsset, {
      ...ASSET,
      name: "  Compte corrent  ",
    });

    const stored = await t.run((ctx) => ctx.db.get(assetId));
    expect(stored).toMatchObject({ name: "Compte corrent", amountCents: 150000 });
  });

  it("rejects a logged-out caller", async () => {
    const t = setup();
    await expectError(
      t.mutation(api.netWorth.createAsset, ASSET),
      "UNAUTHENTICATED",
    );
  });

  it("rejects an amount that is not a positive integer of cents", async () => {
    const t = setup();
    const ana = await asUser(t, "Ana");

    for (const amountCents of [0, -100, 12.5]) {
      await expectError(
        ana.mutation(api.netWorth.createAsset, { ...ASSET, amountCents }),
        "INVALID_AMOUNT",
        "L'import ha de ser més gran que zero.",
      );
    }
  });

  it("rejects a blank or too long asset name", async () => {
    const t = setup();
    const ana = await asUser(t, "Ana");

    await expectError(
      ana.mutation(api.netWorth.createAsset, { ...ASSET, name: "   " }),
      "INVALID_NAME",
      "El nom de l'actiu és obligatori.",
    );
    await expectError(
      ana.mutation(api.netWorth.createAsset, {
        ...ASSET,
        name: "a".repeat(MAX_LABEL_LENGTH + 1),
      }),
      "INVALID_NAME",
      "El nom de l'actiu és massa llarg.",
    );
  });

  it("updates and deletes an owned asset, and hides someone else's", async () => {
    const t = setup();
    const ana = await asUser(t, "Ana");
    const bert = await asUser(t, "Bert");
    const assetId = await ana.mutation(api.netWorth.createAsset, ASSET);

    await expectError(
      bert.mutation(api.netWorth.updateAsset, { ...ASSET, assetId, name: "Aliè" }),
      "NOT_FOUND",
      "No s'ha trobat aquest actiu.",
    );
    await expectError(
      bert.mutation(api.netWorth.removeAsset, { assetId }),
      "NOT_FOUND",
    );

    await ana.mutation(api.netWorth.updateAsset, {
      assetId,
      name: "Efectiu",
      type: "cash",
      amountCents: 2000,
    });
    const updated = await t.run((ctx) => ctx.db.get(assetId));
    expect(updated).toMatchObject({ name: "Efectiu", type: "cash", amountCents: 2000 });

    await ana.mutation(api.netWorth.removeAsset, { assetId });
    expect(await t.run((ctx) => ctx.db.get(assetId))).toBeNull();
  });

  it("creates a debt with an integer due date and trims the concept", async () => {
    const t = setup();
    const ana = await asUser(t, "Ana");

    const debtId = await ana.mutation(api.netWorth.createDebt, {
      concept: "  Hipoteca  ",
      amountCents: 25000000,
      dueDate: DUE_DATE,
    });

    const stored = await t.run((ctx) => ctx.db.get(debtId));
    expect(stored).toMatchObject({
      concept: "Hipoteca",
      amountCents: 25000000,
      dueDate: DUE_DATE,
    });
  });

  it("rejects a decimal or unrepresentable due date", async () => {
    const t = setup();
    const ana = await asUser(t, "Ana");
    const debt = { concept: "Hipoteca", amountCents: 1000 };

    await expectError(
      ana.mutation(api.netWorth.createDebt, { ...debt, dueDate: DUE_DATE + 0.5 }),
      "INVALID_DUE_DATE",
      "La data de venciment no és vàlida.",
    );
    await expectError(
      ana.mutation(api.netWorth.createDebt, { ...debt, dueDate: 8_640_000_000_000_001 }),
      "INVALID_DUE_DATE",
    );
  });

  it("rejects a blank or too long debt concept", async () => {
    const t = setup();
    const ana = await asUser(t, "Ana");
    const debt = { amountCents: 1000, dueDate: DUE_DATE };

    await expectError(
      ana.mutation(api.netWorth.createDebt, { ...debt, concept: "  " }),
      "INVALID_CONCEPT",
      "El concepte del deute és obligatori.",
    );
    await expectError(
      ana.mutation(api.netWorth.createDebt, {
        ...debt,
        concept: "a".repeat(MAX_LABEL_LENGTH + 1),
      }),
      "INVALID_CONCEPT",
      "El concepte del deute és massa llarg.",
    );
  });

  it("updates and deletes an owned debt, and hides someone else's", async () => {
    const t = setup();
    const ana = await asUser(t, "Ana");
    const bert = await asUser(t, "Bert");
    const debtId = await ana.mutation(api.netWorth.createDebt, {
      concept: "Hipoteca",
      amountCents: 1000,
      dueDate: DUE_DATE,
    });

    await expectError(
      bert.mutation(api.netWorth.updateDebt, {
        debtId,
        concept: "Aliè",
        amountCents: 1000,
        dueDate: DUE_DATE,
      }),
      "NOT_FOUND",
      "No s'ha trobat aquest deute.",
    );

    const nextDue = DUE_DATE + 86_400_000;
    await ana.mutation(api.netWorth.updateDebt, {
      debtId,
      concept: "Préstec",
      amountCents: 500,
      dueDate: nextDue,
    });
    const updated = await t.run((ctx) => ctx.db.get(debtId));
    expect(updated).toMatchObject({ concept: "Préstec", amountCents: 500, dueDate: nextDue });

    await ana.mutation(api.netWorth.removeDebt, { debtId });
    expect(await t.run((ctx) => ctx.db.get(debtId))).toBeNull();
  });
});

// #66 · Cases the tests above do not cover yet.

/** Ana with one asset and one debt, inserted directly so the setup does not depend on create*. */
async function setupAnaWithRecords() {
  const t = setup();
  const { userId, assetId, debtId } = await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", { name: "Ana" });
    const assetId = await ctx.db.insert("assets", { ...ASSET, userId });
    const debtId = await ctx.db.insert("debts", {
      userId,
      concept: "Hipoteca",
      amountCents: 1000,
      dueDate: DUE_DATE,
    });
    return { userId, assetId, debtId };
  });
  const ana = t.withIdentity({ subject: `${userId}|session` });
  return { t, ana, assetId, debtId };
}

function countRecords(t: TestConvex) {
  return t.run(async (ctx) => ({
    assets: (await ctx.db.query("assets").collect()).length,
    debts: (await ctx.db.query("debts").collect()).length,
  }));
}

describe("US3.2 · every function requires a session", () => {
  it("rejects a logged-out caller on list, create, update and remove, and changes nothing", async () => {
    const { t, assetId, debtId } = await setupAnaWithRecords();
    const debt = { concept: "Préstec", amountCents: 500, dueDate: DUE_DATE };

    await expectError(t.query(api.netWorth.list, {}), "UNAUTHENTICATED");
    await expectError(t.mutation(api.netWorth.createDebt, debt), "UNAUTHENTICATED");
    await expectError(
      t.mutation(api.netWorth.updateAsset, { ...ASSET, assetId, name: "Canviat" }),
      "UNAUTHENTICATED",
    );
    await expectError(
      t.mutation(api.netWorth.updateDebt, { ...debt, debtId }),
      "UNAUTHENTICATED",
    );
    await expectError(t.mutation(api.netWorth.removeAsset, { assetId }), "UNAUTHENTICATED");
    await expectError(t.mutation(api.netWorth.removeDebt, { debtId }), "UNAUTHENTICATED");

    expect(await countRecords(t)).toEqual({ assets: 1, debts: 1 });
    expect(await t.run((ctx) => ctx.db.get(assetId))).toMatchObject(ASSET);
    expect(await t.run((ctx) => ctx.db.get(debtId))).toMatchObject({ concept: "Hipoteca" });
  });
});

describe("US3.2 · other users' records stay untouched", () => {
  it("does not let another user delete a debt", async () => {
    const { t, debtId } = await setupAnaWithRecords();
    const bert = await asUser(t, "Bert");

    await expectError(
      bert.mutation(api.netWorth.removeDebt, { debtId }),
      "NOT_FOUND",
      "No s'ha trobat aquest deute.",
    );
    expect(await t.run((ctx) => ctx.db.get(debtId))).not.toBeNull();
  });

  it("leaves the asset and the debt unchanged after another user's failed edit", async () => {
    const { t, assetId, debtId } = await setupAnaWithRecords();
    const bert = await asUser(t, "Bert");

    await expectError(
      bert.mutation(api.netWorth.updateAsset, { ...ASSET, assetId, amountCents: 1 }),
      "NOT_FOUND",
    );
    await expectError(
      bert.mutation(api.netWorth.updateDebt, {
        debtId,
        concept: "Aliè",
        amountCents: 1,
        dueDate: DUE_DATE,
      }),
      "NOT_FOUND",
    );
    await expectError(bert.mutation(api.netWorth.removeAsset, { assetId }), "NOT_FOUND");

    expect(await t.run((ctx) => ctx.db.get(assetId))).toMatchObject(ASSET);
    expect(await t.run((ctx) => ctx.db.get(debtId))).toMatchObject({
      concept: "Hipoteca",
      amountCents: 1000,
    });
  });

  it("does not show another user's records in their list", async () => {
    const { t } = await setupAnaWithRecords();
    const bert = await asUser(t, "Bert");

    expect(await bert.query(api.netWorth.list, {})).toEqual({ assets: [], debts: [] });
  });
});

describe("US3.2 AC3 · editing validates like creating", () => {
  it("rejects an invalid asset edit and keeps the stored values", async () => {
    const { t, ana, assetId } = await setupAnaWithRecords();

    await expectError(
      ana.mutation(api.netWorth.updateAsset, { ...ASSET, assetId, amountCents: 0 }),
      "INVALID_AMOUNT",
    );
    await expectError(
      ana.mutation(api.netWorth.updateAsset, { ...ASSET, assetId, name: "   " }),
      "INVALID_NAME",
    );
    await expectError(
      ana.mutation(api.netWorth.updateAsset, {
        ...ASSET,
        assetId,
        name: "a".repeat(MAX_LABEL_LENGTH + 1),
      }),
      "INVALID_NAME",
    );

    expect(await t.run((ctx) => ctx.db.get(assetId))).toMatchObject(ASSET);
  });

  it("rejects an invalid debt edit and keeps the stored values", async () => {
    const { t, ana, debtId } = await setupAnaWithRecords();
    const valid = { debtId, concept: "Hipoteca", amountCents: 1000, dueDate: DUE_DATE };

    await expectError(
      ana.mutation(api.netWorth.updateDebt, { ...valid, amountCents: -5 }),
      "INVALID_AMOUNT",
    );
    await expectError(
      ana.mutation(api.netWorth.updateDebt, { ...valid, concept: "" }),
      "INVALID_CONCEPT",
    );
    await expectError(
      ana.mutation(api.netWorth.updateDebt, { ...valid, dueDate: 1.5 }),
      "INVALID_DUE_DATE",
    );

    expect(await t.run((ctx) => ctx.db.get(debtId))).toMatchObject({
      concept: "Hipoteca",
      amountCents: 1000,
      dueDate: DUE_DATE,
    });
  });

  it("trims the name and the concept when editing", async () => {
    const { t, ana, assetId, debtId } = await setupAnaWithRecords();

    await ana.mutation(api.netWorth.updateAsset, { ...ASSET, assetId, name: "  Efectiu  " });
    await ana.mutation(api.netWorth.updateDebt, {
      debtId,
      concept: "  Préstec  ",
      amountCents: 1000,
      dueDate: DUE_DATE,
    });

    expect(await t.run((ctx) => ctx.db.get(assetId))).toMatchObject({ name: "Efectiu" });
    expect(await t.run((ctx) => ctx.db.get(debtId))).toMatchObject({ concept: "Préstec" });
  });
});

describe("US3.2 · records that no longer exist", () => {
  it("returns NOT_FOUND when editing or deleting an asset that was already deleted", async () => {
    const { ana, assetId } = await setupAnaWithRecords();
    await ana.mutation(api.netWorth.removeAsset, { assetId });

    await expectError(
      ana.mutation(api.netWorth.updateAsset, { ...ASSET, assetId }),
      "NOT_FOUND",
    );
    await expectError(ana.mutation(api.netWorth.removeAsset, { assetId }), "NOT_FOUND");
  });

  it("returns NOT_FOUND when editing or deleting a debt that was already deleted", async () => {
    const { ana, debtId } = await setupAnaWithRecords();
    await ana.mutation(api.netWorth.removeDebt, { debtId });

    await expectError(
      ana.mutation(api.netWorth.updateDebt, {
        debtId,
        concept: "Hipoteca",
        amountCents: 1000,
        dueDate: DUE_DATE,
      }),
      "NOT_FOUND",
    );
    await expectError(ana.mutation(api.netWorth.removeDebt, { debtId }), "NOT_FOUND");
  });
});

describe("US3.2 · list", () => {
  it("returns the debts sorted by due date, the closest first", async () => {
    const t = setup();
    const ana = await asUser(t, "Ana");
    const day = 86_400_000;
    // Created out of order on purpose: the order must come from the due date.
    for (const [concept, dueDate] of [
      ["Cotxe", DUE_DATE + 2 * day],
      ["Mòbil", DUE_DATE],
      ["Hipoteca", DUE_DATE + 30 * day],
    ] as const) {
      await ana.mutation(api.netWorth.createDebt, { concept, amountCents: 1000, dueDate });
    }

    const { debts } = await ana.query(api.netWorth.list, {});

    expect(debts.map((debt) => debt.concept)).toEqual(["Mòbil", "Cotxe", "Hipoteca"]);
  });

  it("returns empty lists for a user without assets or debts", async () => {
    const t = setup();
    const ana = await asUser(t, "Ana");

    expect(await ana.query(api.netWorth.list, {})).toEqual({ assets: [], debts: [] });
  });
});
