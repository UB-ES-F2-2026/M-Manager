import { describe, expect, it } from "vitest";
import { formatMoney, formatSignedMoney, parseMoney, toAmountInputValue } from "./money";

describe("formatMoney", () => {
  it("formats cents as euros in ca-ES", () => {
    expect(formatMoney(1250)).toContain("12,50");
    expect(formatMoney(0)).toContain("0,00");
  });
});

describe("formatSignedMoney", () => {
  it("prefixes expenses with a minus sign and income with a plus sign", () => {
    expect(formatSignedMoney(4290, "expense")).toMatch(/^−42,90\s€$/);
    expect(formatSignedMoney(185000, "income")).toMatch(/^\+1\.?850,00\s€$/);
  });
});

describe("parseMoney", () => {
  it("parses comma and dot decimals into cents", () => {
    expect(parseMoney("12,50")).toBe(1250);
    expect(parseMoney("12.5")).toBe(1250);
    expect(parseMoney("10")).toBe(1000);
  });

  it("rejects invalid input", () => {
    expect(parseMoney("")).toBeNull();
    expect(parseMoney("abc")).toBeNull();
    expect(parseMoney("-5")).toBeNull();
  });
});

describe("toAmountInputValue", () => {
  it("writes cents with a decimal comma and no thousands separator", () => {
    expect(toAmountInputValue(185000)).toBe("1850,00");
    expect(toAmountInputValue(1250)).toBe("12,50");
    expect(toAmountInputValue(5)).toBe("0,05");
  });

  it("gives back a value that parseMoney turns into the same cents", () => {
    for (const cents of [1, 99, 1250, 185000, 25000000]) {
      expect(parseMoney(toAmountInputValue(cents))).toBe(cents);
    }
  });
});
