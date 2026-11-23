import { describe, expect, it } from "vitest";
import { RECURRENCE_FREQUENCIES } from "../../../convex/lib/recurrenceFrequencies";
import { defaultDayOfMonth, FREQUENCY_LABELS, parseDayOfMonth } from "./recurrenceFields";

describe("FREQUENCY_LABELS", () => {
  it("offers exactly Mensual and Anual, in that order", () => {
    expect(RECURRENCE_FREQUENCIES.map((frequency) => FREQUENCY_LABELS[frequency])).toEqual([
      "Mensual",
      "Anual",
    ]);
    expect(Object.keys(FREQUENCY_LABELS)).toHaveLength(RECURRENCE_FREQUENCIES.length);
  });
});

describe("defaultDayOfMonth", () => {
  it("uses the day of the date field", () => {
    expect(defaultDayOfMonth("2026-11-05")).toBe("5");
    expect(defaultDayOfMonth("2026-11-28")).toBe("28");
  });

  it("caps days after the 28th at 28", () => {
    expect(defaultDayOfMonth("2026-10-29")).toBe("28");
    expect(defaultDayOfMonth("2026-10-31")).toBe("28");
  });

  it("stays empty when the date is not set or malformed", () => {
    expect(defaultDayOfMonth("")).toBe("");
    expect(defaultDayOfMonth("28/10/2026")).toBe("");
    expect(defaultDayOfMonth("2026-10-00")).toBe("");
  });
});

describe("parseDayOfMonth", () => {
  it("accepts whole days from 1 to 28", () => {
    expect(parseDayOfMonth("1")).toBe(1);
    expect(parseDayOfMonth(" 15 ")).toBe(15);
    expect(parseDayOfMonth("28")).toBe(28);
  });

  it("rejects empty, out of range and non-integer values", () => {
    for (const value of ["", "   ", "0", "29", "31", "-3", "2.5", "2,5", "abc", "1e1"]) {
      expect(parseDayOfMonth(value)).toBeNull();
    }
  });
});
