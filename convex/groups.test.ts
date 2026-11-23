/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { MAX_GROUP_DESCRIPTION_LENGTH, MAX_GROUP_NAME_LENGTH } from "./groups";
import { INVALID_GROUP_CODE_MESSAGE, isValidGroupCode } from "./lib/groupCodes";
import schema from "./schema";

// US4.1 · Create a group and join it with its invite code.

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

function getGroup(t: TestConvex, groupId: Id<"groups">) {
  return t.run((ctx) => ctx.db.get(groupId));
}

function getMembers(t: TestConvex, groupId: Id<"groups">) {
  return t.run((ctx) =>
    ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) => q.eq("groupId", groupId))
      .collect(),
  );
}

describe("US4.1 · groups.create", () => {
  it("creates the group with a valid code and the creator as owner", async () => {
    const t = setup();
    const ana = await asUser(t, "Ana");

    const groupId = await ana.client.mutation(api.groups.create, {
      name: "Viatge a Roma",
      description: "Agost 2026",
    });

    const group = await getGroup(t, groupId);
    expect(group).toMatchObject({ name: "Viatge a Roma", description: "Agost 2026" });
    expect(isValidGroupCode(group?.code ?? "")).toBe(true);

    const members = await getMembers(t, groupId);
    expect(members).toHaveLength(1);
    expect(members[0]).toMatchObject({ userId: ana.userId, role: "owner" });
  });

  it("trims the name and description, and stores a missing description as empty", async () => {
    const t = setup();
    const ana = await asUser(t, "Ana");

    const withSpaces = await ana.client.mutation(api.groups.create, {
      name: "  Pis  ",
      description: "  Despeses del pis  ",
    });
    const withoutDescription = await ana.client.mutation(api.groups.create, { name: "Sopars" });
    const blankDescription = await ana.client.mutation(api.groups.create, {
      name: "Futbol",
      description: "   ",
    });

    expect(await getGroup(t, withSpaces)).toMatchObject({
      name: "Pis",
      description: "Despeses del pis",
    });
    expect((await getGroup(t, withoutDescription))?.description).toBe("");
    expect((await getGroup(t, blankDescription))?.description).toBe("");
  });

  it("gives each group a different code", async () => {
    const t = setup();
    const ana = await asUser(t, "Ana");

    const codes = new Set<string>();
    for (let index = 0; index < 20; index += 1) {
      const groupId = await ana.client.mutation(api.groups.create, { name: `Grup ${index}` });
      codes.add((await getGroup(t, groupId))?.code ?? "");
    }
    expect(codes.size).toBe(20);
  });

  it("accepts a name of exactly 80 and a description of exactly 200 characters", async () => {
    const t = setup();
    const ana = await asUser(t, "Ana");

    const groupId = await ana.client.mutation(api.groups.create, {
      name: "a".repeat(MAX_GROUP_NAME_LENGTH),
      description: "b".repeat(MAX_GROUP_DESCRIPTION_LENGTH),
    });
    expect(await getGroup(t, groupId)).not.toBeNull();
  });

  it("rejects a blank name", async () => {
    const t = setup();
    const ana = await asUser(t, "Ana");

    await expectError(
      ana.client.mutation(api.groups.create, { name: "   " }),
      "INVALID_NAME",
      "El nom del grup és obligatori.",
    );
  });

  it("rejects a name longer than 80 characters", async () => {
    const t = setup();
    const ana = await asUser(t, "Ana");

    await expectError(
      ana.client.mutation(api.groups.create, { name: "a".repeat(MAX_GROUP_NAME_LENGTH + 1) }),
      "INVALID_NAME",
      "El nom del grup és massa llarg.",
    );
  });

  it("rejects a description longer than 200 characters", async () => {
    const t = setup();
    const ana = await asUser(t, "Ana");

    await expectError(
      ana.client.mutation(api.groups.create, {
        name: "Pis",
        description: "b".repeat(MAX_GROUP_DESCRIPTION_LENGTH + 1),
      }),
      "INVALID_DESCRIPTION",
      "La descripció és massa llarga.",
    );
  });

  it("does not save anything when the data is invalid", async () => {
    const t = setup();
    const ana = await asUser(t, "Ana");

    await expectError(ana.client.mutation(api.groups.create, { name: "" }), "INVALID_NAME");
    const counts = await t.run(async (ctx) => ({
      groups: (await ctx.db.query("groups").collect()).length,
      members: (await ctx.db.query("groupMembers").collect()).length,
    }));
    expect(counts).toEqual({ groups: 0, members: 0 });
  });

  it("requires a signed-in user", async () => {
    const t = setup();

    await expectError(t.mutation(api.groups.create, { name: "Pis" }), "UNAUTHENTICATED");
  });
});

