/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "./schema";

// US4.1 · Schema of groups and their members: the tables and indexes the
// create, join and list functions will rely on.

const modules = import.meta.glob("./**/!(*.*.*)*.*s");

function setup() {
  return convexTest(schema, modules);
}

const TRIP = { name: "Viatge a Roma", description: "", code: "K7M2QX" };

describe("US4.1 · groups and groupMembers schema", () => {
  it("stores a group with an empty description", async () => {
    const t = setup();
    const group = await t.run(async (ctx) => {
      const groupId = await ctx.db.insert("groups", TRIP);
      return ctx.db.get(groupId);
    });
    expect(group).toMatchObject(TRIP);
  });

  it("finds a group by its invite code", async () => {
    const t = setup();
    const found = await t.run(async (ctx) => {
      await ctx.db.insert("groups", TRIP);
      await ctx.db.insert("groups", { name: "Pis", description: "Despeses del pis", code: "P9ZT4W" });
      return ctx.db
        .query("groups")
        .withIndex("by_code", (q) => q.eq("code", "K7M2QX"))
        .unique();
    });
    expect(found?.name).toBe("Viatge a Roma");
  });

  it("lists the members of a group and checks one membership", async () => {
    const t = setup();
    const { members, aliceMembership } = await t.run(async (ctx) => {
      const alice = await ctx.db.insert("users", { name: "Alice" });
      const bob = await ctx.db.insert("users", { name: "Bob" });
      const groupId = await ctx.db.insert("groups", TRIP);
      const otherGroupId = await ctx.db.insert("groups", { ...TRIP, code: "P9ZT4W" });
      await ctx.db.insert("groupMembers", { groupId, userId: alice, role: "owner" });
      await ctx.db.insert("groupMembers", { groupId, userId: bob, role: "member" });
      await ctx.db.insert("groupMembers", { groupId: otherGroupId, userId: bob, role: "owner" });

      return {
        members: await ctx.db
          .query("groupMembers")
          .withIndex("by_group_and_user", (q) => q.eq("groupId", groupId))
          .collect(),
        aliceMembership: await ctx.db
          .query("groupMembers")
          .withIndex("by_group_and_user", (q) => q.eq("groupId", groupId).eq("userId", alice))
          .unique(),
      };
    });
    expect(members.map((member) => member.role).sort()).toEqual(["member", "owner"]);
    expect(aliceMembership?.role).toBe("owner");
  });

  it("lists the groups of a user", async () => {
    const t = setup();
    const groupNames = await t.run(async (ctx) => {
      const bob = await ctx.db.insert("users", { name: "Bob" });
      const carol = await ctx.db.insert("users", { name: "Carol" });
      const trip = await ctx.db.insert("groups", TRIP);
      const flat = await ctx.db.insert("groups", { name: "Pis", description: "", code: "P9ZT4W" });
      await ctx.db.insert("groupMembers", { groupId: trip, userId: bob, role: "member" });
      await ctx.db.insert("groupMembers", { groupId: flat, userId: bob, role: "owner" });
      await ctx.db.insert("groupMembers", { groupId: flat, userId: carol, role: "member" });

      const memberships = await ctx.db
        .query("groupMembers")
        .withIndex("by_user", (q) => q.eq("userId", bob))
        .collect();
      const groups = await Promise.all(memberships.map((m) => ctx.db.get(m.groupId)));
      return groups.map((group) => group?.name).sort();
    });
    expect(groupNames).toEqual(["Pis", "Viatge a Roma"]);
  });

  it("rejects a role that is not owner or member", async () => {
    const t = setup();
    await expect(
      t.run(async (ctx) => {
        const userId = await ctx.db.insert("users", { name: "Alice" });
        const groupId = await ctx.db.insert("groups", TRIP);
        await ctx.db.insert("groupMembers", {
          groupId,
          userId,
          // @ts-expect-error: the schema only allows "owner" or "member".
          role: "admin",
        });
      }),
    ).rejects.toThrow();
  });
});
