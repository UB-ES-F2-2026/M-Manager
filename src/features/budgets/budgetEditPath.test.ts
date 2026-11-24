import { describe, expect, it } from "vitest";
import { budgetEditPath } from "./budgetEditPath";

describe("budgetEditPath", () => {
  it("points a budget to its edit screen", () => {
    expect(budgetEditPath("k17abc")).toBe("/budgets/k17abc/edit");
  });

  it("gives each budget its own screen", () => {
    expect(budgetEditPath("k17abc")).not.toBe(budgetEditPath("k57xyz"));
  });
});
