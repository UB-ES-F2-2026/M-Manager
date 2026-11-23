import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import {
  DAY_OF_MONTH_MESSAGE,
  MAX_DAY_OF_MONTH,
  MIN_DAY_OF_MONTH,
  RECURRENCE_FREQUENCIES,
  assertValidDayOfMonth,
  assertValidMonthOfYear,
  recurrenceFrequencyValidator,
} from "./recurrenceFrequencies";

describe("RECURRENCE_FREQUENCIES", () => {
  it("allows only monthly and yearly", () => {
    expect(RECURRENCE_FREQUENCIES).toEqual(["monthly", "yearly"]);
  });

  it("keeps the Convex validator in sync with the exported list", () => {
    const fromValidator = recurrenceFrequencyValidator.members.map(
      (member) => member.value,
    );
    expect(fromValidator).toEqual([...RECURRENCE_FREQUENCIES]);
  });
});

describe("day of month bounds", () => {
  it("restricts the payment day to 1–28", () => {
    expect(MIN_DAY_OF_MONTH).toBe(1);
    expect(MAX_DAY_OF_MONTH).toBe(28);
    expect(assertValidDayOfMonth(1)).toBe(1);
    expect(assertValidDayOfMonth(28)).toBe(28);
  });

  it("rejects a day outside 1–28 with the form message", () => {
    try {
      assertValidDayOfMonth(29);
      expect.fail("Expected INVALID_DAY_OF_MONTH");
    } catch (error) {
      expect(error).toBeInstanceOf(ConvexError);
      expect((error as ConvexError<{ code: string; message: string }>).data).toMatchObject({
        code: "INVALID_DAY_OF_MONTH",
        message: DAY_OF_MONTH_MESSAGE,
      });
    }
  });

  it("accepts months 1–12 and rejects others", () => {
    expect(assertValidMonthOfYear(3)).toBe(3);
    expect(() => assertValidMonthOfYear(0)).toThrow(ConvexError);
  });
});
