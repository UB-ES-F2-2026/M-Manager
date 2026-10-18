import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import {
  assertValidEmail,
  assertValidName,
  assertValidPassword,
  EMAIL_TAKEN_MESSAGE,
  INVALID_CREDENTIALS_MESSAGE,
  throwEmailTaken,
  throwInvalidCredentials,
  validateSignUpProfile,
} from "./validation";

function expectConvexError(fn: () => unknown, code: string): void {
  try {
    fn();
    expect.fail("Expected ConvexError");
  } catch (error) {
    expect(error).toBeInstanceOf(ConvexError);
    const data = (error as ConvexError<{ code: string }>).data;
    expect(data.code).toBe(code);
  }
}

describe("assertValidName", () => {
  it("accepts a trimmed name", () => {
    expect(assertValidName("  Martí Barco  ")).toBe("Martí Barco");
  });

  it("rejects empty name", () => {
    expectConvexError(() => assertValidName("   "), "INVALID_NAME");
  });

  it("rejects missing name", () => {
    expectConvexError(() => assertValidName(undefined), "INVALID_NAME");
  });

  it("rejects names longer than 20 characters", () => {
    expectConvexError(() => assertValidName("a".repeat(21)), "INVALID_NAME");
  });
});

describe("assertValidEmail", () => {
  it("normalizes a valid email", () => {
    expect(assertValidEmail("  Marti@Example.COM ")).toBe("marti@example.com");
  });

  it("rejects invalid email format", () => {
    expectConvexError(() => assertValidEmail("not-an-email"), "INVALID_EMAIL");
    expectConvexError(() => assertValidEmail("a@"), "INVALID_EMAIL");
    expectConvexError(() => assertValidEmail(""), "INVALID_EMAIL");
  });

  it("rejects non-string email", () => {
    expectConvexError(() => assertValidEmail(null), "INVALID_EMAIL");
  });
});

describe("assertValidPassword", () => {
  it("accepts passwords with 8+ characters", () => {
    expect(() => assertValidPassword("password")).not.toThrow();
  });

  it("rejects short passwords", () => {
    expectConvexError(() => assertValidPassword("short"), "INVALID_PASSWORD");
  });

  it("rejects empty or non-string passwords", () => {
    expectConvexError(() => assertValidPassword(""), "INVALID_PASSWORD");
    expectConvexError(() => assertValidPassword(undefined), "INVALID_PASSWORD");
  });
});

describe("validateSignUpProfile", () => {
  it("returns normalized name and email together", () => {
    expect(
      validateSignUpProfile({
        name: "  Ana  ",
        email: "  Ana@Example.COM ",
      }),
    ).toEqual({ name: "Ana", email: "ana@example.com" });
  });

  it("fails if either field is invalid", () => {
    expectConvexError(
      () => validateSignUpProfile({ name: "", email: "ok@example.com" }),
      "INVALID_NAME",
    );
    expectConvexError(
      () => validateSignUpProfile({ name: "Ana", email: "bad" }),
      "INVALID_EMAIL",
    );
  });
});

describe("throwEmailTaken", () => {
  it("throws EMAIL_TAKEN with the registration message", () => {
    try {
      throwEmailTaken();
      expect.fail("Expected ConvexError");
    } catch (error) {
      expect(error).toBeInstanceOf(ConvexError);
      const data = (error as ConvexError<{ code: string; message: string }>).data;
      expect(data.code).toBe("EMAIL_TAKEN");
      expect(data.message).toBe(EMAIL_TAKEN_MESSAGE);
    }
  });
});

describe("throwInvalidCredentials", () => {
  it("throws INVALID_CREDENTIALS with the generic login message", () => {
    try {
      throwInvalidCredentials();
      expect.fail("Expected ConvexError");
    } catch (error) {
      expect(error).toBeInstanceOf(ConvexError);
      const data = (error as ConvexError<{ code: string; message: string }>).data;
      expect(data.code).toBe("INVALID_CREDENTIALS");
      expect(data.message).toBe(INVALID_CREDENTIALS_MESSAGE);
    }
  });
});
