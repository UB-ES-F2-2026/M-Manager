/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { ConvexError, type Value } from "convex/values";
import { describe, expect, it } from "vitest";
import { api } from "../../../convex/_generated/api";
import {
  ALREADY_MEMBER_MESSAGE,
  INVALID_GROUP_CODE_MESSAGE,
  isValidGroupCode,
} from "../../../convex/lib/groupCodes";
import schema from "../../../convex/schema";
import { redirectPathAfterAuth } from "../auth/redirectAfterAuth";
import { groupInviteLink } from "./groupInviteLink";
import { getJoinGroupErrors, parseJoinCode } from "./hooks/useJoinGroupForm";
import { getNewGroupErrors, parseNewGroupFields } from "./hooks/useNewGroupForm";

// US4.1 · Crear un grup i convidar amics — integration / acceptance tests.
//
// The unit tests next to each piece check it alone (groups.test.ts,
// useNewGroupForm.test.ts, useJoinGroupForm.test.ts, groupInviteLink.test.ts…).
// These tests join the real frontend helpers with the real Convex functions
// (in memory, with convex-test) and follow the user through each acceptance
// criterion, so they fail if the two sides stop agreeing.

const modules = import.meta.glob("../../../convex/**/!(*.*.*)*.*s");

const APP_ORIGIN = "https://m-manager.example";

function setup() {
  return convexTest(schema, modules);
}

type TestConvex = ReturnType<typeof setup>;

async function signedInAs(t: TestConvex, name: string) {
  const userId = await t.run((ctx) => ctx.db.insert("users", { name }));
  return { userId, client: t.withIdentity({ subject: `${userId}|session` }) };
}

type Client = Awaited<ReturnType<typeof signedInAs>>["client"];

/** Does what /groups/new does on submit: validate in the browser, then create. */
async function submitNewGroupForm(client: Client, name: string, description = "") {
  const { args, errors } = parseNewGroupFields({ name, description });
  if (args === null) {
    throw new Error(`The form should accept these fields: ${JSON.stringify(errors)}`);
  }
  return client.mutation(api.groups.create, args);
}

/** Does what /groups/join does on submit: validate in the browser, then join. */
async function submitJoinForm(client: Client, typedCode: string) {
  const parsed = parseJoinCode(typedCode);
  if (parsed.code === null) {
    throw new Error(`The form should accept the code ${typedCode}`);
  }
  return client.mutation(api.groups.join, { code: parsed.code });
}

/** The code a visitor gets from an invite link, as the join page reads it. */
function codeFromInviteLink(link: string): string {
  return new URL(link).searchParams.get("code") ?? "";
}

/**
 * The error a failing call gives the form. convex-test hands ConvexError data
 * back as a JSON string, while the browser client (convex/react) parses it, so
 * this parses it too: the form helpers then get exactly what they get in the app.
 */
async function rejectionOf(promise: Promise<unknown>): Promise<unknown> {
  const error: unknown = await promise.then(
    () => expect.fail("Expected the call to fail"),
    (rejection: unknown) => rejection,
  );
  if (error instanceof ConvexError && typeof error.data === "string") {
    return new ConvexError(JSON.parse(error.data) as Value);
  }
  return error;
}

describe("US4.1 AC1 · crear un grup", () => {
  it("the creator fills in the form and becomes the admin of the new group", async () => {
    const t = setup();
    const ana = await signedInAs(t, "Ana");

    const groupId = await submitNewGroupForm(ana.client, "  Viatge a Roma ", " Estiu 2027 ");

    const myGroups = await ana.client.query(api.groups.listMine, {});
    expect(myGroups).toEqual([
      { _id: groupId, name: "Viatge a Roma", description: "Estiu 2027", role: "owner" },
    ]);

    const detail = await ana.client.query(api.groups.get, { groupId });
    expect(detail?.myRole).toBe("owner");
    expect(detail?.members).toEqual([{ userId: ana.userId, name: "Ana", role: "owner" }]);
    expect(isValidGroupCode(detail?.code ?? "")).toBe(true);
  });

  it.each([
    { case: "a blank name", name: "   ", description: "" },
    { case: "a name of 81 characters", name: "a".repeat(81), description: "" },
    { case: "a description of 201 characters", name: "Pis", description: "d".repeat(201) },
  ])("the form and the backend reject $case with the same message", async (testCase) => {
    const fields = { name: testCase.name, description: testCase.description };
    const t = setup();
    const ana = await signedInAs(t, "Ana");

    const inTheBrowser = parseNewGroupFields(fields);
    const fromTheBackend = getNewGroupErrors(
      await rejectionOf(ana.client.mutation(api.groups.create, fields)),
    );

    expect(inTheBrowser.args).toBeNull();
    expect(fromTheBackend.alert).toBeUndefined();
    expect(fromTheBackend.fieldErrors).toEqual(inTheBrowser.errors);
    expect(await ana.client.query(api.groups.listMine, {})).toEqual([]);
  });
});

