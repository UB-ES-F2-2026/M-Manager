import { describe, expect, it } from "vitest";
import { getPasswordStrength } from "./passwordStrength";

describe("getPasswordStrength", () => {
  it("returns 0 for an empty password", () => {
    expect(getPasswordStrength("")).toBe(0);
  });

  it("treats passwords shorter than 8 characters as weak", () => {
    expect(getPasswordStrength("Ab1!")).toBe(1);
    expect(getPasswordStrength("Abc123!")).toBe(1);
  });

  it("treats a long password without extra rules as weak", () => {
    expect(getPasswordStrength("abcdefgh")).toBe(1);
  });

  it("adds one level for each extra rule met", () => {
    expect(getPasswordStrength("Abcdefgh")).toBe(2);
    expect(getPasswordStrength("Abcdefg1")).toBe(3);
    expect(getPasswordStrength("Abcdef1!")).toBe(4);
  });
});
