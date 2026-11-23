import { describe, expect, it } from "vitest";
import { GROUP_ROLES, groupRoleValidator } from "./groupRoles";

describe("GROUP_ROLES", () => {
  it("has an owner (the creator) and plain members", () => {
    expect(GROUP_ROLES).toEqual(["owner", "member"]);
  });

  it("keeps the Convex validator in sync with the exported list", () => {
    const fromValidator = groupRoleValidator.members.map((member) => member.value);
    expect(fromValidator).toEqual([...GROUP_ROLES]);
  });
});
