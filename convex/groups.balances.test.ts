/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";

// US4.3 · «Balanços» and «Per saldar» of a group.

const modules = import.meta.glob("./**/!(*.*.*)*.*s");

function setup() {
  return convexTest(schema, modules);
}

type TestConvex = ReturnType<typeof setup>;
type User = Awaited<ReturnType<typeof asUser>>;

async function asUser(t: TestConvex, name: string) {
  const userId = await t.run((ctx) => ctx.db.insert("users", { name }));
  return { userId, client: t.withIdentity({ subject: `${userId}|session` }) };
}

/** Ana creates the group and Bert and Carla join it. */
async function seedGroup(t: TestConvex) {
  const ana = await asUser(t, "Ana");
  const bert = await asUser(t, "Bert");
  const carla = await asUser(t, "Carla");
  const groupId = await ana.client.mutation(api.groups.create, { name: "Viatge a Roma" });
  const code = (await t.run((ctx) => ctx.db.get(groupId)))?.code ?? "";
  await bert.client.mutation(api.groups.join, { code });
  await carla.client.mutation(api.groups.join, { code });
  return { ana, bert, carla, groupId };
}

function addEqualExpense(
  by: User,
  groupId: Id<"groups">,
  amountCents: number,
  participants: Id<"users">[],
) {
  return by.client.mutation(api.groups.createExpense, {
    groupId,
    concept: "Despesa",
    amountCents,
    paidBy: by.userId,
    split: { mode: "equal", participants },
  });
}

function balanceOf(
  result: { balances: { userId: Id<"users">; balanceCents: number }[] } | null,
  userId: Id<"users">,
) {
  return result?.balances.find((row) => row.userId === userId)?.balanceCents;
}

describe("US4.3 · groups.getBalances", () => {
  it("shows everyone «En pau» and no transfers when there are no expenses", async () => {
    const t = setup();
    const { ana, bert, carla, groupId } = await seedGroup(t);

    expect(await bert.client.query(api.groups.getBalances, { groupId })).toEqual({
      balances: [
        { userId: ana.userId, name: "Ana", balanceCents: 0 },
        { userId: bert.userId, name: "Bert", balanceCents: 0 },
        { userId: carla.userId, name: "Carla", balanceCents: 0 },
      ],
      transfers: [],
    });
  });

  it("computes one balance per member and the suggested transfers with names", async () => {
    const t = setup();
    const { ana, bert, carla, groupId } = await seedGroup(t);
    await addEqualExpense(ana, groupId, 900, [ana.userId, bert.userId, carla.userId]);

    const result = await carla.client.query(api.groups.getBalances, { groupId });

    expect(balanceOf(result, ana.userId)).toBe(600);
    expect(balanceOf(result, bert.userId)).toBe(-300);
    expect(balanceOf(result, carla.userId)).toBe(-300);
    expect(result?.transfers).toHaveLength(2);
    expect(result?.transfers).toEqual(
      expect.arrayContaining([
        {
          fromUserId: bert.userId,
          fromName: "Bert",
          toUserId: ana.userId,
          toName: "Ana",
          amountCents: 300,
        },
        {
          fromUserId: carla.userId,
          fromName: "Carla",
          toUserId: ana.userId,
          toName: "Ana",
          amountCents: 300,
        },
      ]),
    );
  });

  it("nets expenses paid by different members", async () => {
    const t = setup();
    const { ana, bert, groupId } = await seedGroup(t);
    await addEqualExpense(ana, groupId, 1000, [ana.userId, bert.userId]);
    await addEqualExpense(bert, groupId, 400, [ana.userId, bert.userId]);

    const result = await ana.client.query(api.groups.getBalances, { groupId });

    expect(balanceOf(result, ana.userId)).toBe(300);
    expect(balanceOf(result, bert.userId)).toBe(-300);
    expect(result?.transfers).toEqual([
      expect.objectContaining({ fromUserId: bert.userId, toUserId: ana.userId, amountCents: 300 }),
    ]);
  });

  it("counts the settlements: a settled transfer disappears without deleting expenses", async () => {
    const t = setup();
    const { ana, bert, carla, groupId } = await seedGroup(t);
    await addEqualExpense(ana, groupId, 900, [ana.userId, bert.userId, carla.userId]);
    await t.run((ctx) =>
      ctx.db.insert("groupSettlements", {
        groupId,
        fromUserId: bert.userId,
        toUserId: ana.userId,
        amountCents: 300,
        recordedBy: carla.userId,
      }),
    );

    const result = await ana.client.query(api.groups.getBalances, { groupId });

    expect(balanceOf(result, ana.userId)).toBe(300);
    expect(balanceOf(result, bert.userId)).toBe(0);
    expect(balanceOf(result, carla.userId)).toBe(-300);
    expect(result?.transfers).toEqual([
      expect.objectContaining({ fromUserId: carla.userId, toUserId: ana.userId, amountCents: 300 }),
    ]);
    expect(await t.run((ctx) => ctx.db.query("groupExpenses").collect())).toHaveLength(1);
  });

  it("ignores expenses and settlements of other groups", async () => {
    const t = setup();
    const { ana, bert, groupId } = await seedGroup(t);
    const otherGroupId = await ana.client.mutation(api.groups.create, { name: "Pis" });
    await addEqualExpense(ana, otherGroupId, 1000, [ana.userId]);

    const result = await bert.client.query(api.groups.getBalances, { groupId });
    expect(result?.balances.every((row) => row.balanceCents === 0)).toBe(true);
  });

  it("returns null to a non-member and for a malformed id", async () => {
    const t = setup();
    const { groupId } = await seedGroup(t);
    const dani = await asUser(t, "Dani");

    expect(await dani.client.query(api.groups.getBalances, { groupId })).toBeNull();
    expect(await dani.client.query(api.groups.getBalances, { groupId: "not-an-id" })).toBeNull();
  });

  it("requires a signed-in user", async () => {
    const t = setup();
    const { groupId } = await seedGroup(t);

    const error: unknown = await t.query(api.groups.getBalances, { groupId }).then(
      () => expect.fail("Expected UNAUTHENTICATED"),
      (rejection: unknown) => rejection,
    );
    expect(error).toBeInstanceOf(ConvexError);
    const data: unknown = (error as { data: unknown }).data;
    const parsed: unknown = typeof data === "string" ? JSON.parse(data) : data;
    expect(parsed).toMatchObject({ code: "UNAUTHENTICATED" });
  });
});
