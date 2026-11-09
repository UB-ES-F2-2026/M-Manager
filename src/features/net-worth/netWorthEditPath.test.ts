import { describe, expect, it } from "vitest";
import { netWorthEditPath } from "./netWorthEditPath";

describe("netWorthEditPath", () => {
  it("points assets and debts to their own edit screen", () => {
    expect(netWorthEditPath("asset", "k17abc")).toBe("/net-worth/assets/k17abc/edit");
    expect(netWorthEditPath("debt", "k57xyz")).toBe("/net-worth/debts/k57xyz/edit");
  });
});
