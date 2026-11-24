import { describe, expect, it } from "vitest";
import {
  ASSET_TYPES,
  LIQUID_ASSET_TYPES,
  assetTypeValidator,
} from "./assetTypes";

describe("LIQUID_ASSET_TYPES", () => {
  it("counts only bank accounts and cash as liquidity", () => {
    expect(LIQUID_ASSET_TYPES).toEqual(["bankAccount", "cash"]);
  });
});

describe("ASSET_TYPES", () => {
  it("lists a fixed set of asset types", () => {
    expect(ASSET_TYPES).toEqual([
      "bankAccount",
      "cash",
      "investment",
      "realEstate",
      "vehicle",
      "other",
    ]);
  });

  it("keeps the Convex validator in sync with the exported list", () => {
    const fromValidator = assetTypeValidator.members.map(
      (member) => member.value,
    );
    expect(fromValidator).toEqual([...ASSET_TYPES]);
  });
});
