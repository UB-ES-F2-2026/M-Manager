import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { BUDGET_CATEGORIES } from "../../../../convex/lib/budgetCategories";
import { CATEGORY_LABELS } from "../../transactions/categoryLabels";
import {
  budgetToFields,
  CATEGORY_TAKEN_MESSAGE,
  EMPTY_BUDGET_FIELDS,
  getBudgetErrors,
  INVALID_AMOUNT_FORMAT_MESSAGE,
  MISSING_CATEGORY_MESSAGE,
  NOT_FOUND_ALERT,
  parseBudgetFields,
  REQUIRED_FIELD_MESSAGE,
  SAVE_ERROR_ALERT,
  takenCategories,
} from "./useBudgetForm";

function budget(id: string, category: Doc<"budgets">["category"], amountCents = 30000) {
  return {
    _id: id as Id<"budgets">,
    _creationTime: 0,
    userId: "user" as Id<"users">,
    category,
    amountCents,
  } satisfies Doc<"budgets">;
}

describe("parseBudgetFields", () => {
  it("builds the create arguments from valid fields", () => {
    expect(parseBudgetFields({ category: "groceries", amount: " 300,50 " })).toEqual({
      args: { category: "groceries", amountCents: 30050 },
      errors: {},
    });
  });

  it("marks both fields when the form is empty", () => {
    expect(parseBudgetFields(EMPTY_BUDGET_FIELDS)).toEqual({
      args: null,
      errors: { category: MISSING_CATEGORY_MESSAGE, amount: REQUIRED_FIELD_MESSAGE },
    });
  });

  it.each(["abc", "12,345", "1.850,00", "-20"])("rejects the amount %s", (amount) => {
    expect(parseBudgetFields({ category: "leisure", amount }).errors).toEqual({
      amount: INVALID_AMOUNT_FORMAT_MESSAGE,
    });
  });

  it("rejects a zero limit with the backend message", () => {
    expect(parseBudgetFields({ category: "leisure", amount: "0" }).errors).toEqual({
      amount: "L'import ha de ser més gran que zero.",
    });
  });

  it("rejects a category that already has a budget", () => {
    expect(parseBudgetFields({ category: "groceries", amount: "100" }, ["groceries"])).toEqual({
      args: null,
      errors: { category: CATEGORY_TAKEN_MESSAGE },
    });
  });

  it("rejects an income category even if it is forced into the field", () => {
    const fields = { category: "salary", amount: "100" } as unknown as Parameters<
      typeof parseBudgetFields
    >[0];
    expect(parseBudgetFields(fields).errors).toEqual({ category: MISSING_CATEGORY_MESSAGE });
  });
});

describe("takenCategories", () => {
  const budgets = [budget("a", "groceries"), budget("b", "transport")];

  it("lists the categories that already have a budget", () => {
    expect(takenCategories(budgets)).toEqual(["groceries", "transport"]);
  });

  it("leaves out the budget being edited", () => {
    expect(takenCategories(budgets, "a" as Id<"budgets">)).toEqual(["transport"]);
  });
});

describe("budgetToFields", () => {
  it("shows the stored limit as the user would type it", () => {
    expect(budgetToFields(budget("a", "restaurants", 185000))).toEqual({
      category: "restaurants",
      amount: "1850,00",
    });
  });
});

describe("getBudgetErrors", () => {
  it("puts a duplicated category under the category field", () => {
    const error = new ConvexError({ code: "BUDGET_EXISTS", message: CATEGORY_TAKEN_MESSAGE });
    expect(getBudgetErrors(error)).toEqual({ fieldErrors: { category: CATEGORY_TAKEN_MESSAGE } });
  });

  it("puts an invalid amount under the amount field", () => {
    const error = new ConvexError({ code: "INVALID_AMOUNT", message: "Import no vàlid" });
    expect(getBudgetErrors(error)).toEqual({ fieldErrors: { amount: "Import no vàlid" } });
  });

  it("shows an alert when the budget no longer exists", () => {
    const error = new ConvexError({ code: "NOT_FOUND", message: "No s'ha trobat" });
    expect(getBudgetErrors(error)).toEqual({ fieldErrors: {}, alert: NOT_FOUND_ALERT });
  });

  it("shows a generic alert for anything else", () => {
    expect(getBudgetErrors(new Error("network"))).toEqual({
      fieldErrors: {},
      alert: SAVE_ERROR_ALERT,
    });
  });
});

describe("budget categories", () => {
  it("has a Catalan label for every category the form offers", () => {
    for (const category of BUDGET_CATEGORIES) {
      expect(CATEGORY_LABELS[category]).toEqual(expect.any(String));
    }
  });
});
