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
