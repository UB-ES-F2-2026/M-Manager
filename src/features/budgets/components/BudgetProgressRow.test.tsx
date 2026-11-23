// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import BudgetProgressRow from "./BudgetProgressRow";

// US3.1 · AC2, AC3: what the user sees in a budget row, rendered in a DOM.

afterEach(cleanup);

const WARNING_TEXT = "Has arribat al 80% del pressupost.";
const EXCEEDED_TEXT = "Has superat el pressupost.";

/** Normalises the non-breaking spaces that `Intl` puts in currency amounts. */
function text(element: HTMLElement): string {
  return (element.textContent ?? "").replace(/\s/g, " ");
}

function renderRow(spentCents: number, amountCents = 10000) {
  render(<BudgetProgressRow category="restaurants" amountCents={amountCents} spentCents={spentCents} />);
  const bar = screen.getByRole("progressbar", { name: "Pressupost de Restaurants" });
  const fill = bar.firstElementChild as HTMLElement;
  return { bar, fill };
}

describe("BudgetProgressRow", () => {
  it("shows the Catalan category, spent / limit and the whole percentage", () => {
    const { container } = render(
      <BudgetProgressRow category="restaurants" amountCents={25000} spentCents={18050} />,
    );

    expect(screen.getByText("Restaurants")).toBeTruthy();
    expect(text(container)).toContain("180,50 € / 250,00 €");
    expect(screen.getByText("72%")).toBeTruthy();
  });

  it.each([
    // spent (cents of 100 €) · % text · bar width · fill colour · alert
    { spent: 0, percent: "0%", width: "0%", fill: "bg-primary", alert: null },
    { spent: 7999, percent: "79%", width: "79%", fill: "bg-primary", alert: null },
    { spent: 8000, percent: "80%", width: "80%", fill: "bg-strength-3", alert: WARNING_TEXT },
    { spent: 9999, percent: "99%", width: "99%", fill: "bg-strength-3", alert: WARNING_TEXT },
    { spent: 10000, percent: "100%", width: "100%", fill: "bg-danger", alert: EXCEEDED_TEXT },
    { spent: 15000, percent: "150%", width: "100%", fill: "bg-danger", alert: EXCEEDED_TEXT },
  ])(
    "spent $spent of 10000 cents → $percent, bar $width, $fill",
    ({ spent, percent, width, fill, alert }) => {
      const { bar, fill: fillElement } = renderRow(spent);

      expect(screen.getByText(percent)).toBeTruthy();
      expect(fillElement.style.width).toBe(width);
      expect(fillElement.className).toContain(fill);
      expect(bar.getAttribute("aria-valuetext")).toBe(percent);
      expect(bar.getAttribute("aria-valuenow")).toBe(width.replace("%", ""));
      if (alert === null) {
        expect(screen.queryByText(WARNING_TEXT)).toBeNull();
        expect(screen.queryByText(EXCEEDED_TEXT)).toBeNull();
      } else {
        expect(screen.getByText(alert)).toBeTruthy();
      }
    },
  );

  it("shows only one alert at a time", () => {
    renderRow(12000);

    expect(screen.getByText(EXCEEDED_TEXT)).toBeTruthy();
    expect(screen.queryByText(WARNING_TEXT)).toBeNull();
  });

  it("paints the percentage red only once the budget is exceeded", () => {
    renderRow(9999);
    expect(screen.getByText("99%").className).not.toContain("text-danger");
    cleanup();

    renderRow(10000);
    expect(screen.getByText("100%").className).toContain("text-danger");
  });

  it("exposes the bar to screen readers with a 0–100 range", () => {
    const { bar } = renderRow(4550);

    expect(bar.getAttribute("aria-valuemin")).toBe("0");
    expect(bar.getAttribute("aria-valuemax")).toBe("100");
    expect(bar.getAttribute("aria-valuenow")).toBe("45");
  });

  it("animates width changes in 300 ms ease-out and updates when the data changes", () => {
    const { rerender } = render(
      <BudgetProgressRow category="transport" amountCents={10000} spentCents={6000} />,
    );
    const fill = screen.getByRole("progressbar").firstElementChild as HTMLElement;
    expect(fill.className).toContain("duration-300");
    expect(fill.className).toContain("ease-out");
    expect(fill.style.width).toBe("60%");

    // Convex pushes a new spentCents: same element, new width and colour.
    rerender(<BudgetProgressRow category="transport" amountCents={10000} spentCents={8200} />);

    expect(screen.getByRole("progressbar").firstElementChild).toBe(fill);
    expect(fill.style.width).toBe("82%");
    expect(fill.className).toContain("bg-strength-3");
    expect(screen.getByText(WARNING_TEXT)).toBeTruthy();
  });

  it("does not break with a zero limit", () => {
    const { fill } = renderRow(500, 0);

    expect(screen.getByText("0%")).toBeTruthy();
    expect(fill.style.width).toBe("0%");
  });
});
