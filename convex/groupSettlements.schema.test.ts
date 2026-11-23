/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "./schema";

// US4.3 · Schema of settlements: payments between two members of a group
// that the balances and the «Saldar deute» mutation rely on.

const modules = import.meta.glob("./**/!(*.*.*)*.*s");

function setup() {
  return convexTest(schema, modules);
}

type TestConvex = ReturnType<typeof setup>;

async function seed(t: TestConvex) {
  return t.run(async (ctx) => {
    const ana = await ctx.db.insert("users", { name: "Ana" });
    const bert = await ctx.db.insert("users", { name: "Bert" });
    const carla = await ctx.db.insert("users", { name: "Carla" });
    const trip = await ctx.db.insert("groups", { name: "Viatge", description: "", code: "K7M2QX" });
    const flat = await ctx.db.insert("groups", { name: "Pis", description: "", code: "P9ZT4W" });
    return { ana, bert, carla, trip, flat };
  });
}

describe("US4.3 · groupSettlements schema", () => {
  it("stores who paid whom, how much and who recorded it", async () => {
    const t = setup();
    const { ana, bert, carla, trip } = await seed(t);
    const settlement = {
      groupId: trip,
      fromUserId: bert,
      toUserId: ana,
      amountCents: 2500,
      recordedBy: carla,
    };

    const stored = await t.run(async (ctx) =>
      ctx.db.get(await ctx.db.insert("groupSettlements", settlement)),
    );

    expect(stored).toMatchObject(settlement);
  });

  it("lists only one group's settlements", async () => {
    const t = setup();
    const { ana, bert, trip, flat } = await seed(t);

    const amounts = await t.run(async (ctx) => {
      await ctx.db.insert("groupSettlements", {
        groupId: trip,
        fromUserId: bert,
        toUserId: ana,
        amountCents: 100,
        recordedBy: bert,
      });
      await ctx.db.insert("groupSettlements", {
        groupId: flat,
        fromUserId: ana,
        toUserId: bert,
        amountCents: 200,
        recordedBy: ana,
      });
      const settlements = await ctx.db
        .query("groupSettlements")
        .withIndex("by_group", (q) => q.eq("groupId", trip))
        .collect();
      return settlements.map((settlement) => settlement.amountCents);
    });

    expect(amounts).toEqual([100]);
  });

  it("rejects a settlement without who recorded it", async () => {
    const t = setup();
    const { ana, bert, trip } = await seed(t);

    await expect(
      t.run(async (ctx) => {
        // @ts-expect-error: recordedBy is required.
        await ctx.db.insert("groupSettlements", {
          groupId: trip,
          fromUserId: bert,
          toUserId: ana,
          amountCents: 100,
        });
      }),
    ).rejects.toThrow();
  });
});
