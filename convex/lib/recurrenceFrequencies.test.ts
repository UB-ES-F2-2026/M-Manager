import { describe, expect, it } from "vitest";
import {
  MAX_DAY_OF_MONTH,
  MIN_DAY_OF_MONTH,
  RECURRENCE_FREQUENCIES,
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
  });
});
