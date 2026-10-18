import { describe, expect, it } from "vitest";
import { formatLongDate, formatRelativeDay } from "./dates";

const NOW = new Date(2026, 9, 18, 17, 0).getTime();

describe("formatLongDate", () => {
  it("formats weekday, day and month in Catalan with a capital letter", () => {
    expect(formatLongDate(NOW)).toMatch(/^Diumenge, 18 d.octubre$/);
    expect(formatLongDate(new Date(2026, 2, 2, 12).getTime())).toBe("Dilluns, 2 de març");
  });
});

describe("formatRelativeDay", () => {
  it("says Avui for any time earlier today", () => {
    expect(formatRelativeDay(new Date(2026, 9, 18, 0, 5).getTime(), NOW)).toBe("Avui");
  });

  it("says Ahir for yesterday, even late at night", () => {
    expect(formatRelativeDay(new Date(2026, 9, 17, 23, 59).getTime(), NOW)).toBe("Ahir");
  });

  it("uses a short date for older days", () => {
    expect(formatRelativeDay(new Date(2026, 9, 1, 12).getTime(), NOW)).toMatch(/^1 d.oct\.?$/);
  });
});
