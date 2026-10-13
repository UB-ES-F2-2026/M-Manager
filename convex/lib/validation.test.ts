import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import {
  assertValidEmail,
  assertValidName,
  assertValidPassword,
  getPasswordChecks,
} from "./validation";

function expectConvexError(
  fn: () => unknown,
  code: string,
): void {
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
});

describe("getPasswordChecks", () => {
  it("reports each requirement separately", () => {
    expect(getPasswordChecks("abc")).toEqual({
      minLength: false,
      uppercase: false,
      number: false,
      symbol: false,
    });
    expect(getPasswordChecks("Àbcdefg1!")).toEqual({
      minLength: true,
      uppercase: true,
      number: true,
      symbol: true,
    });
  });

  it("does not count spaces as symbols", () => {
    expect(getPasswordChecks("Abcdefg1 ").symbol).toBe(false);
  });
});

describe("assertValidPassword", () => {
  it("accepts strong passwords", () => {
    expect(() => assertValidPassword("Password1!")).not.toThrow();
  });

  it("rejects short passwords", () => {
    expectConvexError(() => assertValidPassword("Pa1!"), "INVALID_PASSWORD");
  });

  it("rejects passwords without uppercase, number or symbol", () => {
    expectConvexError(() => assertValidPassword("password1!"), "INVALID_PASSWORD");
    expectConvexError(() => assertValidPassword("Password!!"), "INVALID_PASSWORD");
    expectConvexError(() => assertValidPassword("Password12"), "INVALID_PASSWORD");
  });

  it("rejects non-string passwords", () => {
    expectConvexError(() => assertValidPassword(undefined), "INVALID_PASSWORD");
  });
});
