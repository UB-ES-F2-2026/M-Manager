import { describe, expect, it } from "vitest";
import { redirectPathAfterAuth } from "./redirectAfterAuth";

describe("redirectPathAfterAuth", () => {
  it("returns the page that required the session, with its query string", () => {
    expect(redirectPathAfterAuth({ from: "/groups/join?code=K7M2QX" })).toBe(
      "/groups/join?code=K7M2QX",
    );
  });

  it("goes home when there is no stored page", () => {
    expect(redirectPathAfterAuth(null)).toBe("/");
    expect(redirectPathAfterAuth(undefined)).toBe("/");
    expect(redirectPathAfterAuth({})).toBe("/");
  });

  it("ignores values that are not in-app paths", () => {
    expect(redirectPathAfterAuth({ from: 42 })).toBe("/");
    expect(redirectPathAfterAuth({ from: "https://evil.example" })).toBe("/");
    expect(redirectPathAfterAuth({ from: "//evil.example" })).toBe("/");
  });
});
