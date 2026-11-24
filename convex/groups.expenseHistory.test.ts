/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";

// US4.2 · History of a group's expenses (only members, most recent first).

const modules = import.meta.glob("./**/!(*.*.*)*.*s");

function setup() {
  return convexTest(schema, modules);
}

type TestConvex = ReturnType<typeof setup>;

async function asUser(t: TestConvex, name: string) {
  const userId = await t.run((ctx) => ctx.db.insert("users", { name }));
  return { userId, client: t.withIdentity({ subject: `${userId}|session` }) };
}

async function createGroup(t: TestConvex, owner: Awaited<ReturnType<typeof asUser>>, name: string) {
  const groupId = await owner.client.mutation(api.groups.create, { name });
  const code = (await t.run((ctx) => ctx.db.get(groupId)))?.code ?? "";
  return { groupId, code };
}

function addExpense(
  client: Awaited<ReturnType<typeof asUser>>["client"],
  groupId: Id<"groups">,
  concept: string,
  paidBy: Id<"users">,
  participants: Id<"users">[],
) {
  return client.mutation(api.groups.createExpense, {
    groupId,
    concept,
    amountCents: 1200,
    paidBy,
    split: { mode: "equal", participants },
  });
}

describe("US4.2 · groups.listExpenses", () => {
  it("lists the group's expenses, most recent first, with what each row shows", async () => {
    const t = setup();
    const ana = await asUser(t, "Ana");
    const bert = await asUser(t, "Bert");
    const { groupId, code } = await createGroup(t, ana, "Viatge a Roma");
    await bert.client.mutation(api.groups.join, { code });

    const firstId = await addExpense(ana.client, groupId, "Hotel", ana.userId, [ana.userId, bert.userId]);
    const secondId = await addExpense(bert.client, groupId, "Sopar", bert.userId, [ana.userId]);

    const history = await bert.client.query(api.groups.listExpenses, { groupId });
    expect(history).toEqual([
      {
        _id: secondId,
        _creationTime: expect.any(Number) as number,
        concept: "Sopar",
        amountCents: 1200,
        paidBy: bert.userId,
        paidByName: "Bert",
        participantCount: 1,
      },
      {
        _id: firstId,
        _creationTime: expect.any(Number) as number,
        concept: "Hotel",
        amountCents: 1200,
        paidBy: ana.userId,
        paidByName: "Ana",
        participantCount: 2,
      },
    ]);
    expect(history?.[0]._creationTime).toBeGreaterThanOrEqual(history?.[1]._creationTime ?? 0);
  });

  it("does not mix expenses of other groups", async () => {
    const t = setup();
    const ana = await asUser(t, "Ana");
    const trip = await createGroup(t, ana, "Viatge a Roma");
    const flat = await createGroup(t, ana, "Pis");
    await addExpense(ana.client, trip.groupId, "Hotel", ana.userId, [ana.userId]);
    await addExpense(ana.client, flat.groupId, "Llum", ana.userId, [ana.userId]);

    const history = await ana.client.query(api.groups.listExpenses, { groupId: flat.groupId });
    expect(history?.map((expense) => expense.concept)).toEqual(["Llum"]);
  });

  it("returns an empty list when the group has no expenses", async () => {
    const t = setup();
    const ana = await asUser(t, "Ana");
    const { groupId } = await createGroup(t, ana, "Pis");

    expect(await ana.client.query(api.groups.listExpenses, { groupId })).toEqual([]);
  });

  it("returns null to a non-member and for a malformed id", async () => {
    const t = setup();
    const ana = await asUser(t, "Ana");
    const dani = await asUser(t, "Dani");
    const { groupId } = await createGroup(t, ana, "Pis");
    await addExpense(ana.client, groupId, "Llum", ana.userId, [ana.userId]);

    expect(await dani.client.query(api.groups.listExpenses, { groupId })).toBeNull();
    expect(await ana.client.query(api.groups.listExpenses, { groupId: "not-an-id" })).toBeNull();
  });

  it("requires a signed-in user", async () => {
    const t = setup();
    const ana = await asUser(t, "Ana");
    const { groupId } = await createGroup(t, ana, "Pis");

    const error: unknown = await t.query(api.groups.listExpenses, { groupId }).then(
      () => expect.fail("Expected UNAUTHENTICATED"),
      (rejection: unknown) => rejection,
    );
    expect(error).toBeInstanceOf(ConvexError);
    const data: unknown = (error as { data: unknown }).data;
    const parsed: unknown = typeof data === "string" ? JSON.parse(data) : data;
    expect(parsed).toMatchObject({ code: "UNAUTHENTICATED" });
  });
});
