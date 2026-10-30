import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import {
  assertValidAmountCents,
  assertValidConcept,
  assertValidDate,
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
  it("accepts passwords that meet length, uppercase, digit and symbol", () => {
    expect(() => assertValidPassword("Secret1!")).not.toThrow();
  });

  it("rejects short passwords", () => {
    expectConvexError(() => assertValidPassword("Ab1!"), "INVALID_PASSWORD");
  });

  it("rejects passwords missing uppercase, digit or symbol", () => {
    expectConvexError(() => assertValidPassword("secret1!"), "INVALID_PASSWORD");
    expectConvexError(() => assertValidPassword("Secret!!"), "INVALID_PASSWORD");
    expectConvexError(() => assertValidPassword("Secret12"), "INVALID_PASSWORD");
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

describe("assertValidAmountCents", () => {
  it("accepts positive integer cents", () => {
    expect(() => assertValidAmountCents(1)).not.toThrow();
    expect(() => assertValidAmountCents(1250)).not.toThrow();
  });

  it("rejects zero, negative and decimal amounts", () => {
    expectConvexError(() => assertValidAmountCents(0), "INVALID_AMOUNT");
    expectConvexError(() => assertValidAmountCents(-1), "INVALID_AMOUNT");
    expectConvexError(() => assertValidAmountCents(12.5), "INVALID_AMOUNT");
  });

  it("rejects values that are not exact integers", () => {
    expectConvexError(() => assertValidAmountCents(NaN), "INVALID_AMOUNT");
    expectConvexError(() => assertValidAmountCents(Infinity), "INVALID_AMOUNT");
    expectConvexError(() => assertValidAmountCents(2 ** 53), "INVALID_AMOUNT");
  });
});

describe("assertValidDate", () => {
  it("accepts a timestamp in milliseconds", () => {
    expect(() => assertValidDate(Date.UTC(2026, 9, 30))).not.toThrow();
  });

  it("rejects values that are not integers", () => {
    expectConvexError(() => assertValidDate(1.5), "INVALID_DATE");
    expectConvexError(() => assertValidDate(NaN), "INVALID_DATE");
    expectConvexError(() => assertValidDate(Infinity), "INVALID_DATE");
  });

  it("rejects timestamps outside the range of a JavaScript date", () => {
    expectConvexError(() => assertValidDate(8.64e15 + 1), "INVALID_DATE");
  });
});

describe("assertValidConcept", () => {
  it("returns the trimmed concept", () => {
    expect(assertValidConcept("  Supermercat  ")).toBe("Supermercat");
  });

  it("rejects an empty or blank concept", () => {
    expectConvexError(() => assertValidConcept(""), "INVALID_CONCEPT");
    expectConvexError(() => assertValidConcept("   "), "INVALID_CONCEPT");
  });
});
