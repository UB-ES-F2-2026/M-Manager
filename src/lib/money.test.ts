import { describe, expect, it } from "vitest";
import { formatMoney, formatSignedMoney, parseMoney } from "./money";

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
