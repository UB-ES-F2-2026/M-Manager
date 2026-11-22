/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import { GROUP_NOT_FOUND_MESSAGE, TRANSFER_NOT_PENDING_MESSAGE } from "./groups";
import schema from "./schema";

// US4.3 · «Saldar deute»: record a settlement for a suggested transfer.

const modules = import.meta.glob("./**/!(*.*.*)*.*s");

function setup() {
  return convexTest(schema, modules);
}

type TestConvex = ReturnType<typeof setup>;

async function asUser(t: TestConvex, name: string) {
  const userId = await t.run((ctx) => ctx.db.insert("users", { name }));
  return { userId, client: t.withIdentity({ subject: `${userId}|session` }) };
}

async function expectError(promise: Promise<unknown>, code: string, message?: string) {
  const error: unknown = await promise.then(
    () => expect.fail(`Expected ${code}`),
    (rejection: unknown) => rejection,
  );
  expect(error).toBeInstanceOf(ConvexError);
  const data: unknown = (error as { data: unknown }).data;
  const parsed: unknown = typeof data === "string" ? JSON.parse(data) : data;
  expect(parsed).toMatchObject(message === undefined ? { code } : { code, message });
}

/**
 * Ana pays 900 split equally among Ana, Bert and Carla, so «Per saldar» is
 * Bert → Ana 300 and Carla → Ana 300. Dani is not a member.
 */
async function seedDebts(t: TestConvex) {
  const ana = await asUser(t, "Ana");
  const bert = await asUser(t, "Bert");
  const carla = await asUser(t, "Carla");
  const dani = await asUser(t, "Dani");
  const groupId = await ana.client.mutation(api.groups.create, { name: "Viatge a Roma" });
  const code = (await t.run((ctx) => ctx.db.get(groupId)))?.code ?? "";
  await bert.client.mutation(api.groups.join, { code });
  await carla.client.mutation(api.groups.join, { code });
  await ana.client.mutation(api.groups.createExpense, {
    groupId,
    concept: "Hotel",
    amountCents: 900,
    paidBy: ana.userId,
    split: { mode: "equal", participants: [ana.userId, bert.userId, carla.userId] },
  });
  const bertPaysAna = { groupId, fromUserId: bert.userId, toUserId: ana.userId, amountCents: 300 };
  return { ana, bert, carla, dani, groupId, bertPaysAna };
}

function getSettlements(t: TestConvex) {
  return t.run((ctx) => ctx.db.query("groupSettlements").collect());
}

describe("US4.3 · groups.settleDebt", () => {
  it("records the settlement and leaves that transfer at zero", async () => {
    const t = setup();
    const { ana, bert, carla, groupId, bertPaysAna } = await seedDebts(t);

    const settlementId = await bert.client.mutation(api.groups.settleDebt, bertPaysAna);

    expect(await t.run((ctx) => ctx.db.get(settlementId))).toMatchObject({
      groupId,
      fromUserId: bert.userId,
      toUserId: ana.userId,
      amountCents: 300,
      recordedBy: bert.userId,
    });
    const result = await ana.client.query(api.groups.getBalances, { groupId });
    expect(result?.balances.find((row) => row.userId === bert.userId)?.balanceCents).toBe(0);
    expect(result?.transfers).toEqual([
      expect.objectContaining({ fromUserId: carla.userId, toUserId: ana.userId, amountCents: 300 }),
    ]);
  });

  it("can be done by any member, not only the debtor, and keeps who recorded it", async () => {
    const t = setup();
    const { carla, bertPaysAna } = await seedDebts(t);

    const settlementId = await carla.client.mutation(api.groups.settleDebt, bertPaysAna);

    expect((await t.run((ctx) => ctx.db.get(settlementId)))?.recordedBy).toBe(carla.userId);
  });

  it("does not delete or change any expense", async () => {
    const t = setup();
    const { ana, bert, carla, groupId, bertPaysAna } = await seedDebts(t);
    const before = await t.run((ctx) => ctx.db.query("groupExpenses").collect());

    await bert.client.mutation(api.groups.settleDebt, bertPaysAna);
    await carla.client.mutation(api.groups.settleDebt, {
      groupId,
      fromUserId: carla.userId,
      toUserId: ana.userId,
      amountCents: 300,
    });

    expect(await t.run((ctx) => ctx.db.query("groupExpenses").collect())).toEqual(before);
    const result = await ana.client.query(api.groups.getBalances, { groupId });
    expect(result?.transfers).toEqual([]);
    expect(result?.balances.every((row) => row.balanceCents === 0)).toBe(true);
  });

  it("does not settle the same transfer twice", async () => {
    const t = setup();
    const { ana, bert, bertPaysAna } = await seedDebts(t);
    await bert.client.mutation(api.groups.settleDebt, bertPaysAna);

    await expectError(
      ana.client.mutation(api.groups.settleDebt, bertPaysAna),
      "TRANSFER_NOT_PENDING",
      TRANSFER_NOT_PENDING_MESSAGE,
    );
    expect(await getSettlements(t)).toHaveLength(1);
  });

  it("only settles a suggested transfer, with exactly its amount", async () => {
    const t = setup();
    const { ana, bert, carla, bertPaysAna } = await seedDebts(t);
    const notSuggested = [
      { ...bertPaysAna, amountCents: 100 },
      { ...bertPaysAna, amountCents: 301 },
      { ...bertPaysAna, fromUserId: ana.userId, toUserId: bert.userId },
      { ...bertPaysAna, toUserId: carla.userId },
      { ...bertPaysAna, toUserId: bert.userId },
    ];

    for (const transfer of notSuggested) {
      await expectError(
        bert.client.mutation(api.groups.settleDebt, transfer),
        "TRANSFER_NOT_PENDING",
        TRANSFER_NOT_PENDING_MESSAGE,
      );
    }
    expect(await getSettlements(t)).toEqual([]);
  });

  it("rejects an amount that is not a positive integer of cents", async () => {
    const t = setup();
    const { bert, bertPaysAna } = await seedDebts(t);

    for (const amountCents of [0, -300, 299.5]) {
      await expectError(
        bert.client.mutation(api.groups.settleDebt, { ...bertPaysAna, amountCents }),
        "INVALID_AMOUNT",
      );
    }
  });

  it("answers NOT_FOUND to a non-member and for a malformed id", async () => {
    const t = setup();
    const { dani, bert, bertPaysAna } = await seedDebts(t);

    await expectError(
      dani.client.mutation(api.groups.settleDebt, bertPaysAna),
      "NOT_FOUND",
      GROUP_NOT_FOUND_MESSAGE,
    );
    await expectError(
      bert.client.mutation(api.groups.settleDebt, { ...bertPaysAna, groupId: "not-an-id" }),
      "NOT_FOUND",
      GROUP_NOT_FOUND_MESSAGE,
    );
    expect(await getSettlements(t)).toEqual([]);
  });

  it("requires a signed-in user", async () => {
    const t = setup();
    const { bertPaysAna } = await seedDebts(t);

    await expectError(t.mutation(api.groups.settleDebt, bertPaysAna), "UNAUTHENTICATED");
  });
});
