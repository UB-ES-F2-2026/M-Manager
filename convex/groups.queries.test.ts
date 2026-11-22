/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

// US4.1 · List my groups and see the detail of one (only members).

const modules = import.meta.glob("./**/!(*.*.*)*.*s");

function setup() {
  return convexTest(schema, modules);
}

type TestConvex = ReturnType<typeof setup>;

async function asUser(t: TestConvex, name: string) {
  const userId = await t.run((ctx) => ctx.db.insert("users", { name }));
  return { userId, client: t.withIdentity({ subject: `${userId}|session` }) };
}

async function expectUnauthenticated(promise: Promise<unknown>) {
  const error: unknown = await promise.then(
    () => expect.fail("Expected UNAUTHENTICATED"),
    (rejection: unknown) => rejection,
  );
  expect(error).toBeInstanceOf(ConvexError);
  const data: unknown = (error as { data: unknown }).data;
  const parsed: unknown = typeof data === "string" ? JSON.parse(data) : data;
  expect(parsed).toMatchObject({ code: "UNAUTHENTICATED" });
}

async function createAndShare(t: TestConvex) {
  const ana = await asUser(t, "Ana");
  const groupId = await ana.client.mutation(api.groups.create, {
    name: "Viatge a Roma",
    description: "Agost",
  });
  const group = await t.run((ctx) => ctx.db.get(groupId));
  return { ana, groupId, code: group?.code ?? "" };
}

describe("US4.1 · groups.listMine", () => {
  it("lists only the groups the user belongs to, sorted by name, with the user's role", async () => {
    const t = setup();
    const { ana, code } = await createAndShare(t);
    const bert = await asUser(t, "Bert");
    const carla = await asUser(t, "Carla");

    await bert.client.mutation(api.groups.create, { name: "Pis" });
    await bert.client.mutation(api.groups.join, { code });
    await carla.client.mutation(api.groups.create, { name: "Sopars" });

    const bertGroups = await bert.client.query(api.groups.listMine, {});
    expect(bertGroups.map(({ name, role }) => ({ name, role }))).toEqual([
      { name: "Pis", role: "owner" },
      { name: "Viatge a Roma", role: "member" },
    ]);
    expect(bertGroups[1]).toMatchObject({ description: "Agost" });

    const anaGroups = await ana.client.query(api.groups.listMine, {});
    expect(anaGroups.map((group) => group.name)).toEqual(["Viatge a Roma"]);
  });

  it("returns an empty list when the user has no groups", async () => {
    const t = setup();
    const bert = await asUser(t, "Bert");

    expect(await bert.client.query(api.groups.listMine, {})).toEqual([]);
  });

  it("does not expose the invite code in the list", async () => {
    const t = setup();
    const { ana } = await createAndShare(t);

    const [group] = await ana.client.query(api.groups.listMine, {});
    expect(group).not.toHaveProperty("code");
  });

  it("requires a signed-in user", async () => {
    const t = setup();

    await expectUnauthenticated(t.query(api.groups.listMine, {}));
  });
});

describe("US4.1 · groups.get", () => {
  it("shows the group, its code and the members, owner first", async () => {
    const t = setup();
    const { ana, groupId, code } = await createAndShare(t);
    const zoe = await asUser(t, "Zoe");
    const bert = await asUser(t, "Bert");
    await zoe.client.mutation(api.groups.join, { code });
    await bert.client.mutation(api.groups.join, { code });

    const detail = await bert.client.query(api.groups.get, { groupId });

    expect(detail).toMatchObject({
      _id: groupId,
      name: "Viatge a Roma",
      description: "Agost",
      code,
      myRole: "member",
    });
    expect(detail?.members).toEqual([
      { userId: ana.userId, name: "Ana", role: "owner" },
      { userId: bert.userId, name: "Bert", role: "member" },
      { userId: zoe.userId, name: "Zoe", role: "member" },
    ]);
  });

  it("tells the owner their role", async () => {
    const t = setup();
    const { ana, groupId } = await createAndShare(t);

    const detail = await ana.client.query(api.groups.get, { groupId });
    expect(detail?.myRole).toBe("owner");
  });

  it("returns null to a user who is not a member", async () => {
    const t = setup();
    const { groupId } = await createAndShare(t);
    const bert = await asUser(t, "Bert");

    expect(await bert.client.query(api.groups.get, { groupId })).toBeNull();
  });

  it("returns null for a malformed id and for a group that no longer exists", async () => {
    const t = setup();
    const { ana, groupId } = await createAndShare(t);

    expect(await ana.client.query(api.groups.get, { groupId: "not-an-id" })).toBeNull();

    await t.run(async (ctx) => {
      await ctx.db.delete(groupId);
    });
    expect(await ana.client.query(api.groups.get, { groupId })).toBeNull();
  });

  it("returns null for an id of another table", async () => {
    const t = setup();
    const { ana } = await createAndShare(t);

    expect(await ana.client.query(api.groups.get, { groupId: ana.userId })).toBeNull();
  });

  it("requires a signed-in user", async () => {
    const t = setup();
    const { groupId } = await createAndShare(t);

    await expectUnauthenticated(t.query(api.groups.get, { groupId }));
  });
});
