import { describe, expect, it } from "vitest";
import { LOGIN_ERROR_MESSAGE } from "./loginMessages";

describe("login error message", () => {
  it("uses a generic Catalan message that does not reveal which field failed", () => {
    expect(LOGIN_ERROR_MESSAGE).toMatch(/correu|contrasenya/i);
    expect(LOGIN_ERROR_MESSAGE.toLowerCase()).not.toMatch(/només el correu/);
    expect(LOGIN_ERROR_MESSAGE.toLowerCase()).not.toMatch(
      /només la contrasenya/,
    );
  });
});
