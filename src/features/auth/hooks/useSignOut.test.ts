import { describe, expect, it, vi } from "vitest";
import { attemptSignOut } from "./useSignOut";

describe("attemptSignOut", () => {
  it("signs out with Convex Auth and returns true", async () => {
    const signOut = vi.fn().mockResolvedValue(undefined);

    await expect(attemptSignOut(signOut)).resolves.toBe(true);
    expect(signOut).toHaveBeenCalledOnce();
  });

  it("returns false when the session could not be closed", async () => {
    const signOut = vi.fn().mockRejectedValue(new Error("Network error"));

    await expect(attemptSignOut(signOut)).resolves.toBe(false);
  });
});
