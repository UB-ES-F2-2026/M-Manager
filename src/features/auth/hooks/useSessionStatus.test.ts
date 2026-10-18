import { describe, expect, it } from "vitest";
import { getSessionStatus } from "./useSessionStatus";

describe("getSessionStatus", () => {
  it("is loading while Convex checks the stored session after a reload", () => {
    expect(
      getSessionStatus({ isLoading: true, isAuthenticated: false, hasToken: false }),
    ).toBe("loading");
  });

  it("keeps the user signed in once Convex confirms the session", () => {
    expect(
      getSessionStatus({ isLoading: false, isAuthenticated: true, hasToken: true }),
    ).toBe("signedIn");
  });

  it("waits while a new token is not confirmed yet, instead of reporting signed out", () => {
    expect(
      getSessionStatus({ isLoading: false, isAuthenticated: false, hasToken: true }),
    ).toBe("loading");
  });

  it("is signed out when there is no token", () => {
    expect(
      getSessionStatus({ isLoading: false, isAuthenticated: false, hasToken: false }),
    ).toBe("signedOut");
  });
});
