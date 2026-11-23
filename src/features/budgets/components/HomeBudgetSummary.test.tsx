// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import type { BudgetCategory } from "../../../../convex/lib/budgetCategories";
import HomeBudgetSummary, { HOME_BUDGET_LIMIT } from "./HomeBudgetSummary";

// US3.1 · AC2: the «Pressupostos» section of the home screen.

afterEach(cleanup);

function budget(category: BudgetCategory, amountCents: number, spentCents: number) {
  return { _id: `budget-${category}`, category, amountCents, spentCents };
}

function renderSummary(budgets: Parameters<typeof HomeBudgetSummary>[0]["budgets"]) {
  return render(
    <MemoryRouter>
      <HomeBudgetSummary budgets={budgets} />
    </MemoryRouter>,
  );
}

describe("HomeBudgetSummary", () => {
  it("shows «Carregant…» while the query loads", () => {
    renderSummary(undefined);

    expect(screen.getByText("Carregant…")).toBeTruthy();
    expect(screen.queryByRole("progressbar")).toBeNull();
  });

  it("invites to create the first budget when there are none", () => {
    renderSummary([]);

    expect(screen.getByText("Encara no tens pressupostos.")).toBeTruthy();
    const link = screen.getByRole("link", { name: "Crear un pressupost" });
    expect(link.getAttribute("href")).toBe("/budgets/new");
  });

  it(`shows at most ${HOME_BUDGET_LIMIT} budgets, the most spent first`, () => {
    renderSummary([
      budget("groceries", 40000, 10000), // 25%
      budget("transport", 10000, 11000), // 110%
      budget("leisure", 20000, 17000), // 85%
      budget("restaurants", 10000, 9900), // 99%
      budget("health", 5000, 0), // 0%
    ]);

    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(HOME_BUDGET_LIMIT);
    expect(rows.map((row) => within(row).getByRole("progressbar").getAttribute("aria-label"))).toEqual([
      "Pressupost de Transport",
      "Pressupost de Restaurants",
      "Pressupost de Oci",
    ]);
    expect(within(rows[0]).getByText("Has superat el pressupost.")).toBeTruthy();
    expect(within(rows[1]).getByText("Has arribat al 80% del pressupost.")).toBeTruthy();
    expect(screen.queryByText("Supermercat")).toBeNull();
  });
});
