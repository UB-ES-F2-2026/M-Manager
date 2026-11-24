import { describe, expect, it } from "vitest";
import { SPLIT_MODES, splitModeValidator } from "./splitModes";

describe("SPLIT_MODES", () => {
  it("has exactly the three modes of the «Com es divideix» toggle, equal first", () => {
    expect(SPLIT_MODES).toEqual(["equal", "amounts", "percentages"]);
  });

  it("keeps the Convex validator in sync with the exported list", () => {
    const fromValidator = splitModeValidator.members.map((member) => member.value);
    expect(fromValidator).toEqual([...SPLIT_MODES]);
  });
});
