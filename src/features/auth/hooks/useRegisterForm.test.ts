import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import {
  EMAIL_TAKEN_MESSAGE,
  getRegisterErrors,
  REQUIRED_FIELD_MESSAGE,
  validateRegisterFields,
} from "./useRegisterForm";

describe("validateRegisterFields", () => {
  it("accepts filled fields", () => {
    expect(
      validateRegisterFields({ name: "Ana", email: "ana@banco.es", password: "secret123" }),
    ).toEqual({});
  });

  it("shows format errors together with required errors", () => {
    expect(validateRegisterFields({ name: "", email: "prueba@banco", password: "" })).toEqual({
      name: REQUIRED_FIELD_MESSAGE,
      email: "El format del correu electrònic no és vàlid.",
      password: REQUIRED_FIELD_MESSAGE,
    });
  });

  it("uses the backend rules for name length and password length", () => {
    expect(
      validateRegisterFields({
        name: "A name that is far too long",
        email: "ana@banco.es",
        password: "short",
      }),
    ).toEqual({
      name: "El nom és massa llarg.",
      password: "La contrasenya ha de tenir almenys 8 caràcters.",
    });
  });

  it("marks every empty field as required", () => {
    expect(validateRegisterFields({ name: " ", email: "", password: "" })).toEqual({
      name: REQUIRED_FIELD_MESSAGE,
      email: REQUIRED_FIELD_MESSAGE,
      password: REQUIRED_FIELD_MESSAGE,
    });
  });
});

describe("getRegisterErrors", () => {
  it("shows backend validation errors under the matching field", () => {
    const error = new ConvexError({
      code: "INVALID_EMAIL",
      message: "El format del correu electrònic no és vàlid.",
    });
    expect(getRegisterErrors(error)).toEqual({
      fieldErrors: { email: "El format del correu electrònic no és vàlid." },
    });
  });

  it("maps a short password to the password field", () => {
    const error = new ConvexError({
      code: "INVALID_PASSWORD",
      message: "La contrasenya ha de tenir almenys 8 caràcters.",
    });
    expect(getRegisterErrors(error).fieldErrors).toEqual({
      password: "La contrasenya ha de tenir almenys 8 caràcters.",
    });
  });

  it("flags an email that is already registered", () => {
    const result = getRegisterErrors(new Error("Account ana@banco.es already exists"));
    expect(result.fieldErrors).toEqual({ email: EMAIL_TAKEN_MESSAGE });
    expect(result.alert?.title).toBe(EMAIL_TAKEN_MESSAGE);
  });

  it("falls back to a generic alert for unknown errors", () => {
    const result = getRegisterErrors(new Error("Server Error"));
    expect(result.fieldErrors).toEqual({});
    expect(result.alert?.title).toBe("No s'ha pogut crear el compte");
  });
});
