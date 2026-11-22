import { describe, expect, it } from "vitest";
import { groupInviteLink } from "./groupInviteLink";

describe("groupInviteLink", () => {
  it("points to the join screen with the code as a query parameter", () => {
    expect(groupInviteLink("https://m-manager.esgrupof2.workers.dev", "5ACYL6")).toBe(
      "https://m-manager.esgrupof2.workers.dev/groups/join?code=5ACYL6",
    );
  });

  it("works with the local development origin", () => {
    expect(groupInviteLink("http://localhost:5173", "K7M2QX")).toBe(
      "http://localhost:5173/groups/join?code=K7M2QX",
    );
  });
});
