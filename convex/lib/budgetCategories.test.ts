import { describe, expect, it } from "vitest";
import { BUDGET_CATEGORIES, budgetCategoryValidator } from "./budgetCategories";
import { TRANSACTION_CATEGORIES } from "./transactionCategories";

describe("BUDGET_CATEGORIES", () => {
  it("lists only the expense categories that can be budgeted", () => {
    expect(BUDGET_CATEGORIES).toEqual([
      "groceries",
      "transport",
      "housing",
      "leisure",
      "health",
      "education",
      "restaurants",
      "shopping",
      "subscriptions",
      "gifts",
      "other",
    ]);
  });

  it("only contains existing transaction categories", () => {
    for (const category of BUDGET_CATEGORIES) {
      expect(TRANSACTION_CATEGORIES).toContain(category);
    }
  });

  it("excludes income-only categories", () => {
    const budgetable: readonly string[] = BUDGET_CATEGORIES;
    expect(budgetable).not.toContain("salary");
    expect(budgetable).not.toContain("freelance");
    expect(budgetable).not.toContain("refunds");
  });

  it("keeps the Convex validator in sync with the exported list", () => {
    const fromValidator = budgetCategoryValidator.members.map(
      (member) => member.value,
    );
    expect(fromValidator).toEqual([...BUDGET_CATEGORIES]);
  });
});
