import { describe, expect, it } from "vitest";
import { formatMonthLabel, getMonthBounds } from "./monthBounds";

describe("getMonthBounds", () => {
  it("returns the local first and last ms of the month", () => {
    const midOctober = new Date(2026, 9, 15, 12, 0, 0).getTime();
    const { monthStart, monthEnd } = getMonthBounds(midOctober);

    expect(monthStart).toBe(new Date(2026, 9, 1).getTime());
    expect(monthEnd).toBe(new Date(2026, 10, 1).getTime() - 1);
  });

  it("keeps December inside the same year", () => {
    const midDecember = new Date(2026, 11, 20).getTime();
    const { monthStart, monthEnd } = getMonthBounds(midDecember);

    expect(monthStart).toBe(new Date(2026, 11, 1).getTime());
    expect(monthEnd).toBe(new Date(2027, 0, 1).getTime() - 1);
  });
});

describe("formatMonthLabel", () => {
  it("returns the month and year in Catalan with a capital letter", () => {
    const midNovember = new Date(2026, 10, 9).getTime();
    expect(formatMonthLabel(midNovember)).toMatch(/^Novembre/);
    expect(formatMonthLabel(midNovember)).toContain("2026");
  });
});