describe("US4.1 · groups.join", () => {
  async function createGroup(t: TestConvex) {
    const ana = await asUser(t, "Ana");
    const groupId = await ana.client.mutation(api.groups.create, { name: "Viatge a Roma" });
    const code = (await getGroup(t, groupId))?.code ?? "";
    return { ana, groupId, code };
  }

  it("adds the signed-in user as a member", async () => {
    const t = setup();
    const { ana, groupId, code } = await createGroup(t);
    const bert = await asUser(t, "Bert");

    const result = await bert.client.mutation(api.groups.join, { code });

    expect(result).toEqual({ groupId, alreadyMember: false });
    const members = await getMembers(t, groupId);
    expect(members.map(({ userId, role }) => ({ userId, role }))).toEqual(
      expect.arrayContaining([
        { userId: ana.userId, role: "owner" },
        { userId: bert.userId, role: "member" },
      ]),
    );
    expect(members).toHaveLength(2);
  });

  it("accepts the code in lowercase and with surrounding spaces", async () => {
    const t = setup();
    const { groupId, code } = await createGroup(t);
    const bert = await asUser(t, "Bert");

    const result = await bert.client.mutation(api.groups.join, {
      code: `  ${code.toLowerCase()} `,
    });

    expect(result.groupId).toBe(groupId);
  });

  it("does not add a second membership when the user already belongs to the group", async () => {
    const t = setup();
    const { ana, groupId, code } = await createGroup(t);
    const bert = await asUser(t, "Bert");
    await bert.client.mutation(api.groups.join, { code });

    expect(await bert.client.mutation(api.groups.join, { code })).toEqual({
      groupId,
      alreadyMember: true,
    });
    expect(await ana.client.mutation(api.groups.join, { code })).toEqual({
      groupId,
      alreadyMember: true,
    });

    const members = await getMembers(t, groupId);
    expect(members).toHaveLength(2);
    expect(members.find((member) => member.userId === ana.userId)?.role).toBe("owner");
  });

  it.each(["", "K7M2Q", "K7M2QXA", "K7M2Q0", "K7-M2Q"])(
    "rejects the badly formed code %j",
    async (code) => {
      const t = setup();
      const bert = await asUser(t, "Bert");

      await expectError(
        bert.client.mutation(api.groups.join, { code }),
        "INVALID_CODE",
        INVALID_GROUP_CODE_MESSAGE,
      );
    },
  );

  it("rejects a well-formed code that no group uses, with the same message", async () => {
    const t = setup();
    const { code } = await createGroup(t);
    const bert = await asUser(t, "Bert");
    const unusedCode = code === "ZZZZZZ" ? "YYYYYY" : "ZZZZZZ";

    await expectError(
      bert.client.mutation(api.groups.join, { code: unusedCode }),
      "INVALID_CODE",
      INVALID_GROUP_CODE_MESSAGE,
    );
  });

  it("requires a signed-in user", async () => {
    const t = setup();
    const { code } = await createGroup(t);

    await expectError(t.mutation(api.groups.join, { code }), "UNAUTHENTICATED");
  });
});