describe("US4.1 AC2 · convidar amb el codi o l'enllaç", () => {
  it("the invite link carries the code that the join form accepts", async () => {
    const t = setup();
    const ana = await signedInAs(t, "Ana");
    const groupId = await submitNewGroupForm(ana.client, "Pis");
    const code = (await ana.client.query(api.groups.get, { groupId }))?.code ?? "";

    const link = groupInviteLink(APP_ORIGIN, code);

    expect(new URL(link).pathname).toBe("/groups/join");
    expect(parseJoinCode(codeFromInviteLink(link))).toEqual({ code });
  });

  it("a friend without a session lands back on the invite link after signing in", async () => {
    const t = setup();
    const ana = await signedInAs(t, "Ana");
    const groupId = await submitNewGroupForm(ana.client, "Pis");
    const code = (await ana.client.query(api.groups.get, { groupId }))?.code ?? "";
    const link = new URL(groupInviteLink(APP_ORIGIN, code));

    // RequireSession stores pathname + search before sending the visitor to /login.
    const afterLogin = redirectPathAfterAuth({ from: link.pathname + link.search });

    expect(afterLogin).toBe(`/groups/join?code=${code}`);
  });

  it("each group gets its own code", async () => {
    const t = setup();
    const ana = await signedInAs(t, "Ana");
    const names = ["Pis", "Viatge a Roma", "Sopars", "Regal de la Marta"];

    const codes = [];
    for (const name of names) {
      const groupId = await submitNewGroupForm(ana.client, name);
      codes.push((await ana.client.query(api.groups.get, { groupId }))?.code);
    }

    expect(new Set(codes).size).toBe(names.length);
  });
});

describe("US4.1 AC3 · unir-se a un grup amb el codi", () => {
  it("a friend joins with the invite link and both see each other in the group", async () => {
    const t = setup();
    const ana = await signedInAs(t, "Ana");
    const bert = await signedInAs(t, "Bert");
    const groupId = await submitNewGroupForm(ana.client, "Viatge a Roma");
    const code = (await ana.client.query(api.groups.get, { groupId }))?.code ?? "";

    // Before joining, Bert cannot see the group (README §7).
    expect(await bert.client.query(api.groups.get, { groupId })).toBeNull();

    const result = await submitJoinForm(
      bert.client,
      codeFromInviteLink(groupInviteLink(APP_ORIGIN, code)),
    );
    expect(result).toEqual({ groupId, alreadyMember: false });

    expect(await bert.client.query(api.groups.listMine, {})).toEqual([
      { _id: groupId, name: "Viatge a Roma", description: "", role: "member" },
    ]);
    const seenByAna = await ana.client.query(api.groups.get, { groupId });
    const seenByBert = await bert.client.query(api.groups.get, { groupId });
    const expectedMembers = [
      { userId: ana.userId, name: "Ana", role: "owner" },
      { userId: bert.userId, name: "Bert", role: "member" },
    ];
    expect(seenByAna?.members).toEqual(expectedMembers);
    expect(seenByBert?.members).toEqual(expectedMembers);
    expect(seenByBert?.myRole).toBe("member");
  });

  it("a code typed by hand in lowercase and with spaces also works", async () => {
    const t = setup();
    const ana = await signedInAs(t, "Ana");
    const bert = await signedInAs(t, "Bert");
    const groupId = await submitNewGroupForm(ana.client, "Pis");
    const code = (await ana.client.query(api.groups.get, { groupId }))?.code ?? "";

    const result = await submitJoinForm(bert.client, ` ${code.toLowerCase()}  `);

    expect(result.groupId).toBe(groupId);
  });

  it("joining twice tells the user they are already in, without duplicating them", async () => {
    const t = setup();
    const ana = await signedInAs(t, "Ana");
    const bert = await signedInAs(t, "Bert");
    const groupId = await submitNewGroupForm(ana.client, "Pis");
    const code = (await ana.client.query(api.groups.get, { groupId }))?.code ?? "";
    await submitJoinForm(bert.client, code);

    const again = await submitJoinForm(bert.client, code);

    // useJoinGroupForm shows ALREADY_MEMBER_MESSAGE when alreadyMember is true.
    expect(again).toEqual({ groupId, alreadyMember: true });
    expect(ALREADY_MEMBER_MESSAGE).toBe("Ja formes part d'aquest grup.");
    const detail = await ana.client.query(api.groups.get, { groupId });
    expect(detail?.members).toHaveLength(2);
  });

  it.each(["", "K7M2", "K7M2QXA", "K7M2Q0", "K7-M2Q"])(
    "the form stops the badly formed code %j before calling the backend",
    (typedCode) => {
      expect(parseJoinCode(typedCode)).toEqual({
        code: null,
        error: INVALID_GROUP_CODE_MESSAGE,
      });
    },
  );

  it("a well-formed code of no group shows the same message under the field", async () => {
    const t = setup();
    const ana = await signedInAs(t, "Ana");
    const bert = await signedInAs(t, "Bert");
    const groupId = await submitNewGroupForm(ana.client, "Pis");
    const realCode = (await ana.client.query(api.groups.get, { groupId }))?.code;
    const unusedCode = realCode === "ZZZZZZ" ? "YYYYYY" : "ZZZZZZ";

    const formErrors = getJoinGroupErrors(await rejectionOf(submitJoinForm(bert.client, unusedCode)));

    expect(formErrors).toEqual({ codeError: INVALID_GROUP_CODE_MESSAGE });
    expect(await bert.client.query(api.groups.listMine, {})).toEqual([]);
  });

  it("the code of one group only lets the friend into that group", async () => {
    const t = setup();
    const ana = await signedInAs(t, "Ana");
    const bert = await signedInAs(t, "Bert");
    const pisId = await submitNewGroupForm(ana.client, "Pis");
    const romaId = await submitNewGroupForm(ana.client, "Viatge a Roma");
    const romaCode = (await ana.client.query(api.groups.get, { groupId: romaId }))?.code ?? "";

    await submitJoinForm(bert.client, romaCode);

    const bertGroups = await bert.client.query(api.groups.listMine, {});
    expect(bertGroups.map((group) => group._id)).toEqual([romaId]);
    expect(await bert.client.query(api.groups.get, { groupId: pisId })).toBeNull();
  });
});
