import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import { assertValidDateRange } from "./dateRange";

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

describe("assertValidDateRange", () => {
  it("accepts a valid range", () => {
    expect(() => assertValidDateRange(1000, 2000)).not.toThrow();
  });

  it("accepts a range where both ends are the same", () => {
    expect(() => assertValidDateRange(1000, 1000)).not.toThrow();
  });

  it("accepts a missing end", () => {
    expect(() => assertValidDateRange()).not.toThrow();
    expect(() => assertValidDateRange(1000)).not.toThrow();
    expect(() => assertValidDateRange(undefined, 2000)).not.toThrow();
  });

  it("rejects a start after the end", () => {
    expectConvexError(() => assertValidDateRange(2000, 1000), "INVALID_DATE_RANGE");
  });

  it.each([
    ["decimal", 1.5],
    ["NaN", NaN],
    ["infinite", Infinity],
    ["unsafe", 2 ** 53],
  ])("rejects a %s date on either end", (_label, date) => {
    expectConvexError(() => assertValidDateRange(date, 2000), "INVALID_DATE");
    expectConvexError(() => assertValidDateRange(1000, date), "INVALID_DATE");
  });
});
