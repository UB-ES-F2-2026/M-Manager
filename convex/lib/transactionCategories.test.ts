import { describe, expect, it } from "vitest";
import {
  TRANSACTION_CATEGORIES,
  transactionCategoryValidator,
} from "./transactionCategories";

describe("TRANSACTION_CATEGORIES", () => {
  it("lists a fixed set of varied categories for income and expense", () => {
    expect(TRANSACTION_CATEGORIES).toEqual([
      "groceries",
      "transport",
      "housing",
      "leisure",
      "health",
      "education",
      "restaurants",
      "shopping",
      "subscriptions",
      "salary",
      "freelance",
      "gifts",
      "refunds",
      "other",
    ]);
  });

  it("keeps the Convex validator in sync with the exported list", () => {
    const fromValidator = transactionCategoryValidator.members.map(
      (member) => member.value,
    );
    expect(fromValidator).toEqual([...TRANSACTION_CATEGORIES]);
  });
});
