import { describe, expect, it } from "vitest";
import { REQUIRED_FIELD_MESSAGE, validateLoginFields } from "./useLoginForm";

describe("validateLoginFields", () => {
  it("accepts filled email and password", () => {
    expect(
      validateLoginFields({ email: "ana@banco.es", password: "secret123" }),
    ).toEqual({});
  });

  it("marks both fields as required when empty", () => {
    expect(validateLoginFields({ email: "", password: "" })).toEqual({
      email: REQUIRED_FIELD_MESSAGE,
      password: REQUIRED_FIELD_MESSAGE,
    });
  });

  it("treats a whitespace-only email as empty", () => {
    expect(
      validateLoginFields({ email: "   ", password: "secret123" }),
    ).toEqual({ email: REQUIRED_FIELD_MESSAGE });
  });
});
