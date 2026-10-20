import { ConvexError } from "convex/values";
import { describe, expect, it, vi } from "vitest";
import { INVALID_CREDENTIALS_MESSAGE } from "../../../../convex/lib/validation";
import {
  attemptLogin,
  isInvalidCredentialsError,
  LOGIN_ERROR_ALERT,
  REQUIRED_FIELD_MESSAGE,
  validateLoginFields,
} from "./useLoginForm";

describe("validateLoginFields", () => {
  it("accepts filled email and password", () => {
    expect(
      validateLoginFields({ email: "ana@banco.es", password: "secret123" }),
    ).toEqual({});
  });

  it("marks both fields as required when empty", () => {
    expect(validateLoginFields({ email: "", password: "" })).toEqual({
      email: REQUIRED_FIELD_MESSAGE,
      password: REQUIRED_FIELD_MESSAGE,
    });
  });

  it("treats a whitespace-only email as empty", () => {
    expect(
      validateLoginFields({ email: "   ", password: "secret123" }),
    ).toEqual({ email: REQUIRED_FIELD_MESSAGE });
  });
});

describe("attemptLogin", () => {
  it("signs in with the trimmed email and returns true", async () => {
    const signIn = vi.fn().mockResolvedValue({ signingIn: true });

    await expect(
      attemptLogin(signIn, { email: "  ana@banco.es ", password: "secret123" }),
    ).resolves.toBe(true);
    expect(signIn).toHaveBeenCalledWith("password", {
      email: "ana@banco.es",
      password: "secret123",
      flow: "signIn",
    });
  });

  it("returns false when Convex Auth rejects the credentials", async () => {
    const signIn = vi.fn().mockRejectedValue(new Error("InvalidSecret"));

    await expect(
      attemptLogin(signIn, { email: "ana@banco.es", password: "wrong-password" }),
    ).resolves.toBe(false);
  });

  it("returns false when the backend throws INVALID_CREDENTIALS", async () => {
    const signIn = vi.fn().mockRejectedValue(
      new ConvexError({
        code: "INVALID_CREDENTIALS",
        message: INVALID_CREDENTIALS_MESSAGE,
      }),
    );

    await expect(
      attemptLogin(signIn, { email: "ana@banco.es", password: "wrong-password" }),
    ).resolves.toBe(false);
  });
});

describe("isInvalidCredentialsError", () => {
  it("recognises the structured backend error", () => {
    expect(
      isInvalidCredentialsError(
        new ConvexError({
          code: "INVALID_CREDENTIALS",
          message: INVALID_CREDENTIALS_MESSAGE,
        }),
      ),
    ).toBe(true);
  });

  it("keeps the login alert title aligned with the backend message", () => {
    expect(LOGIN_ERROR_ALERT.title).toBe(INVALID_CREDENTIALS_MESSAGE);
  });
});
