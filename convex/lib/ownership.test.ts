/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import schema from "../schema";
import { requireOwnedDocument } from "./ownership";

const modules = import.meta.glob("../**/!(*.*.*)*.*s");

const NOT_FOUND_MESSAGE = "No s'ha trobat aquest moviment.";

function setup() {
  return convexTest(schema, modules);
}

/** Ana with one transaction, plus Biel, who owns nothing. */
async function setupUsers() {
  const t = setup();
  const ids = await t.run(async (ctx) => {
    const ana = await ctx.db.insert("users", { name: "Ana" });
    const biel = await ctx.db.insert("users", { name: "Biel" });
    const transactionId = await ctx.db.insert("transactions", {
      userId: ana,
      type: "expense",
      amountCents: 4290,
      date: Date.UTC(2026, 10, 8),
      category: "groceries",
      concept: "Supermercat",
    });
    return { ana, biel, transactionId };
  });
  return { t, ...ids };
}

async function expectNotFound(promise: Promise<unknown>) {
  const error: unknown = await promise.then(
    () => expect.fail("Expected NOT_FOUND"),
    (rejection: unknown) => rejection,
  );
  expect(error).toBeInstanceOf(ConvexError);
  // Inside t.run, convex-test can hand the data back serialized more than once.
  let data: unknown = (error as { data: unknown }).data;
  while (typeof data === "string") {
    data = JSON.parse(data);
  }
  expect(data).toEqual({ code: "NOT_FOUND", message: NOT_FOUND_MESSAGE });
}

describe("requireOwnedDocument", () => {
  it("returns the document when it belongs to the user", async () => {
    const { t, ana, transactionId } = await setupUsers();

    const transaction = await t.run((ctx) =>
      requireOwnedDocument(ctx, ana, transactionId, NOT_FOUND_MESSAGE),
    );

    expect(transaction).toMatchObject({ _id: transactionId, userId: ana });
  });

  it("fails with NOT_FOUND when the document belongs to another user", async () => {
    const { t, biel, transactionId } = await setupUsers();

    await expectNotFound(
      t.run((ctx) => requireOwnedDocument(ctx, biel, transactionId, NOT_FOUND_MESSAGE)),
    );
  });

  it("fails with the same NOT_FOUND when the document no longer exists", async () => {
    const { t, ana, transactionId } = await setupUsers();
    await t.run((ctx) => ctx.db.delete(transactionId));

    await expectNotFound(
      t.run((ctx) => requireOwnedDocument(ctx, ana, transactionId, NOT_FOUND_MESSAGE)),
    );
  });
});
