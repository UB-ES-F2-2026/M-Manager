import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import {
  assertValidEmail,
  assertValidName,
  assertValidPassword,
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

describe("assertValidPassword", () => {
  it("accepts passwords with 8+ characters", () => {
    expect(() => assertValidPassword("password")).not.toThrow();
  });

  it("rejects short passwords", () => {
    expectConvexError(() => assertValidPassword("short"), "INVALID_PASSWORD");
  });
});
