/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
import { exportJWK, exportPKCS8, generateKeyPair } from "jose";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import { INVALID_CREDENTIALS_MESSAGE } from "./lib/validation";
import schema from "./schema";

// US1.2 · Accedir al meu compte: sign-in, session and sign-out through Convex Auth.

const modules = import.meta.glob("./**/!(*.*.*)*.*s");

function setup() {
  return convexTest(schema, modules);
}

type TestConvex = ReturnType<typeof setup>;

beforeAll(async () => {
  // Convex Auth signs a JWT for every new session, so it needs these keys.
  const keys = await generateKeyPair("RS256", { extractable: true });
  const publicKey = await exportJWK(keys.publicKey);
  vi.stubEnv("JWT_PRIVATE_KEY", await exportPKCS8(keys.privateKey));
  vi.stubEnv("JWKS", JSON.stringify({ keys: [{ use: "sig", ...publicKey }] }));
  vi.stubEnv("CONVEX_SITE_URL", "https://m-manager.test");
});

const ANA = { name: "Ana", email: "ana@example.com", password: "secret123" };

/** Registers Ana and signs her out, so each test starts from a stored account. */
async function setupWithAccount(): Promise<TestConvex> {
  const t = setup();
  await t.action(api.auth.signIn, {
    provider: "password",
    params: { ...ANA, flow: "signUp" },
  });
  await t.run(async (ctx) => {
    for (const session of await ctx.db.query("authSessions").collect()) {
      await ctx.db.delete(session._id);
    }
  });
  return t;
}

function signIn(t: TestConvex, params: { email: string; password: string }) {
  return t.action(api.auth.signIn, {
    provider: "password",
    params: { ...params, flow: "signIn" },
  });
}

/** Returns the error data; convex-test hands it back serialized from the action. */
async function getErrorData(promise: Promise<unknown>): Promise<unknown> {
  const error: unknown = await promise.then(
    () => expect.fail("Expected the sign-in to be rejected"),
    (rejection: unknown) => rejection,
  );
  expect(error).toBeInstanceOf(ConvexError);
  const data: unknown = (error as { data: unknown }).data;
  return typeof data === "string" ? JSON.parse(data) : data;
}

const INVALID_CREDENTIALS = {
  code: "INVALID_CREDENTIALS",
  message: INVALID_CREDENTIALS_MESSAGE,
};

async function asSignedInUser(t: TestConvex) {
  const [session] = await t.run((ctx) => ctx.db.query("authSessions").collect());
  return t.withIdentity({ subject: `${session.userId}|${session._id}` });
}

describe("US1.2 AC1 · valid credentials open the main screen", () => {
  it("signs in with email and password only and returns session tokens", async () => {
    // No name on purpose. Regression: the first version required it on every flow.
    const t = await setupWithAccount();

    const result = await signIn(t, { email: ANA.email, password: ANA.password });

    expect(result.tokens?.token).toEqual(expect.any(String));
    expect(result.tokens?.refreshToken).toEqual(expect.any(String));
  });

  it("accepts the email with different case or spaces", async () => {
    const t = await setupWithAccount();

    const result = await signIn(t, { email: "  ANA@Example.com ", password: ANA.password });

    expect(result.tokens?.token).toEqual(expect.any(String));
  });

  it("opens the session of the right user", async () => {
    const t = await setupWithAccount();
    await signIn(t, { email: ANA.email, password: ANA.password });

    const asAna = await asSignedInUser(t);

    expect(await asAna.query(api.users.currentUser, {})).toMatchObject({
      name: "Ana",
      email: "ana@example.com",
    });
  });
});

describe("US1.2 AC2 · generic error with wrong credentials", () => {
  it("rejects a wrong password with INVALID_CREDENTIALS", async () => {
    const t = await setupWithAccount();

    expect(
      await getErrorData(signIn(t, { email: ANA.email, password: "wrong-password" })),
    ).toEqual(INVALID_CREDENTIALS);
  });

  it("rejects an unknown email with exactly the same error", async () => {
    // Same code and message, so nobody can tell which emails are registered.
    const t = await setupWithAccount();

    expect(
      await getErrorData(signIn(t, { email: "nobody@example.com", password: ANA.password })),
    ).toEqual(INVALID_CREDENTIALS);
  });

  it("keeps the generic error after too many failed attempts", async () => {
    const t = await setupWithAccount();
    // Convex Auth locks the account after 10 failed attempts per hour.
    for (let attempt = 0; attempt < 10; attempt++) {
      await getErrorData(signIn(t, { email: ANA.email, password: "wrong-password" }));
    }

    expect(
      await getErrorData(signIn(t, { email: ANA.email, password: ANA.password })),
    ).toEqual(INVALID_CREDENTIALS);
  });

  it("does not create a session when the credentials are wrong", async () => {
    const t = await setupWithAccount();

    await getErrorData(signIn(t, { email: ANA.email, password: "wrong-password" }));

    expect(await t.run((ctx) => ctx.db.query("authSessions").collect())).toHaveLength(0);
  });
});

describe("US1.2 AC3 · session stays open until logout", () => {
  it("renews the session with the refresh token, as after reloading the page", async () => {
    const t = await setupWithAccount();
    const { tokens } = await signIn(t, { email: ANA.email, password: ANA.password });

    const renewed = await t.action(api.auth.signIn, {
      refreshToken: tokens?.refreshToken,
    });

    expect(renewed.tokens?.token).toEqual(expect.any(String));
  });

  it("closes the session on sign out", async () => {
    const t = await setupWithAccount();
    await signIn(t, { email: ANA.email, password: ANA.password });
    const asAna = await asSignedInUser(t);

    await asAna.action(api.auth.signOut, {});

    expect(await t.run((ctx) => ctx.db.query("authSessions").collect())).toHaveLength(0);
  });

  it("cannot renew the session after signing out", async () => {
    const t = await setupWithAccount();
    const { tokens } = await signIn(t, { email: ANA.email, password: ANA.password });
    const asAna = await asSignedInUser(t);
    await asAna.action(api.auth.signOut, {});

    const renewed = await t.action(api.auth.signIn, {
      refreshToken: tokens?.refreshToken,
    });

    expect(renewed.tokens).toBeNull();
  });
});
