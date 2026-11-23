import { describe, expect, it } from "vitest";
import {
  generateGroupCode,
  GROUP_CODE_ALPHABET,
  GROUP_CODE_LENGTH,
  isValidGroupCode,
  normalizeGroupCode,
} from "./groupCodes";

describe("group invite codes", () => {
  it("uses A–Z and 2–9 without the look-alikes 0, O, 1 and I", () => {
    expect(GROUP_CODE_ALPHABET).toHaveLength(32);
    for (const lookAlike of ["0", "O", "1", "I"]) {
      expect(GROUP_CODE_ALPHABET).not.toContain(lookAlike);
    }
  });

  it("generates valid 6-character codes", () => {
    for (let index = 0; index < 200; index += 1) {
      const code = generateGroupCode();
      expect(code).toHaveLength(GROUP_CODE_LENGTH);
      expect(isValidGroupCode(code)).toBe(true);
    }
  });

  it("maps the random number to the alphabet, edges included", () => {
    expect(generateGroupCode(() => 0)).toBe("AAAAAA");
    expect(generateGroupCode(() => 0.999999)).toBe("999999");
  });

  it("trims and uppercases what the user typed", () => {
    expect(normalizeGroupCode("  k7m2qx ")).toBe("K7M2QX");
  });

  it.each(["K7M2Q", "K7M2QXA", "K7M2Q0", "K7M2QO", "K7M2Q1", "K7M2QI", "k7m2qx", "K7M 2Q"])(
    "rejects %s",
    (code) => {
      expect(isValidGroupCode(code)).toBe(false);
    },
  );
});
