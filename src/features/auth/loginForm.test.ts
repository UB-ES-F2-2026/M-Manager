import { describe, expect, it } from "vitest";
import {
  getPostLoginPath,
  getRedirectFrom,
  LOGIN_MESSAGES,
  validateLoginForm,
} from "./loginForm";

describe("validateLoginForm", () => {
  it("accepts filled email and password", () => {
    expect(validateLoginForm({ email: "ana@banco.es", password: "x" })).toEqual({});
  });

  it("marks empty fields as required without trying to sign in", () => {
    expect(validateLoginForm({ email: "  ", password: "" })).toEqual({
      email: LOGIN_MESSAGES.required,
      password: LOGIN_MESSAGES.required,
    });
  });
});

describe("invalid credentials message", () => {
  it("does not reveal which field failed", () => {
    const text = Object.values(LOGIN_MESSAGES.invalidCredentials).join(" ").toLowerCase();
    expect(text).toContain("correu o contrasenya");
    expect(text).not.toMatch(/no existeix|no està registrat|contrasenya és incorrecta/);
  });
});

describe("getRedirectFrom", () => {
  it("returns the protected path the guest tried to open", () => {
    expect(getRedirectFrom({ from: "/" })).toBe("/");
    expect(getRedirectFrom({ from: "/moviments?mes=10" })).toBe("/moviments?mes=10");
  });

  it("ignores missing or unsafe values", () => {
    expect(getRedirectFrom(null)).toBeNull();
    expect(getRedirectFrom({})).toBeNull();
    expect(getRedirectFrom({ from: 42 })).toBeNull();
    expect(getRedirectFrom({ from: "https://evil.com" })).toBeNull();
    expect(getRedirectFrom({ from: "//evil.com" })).toBeNull();
    expect(getRedirectFrom({ from: "/login" })).toBeNull();
    expect(getRedirectFrom({ from: "/register" })).toBeNull();
  });
});

describe("getPostLoginPath", () => {
  it("goes back to the requested page or to home", () => {
    expect(getPostLoginPath({ from: "/pressupostos" })).toBe("/pressupostos");
    expect(getPostLoginPath(undefined)).toBe("/");
  });
});
