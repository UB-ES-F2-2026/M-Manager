import { describe, expect, it } from "vitest";
import { initialsFromLabel } from "./initialsFromLabel";

describe("initialsFromLabel", () => {
  it("uses the first two letters of a single word", () => {
    expect(initialsFromLabel("Cotxe")).toBe("CO");
  });

  it("uses the first letter of the first two words", () => {
    expect(initialsFromLabel("Compte d'estalvi")).toBe("CD");
  });

  it("trims spaces and ignores empty segments", () => {
    expect(initialsFromLabel("  Banc  Nord  ")).toBe("BN");
  });

  it("returns a placeholder when the label is blank", () => {
    expect(initialsFromLabel("   ")).toBe("?");
  });
});
