/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
import { exportJWK, exportPKCS8, generateKeyPair } from "jose";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

// US1.1 · Crear un compte: sign-up through Convex Auth, end to end on the backend.

const modules = import.meta.glob("./**/!(*.*.*)*.*s");

function setup() {
  return convexTest(schema, modules);
}

type TestConvex = ReturnType<typeof setup>;

type SignUpParams = { name?: string; email: string; password: string };

beforeAll(async () => {
  // Convex Auth signs a JWT for every new session, so it needs these keys.
  const keys = await generateKeyPair("RS256", { extractable: true });
  const publicKey = await exportJWK(keys.publicKey);
  vi.stubEnv("JWT_PRIVATE_KEY", await exportPKCS8(keys.privateKey));
  vi.stubEnv("JWKS", JSON.stringify({ keys: [{ use: "sig", ...publicKey }] }));
  vi.stubEnv("CONVEX_SITE_URL", "https://m-manager.test");
});

function signUp(t: TestConvex, params: SignUpParams) {
  return t.action(api.auth.signIn, {
    provider: "password",
    params: { ...params, flow: "signUp" },
  });
}

async function expectAuthError(promise: Promise<unknown>, code: string) {
  const error: unknown = await promise.then(
    () => expect.fail(`Expected ${code}`),
    (rejection: unknown) => rejection,
  );
  expect(error).toBeInstanceOf(ConvexError);
  // convex-test hands the data back serialized, as it travels from an action.
  const data: unknown = (error as { data: unknown }).data;
  const parsed: unknown = typeof data === "string" ? JSON.parse(data) : data;
  expect(parsed).toMatchObject({ code });
}

function listUsers(t: TestConvex) {
  return t.run((ctx) => ctx.db.query("users").collect());
}

const ANA = { name: "Ana", email: "ana@example.com", password: "secret123" };

describe("US1.1 AC1 · name, email and password", () => {
  it("creates the user with the trimmed name and normalized email", async () => {
    const t = setup();

    await signUp(t, {
      name: "  Ana Puig  ",
      email: "  Ana@Example.COM ",
      password: "secret123",
    });

    const users = await listUsers(t);
    expect(users).toHaveLength(1);
    expect(users[0]).toMatchObject({ name: "Ana Puig", email: "ana@example.com" });
  });

  it("does not store the password in plain text", async () => {
    const t = setup();

    await signUp(t, ANA);

    const accounts = await t.run((ctx) => ctx.db.query("authAccounts").collect());
    expect(accounts).toHaveLength(1);
    expect(accounts[0].providerAccountId).toBe("ana@example.com");
    expect(accounts[0].secret).toBeDefined();
    expect(accounts[0].secret).not.toContain(ANA.password);
  });

  it("rejects a missing or blank name", async () => {
    const t = setup();

    await expectAuthError(signUp(t, { ...ANA, name: undefined }), "INVALID_NAME");
    await expectAuthError(signUp(t, { ...ANA, name: "   " }), "INVALID_NAME");
    expect(await listUsers(t)).toHaveLength(0);
  });

  it("rejects a password shorter than 8 characters", async () => {
    const t = setup();

    await expectAuthError(signUp(t, { ...ANA, password: "short" }), "INVALID_PASSWORD");
    expect(await listUsers(t)).toHaveLength(0);
  });
});

describe("US1.1 AC2 · valid and unique email", () => {
  it("rejects an email with an invalid format", async () => {
    const t = setup();

    await expectAuthError(signUp(t, { ...ANA, email: "ana@example" }), "INVALID_EMAIL");
    expect(await listUsers(t)).toHaveLength(0);
  });

  it("rejects an email that is already registered", async () => {
    const t = setup();
    await signUp(t, ANA);

    await expectAuthError(
      signUp(t, { ...ANA, name: "Another Ana", password: "different123" }),
      "EMAIL_TAKEN",
    );
    expect(await listUsers(t)).toHaveLength(1);
  });

  it("rejects a repeated email even with the same password", async () => {
    // Regression: the first version signed this user into the existing account.
    const t = setup();
    await signUp(t, ANA);

    await expectAuthError(signUp(t, ANA), "EMAIL_TAKEN");
    expect(await listUsers(t)).toHaveLength(1);
  });

  it("treats the same email with different case or spaces as repeated", async () => {
    const t = setup();
    await signUp(t, ANA);

    await expectAuthError(
      signUp(t, { ...ANA, email: "  ANA@example.com " }),
      "EMAIL_TAKEN",
    );
    expect(await listUsers(t)).toHaveLength(1);
  });
});

describe("US1.1 AC3 · signed in after registering", () => {
  it("returns session tokens so the app can open the main screen", async () => {
    const t = setup();

    const result = await signUp(t, ANA);

    expect(result.tokens?.token).toEqual(expect.any(String));
    expect(result.tokens?.refreshToken).toEqual(expect.any(String));
  });

  it("returns the new user's profile from currentUser", async () => {
    const t = setup();
    await signUp(t, ANA);

    const [user] = await listUsers(t);
    const [session] = await t.run((ctx) => ctx.db.query("authSessions").collect());
    const asAna = t.withIdentity({ subject: `${user._id}|${session._id}` });

    expect(await asAna.query(api.users.currentUser, {})).toEqual({
      _id: user._id,
      name: "Ana",
      email: "ana@example.com",
    });
  });

  it("returns null from currentUser when nobody is signed in", async () => {
    const t = setup();

    expect(await t.query(api.users.currentUser, {})).toBeNull();
  });
});
