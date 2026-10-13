import { describe, expect, it } from "vitest";
import { formatLongDate } from "./dates";

describe("formatLongDate", () => {
  it("formats weekday, day and month in Catalan with a capital letter", () => {
    const text = formatLongDate(new Date(2026, 9, 13, 12).getTime());
    expect(text).toMatch(/^Dimarts, 13 d.octubre$/);
  });

  it("handles months that start with a consonant", () => {
    expect(formatLongDate(new Date(2026, 2, 2, 12).getTime())).toBe("Dilluns, 2 de març");
  });
});
