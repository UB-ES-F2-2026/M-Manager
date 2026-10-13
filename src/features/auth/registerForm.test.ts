import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import {
  getPasswordStrength,
  mapRegisterError,
  REGISTER_MESSAGES,
  validateRegisterForm,
} from "./registerForm";

const VALID = { name: "Ana", email: "ana@banco.es", password: "Contrasenya1!" };

describe("validateRegisterForm", () => {
  it("accepts a valid name, email and strong password", () => {
    expect(validateRegisterForm(VALID)).toEqual({});
  });

  it("marks every empty field as required", () => {
    expect(validateRegisterForm({ name: " ", email: "", password: "" })).toEqual({
      name: REGISTER_MESSAGES.required,
      email: REGISTER_MESSAGES.required,
      password: REGISTER_MESSAGES.required,
    });
  });

  it("rejects an email without a valid domain", () => {
    expect(validateRegisterForm({ ...VALID, email: "ana@banco" }).email).toBe(
      REGISTER_MESSAGES.invalidEmail,
    );
  });

  it("rejects a weak password", () => {
    expect(validateRegisterForm({ ...VALID, password: "abcd" }).password).toBe(
      REGISTER_MESSAGES.weakPassword,
    );
    expect(validateRegisterForm({ ...VALID, password: "contrasenya1!" }).password).toBe(
      REGISTER_MESSAGES.weakPassword,
    );
  });

  it("rejects a name longer than 100 characters", () => {
    expect(validateRegisterForm({ ...VALID, name: "a".repeat(101) }).name).toBe(
      REGISTER_MESSAGES.nameTooLong,
    );
  });
});

describe("getPasswordStrength", () => {
  it("grows with each requirement met", () => {
    expect(getPasswordStrength("abcd")).toEqual({ score: 0, level: "weak" });
    expect(getPasswordStrength("abcdefgh")).toEqual({ score: 1, level: "weak" });
    expect(getPasswordStrength("Abcdefgh")).toEqual({ score: 2, level: "fair" });
    expect(getPasswordStrength("Abcdefg1")).toEqual({ score: 3, level: "good" });
    expect(getPasswordStrength("Abcdefg1!")).toEqual({ score: 4, level: "strong" });
  });
});

describe("mapRegisterError", () => {
  it("shows a global alert and a field error when the email is already registered", () => {
    const result = mapRegisterError(
      new Error("[CONVEX A(auth:signIn)] Uncaught Error: Account ana@banco.es already exists"),
    );
    expect(result.alert).toEqual(REGISTER_MESSAGES.emailTakenAlert);
    expect(result.fieldErrors).toEqual({ email: REGISTER_MESSAGES.emailInUse });
  });

  it("maps backend validation codes to the matching field", () => {
    expect(
      mapRegisterError(new ConvexError({ code: "INVALID_EMAIL", message: "x" })),
    ).toEqual({ alert: null, fieldErrors: { email: REGISTER_MESSAGES.invalidEmail } });
    expect(
      mapRegisterError(new ConvexError({ code: "INVALID_PASSWORD", message: "x" })),
    ).toEqual({ alert: null, fieldErrors: { password: REGISTER_MESSAGES.weakPassword } });
    expect(
      mapRegisterError(new ConvexError({ code: "INVALID_NAME", message: "x" })),
    ).toEqual({ alert: null, fieldErrors: { name: REGISTER_MESSAGES.required } });
  });

  it("falls back to a generic alert for unknown errors", () => {
    expect(mapRegisterError(new Error("Server Error"))).toEqual({
      alert: REGISTER_MESSAGES.genericAlert,
      fieldErrors: {},
    });
  });
});
