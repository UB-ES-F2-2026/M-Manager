import { describe, expect, it } from "vitest";
import {
  budgetBarWidth,
  budgetPercent,
  budgetStatus,
  MAX_BUDGET_ALERT,
  selectTopBudgets,
} from "./budgetProgress";

describe("budgetPercent", () => {
  it("returns the whole percentage of the limit already spent", () => {
    expect(budgetPercent({ amountCents: 30000, spentCents: 21600 })).toBe(72);
    expect(budgetPercent({ amountCents: 30000, spentCents: 0 })).toBe(0);
    expect(budgetPercent({ amountCents: 30000, spentCents: 30000 })).toBe(100);
  });

  it("rounds down, so 79.9% is still below the warning", () => {
    expect(budgetPercent({ amountCents: 1000, spentCents: 799 })).toBe(79);
    expect(budgetPercent({ amountCents: 1000, spentCents: 999 })).toBe(99);
  });

  it("goes above 100 when the budget is exceeded", () => {
    expect(budgetPercent({ amountCents: 10000, spentCents: 12500 })).toBe(125);
  });

  it("is 0 for a limit that is not positive", () => {
    expect(budgetPercent({ amountCents: 0, spentCents: 500 })).toBe(0);
  });
});

describe("budgetStatus", () => {
  it("uses MAX_BUDGET_ALERT = 80 as the warning threshold", () => {
    expect(MAX_BUDGET_ALERT).toBe(80);
  });

  it("is ok below 80%", () => {
    expect(budgetStatus(0)).toBe("ok");
    expect(budgetStatus(79)).toBe("ok");
  });

  it("warns from 80% to 99%", () => {
    expect(budgetStatus(80)).toBe("warning");
    expect(budgetStatus(99)).toBe("warning");
  });

  it("is exceeded from 100%", () => {
    expect(budgetStatus(100)).toBe("exceeded");
    expect(budgetStatus(250)).toBe("exceeded");
  });
});

describe("budgetBarWidth", () => {
  it("fills the bar up to the percentage, never past 100%", () => {
    expect(budgetBarWidth(0)).toBe(0);
    expect(budgetBarWidth(72)).toBe(72);
    expect(budgetBarWidth(100)).toBe(100);
    expect(budgetBarWidth(180)).toBe(100);
  });
});

describe("selectTopBudgets", () => {
  const budget = (category: string, amountCents: number, spentCents: number) => ({
    category,
    amountCents,
    spentCents,
  });

  it("keeps the budgets with the highest share spent, highest first", () => {
    const budgets = [
      budget("groceries", 30000, 15000), // 50%
      budget("leisure", 10000, 12000), // 120%
      budget("transport", 5000, 4500), // 90%
      budget("health", 20000, 2000), // 10%
    ];
    expect(selectTopBudgets(budgets, 3).map((b) => b.category)).toEqual([
      "leisure",
      "transport",
      "groceries",
    ]);
  });

  it("compares the exact share, not the rounded percentage", () => {
    const budgets = [budget("groceries", 1000, 790), budget("leisure", 1000, 799)];
    expect(selectTopBudgets(budgets, 3).map((b) => b.category)).toEqual(["leisure", "groceries"]);
  });

  it("keeps the original order for the same share and does not change the input", () => {
    const budgets = [budget("groceries", 1000, 500), budget("leisure", 2000, 1000)];
    const copy = [...budgets];
    expect(selectTopBudgets(budgets, 3).map((b) => b.category)).toEqual(["groceries", "leisure"]);
    expect(budgets).toEqual(copy);
  });

  it("returns every budget when there are fewer than the limit", () => {
    expect(selectTopBudgets([], 3)).toEqual([]);
    expect(selectTopBudgets([budget("groceries", 1000, 0)], 3)).toHaveLength(1);
  });
});
