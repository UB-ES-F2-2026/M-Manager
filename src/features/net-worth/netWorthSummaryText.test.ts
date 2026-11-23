import { describe, expect, it } from "vitest";
import { LOADING_TEXT, netWorthSummaryText } from "./netWorthSummaryText";

describe("netWorthSummaryText", () => {
  it("shows Carregant… in both amounts while the query loads", () => {
    expect(netWorthSummaryText(undefined)).toEqual({
      netWorth: LOADING_TEXT,
      liquidity: LOADING_TEXT,
    });
    expect(LOADING_TEXT).toBe("Carregant…");
  });

  it("shows 0,00 € for both amounts with no assets or debts", () => {
    const text = netWorthSummaryText({ netWorthCents: 0, liquidityCents: 0 });
    expect(text.netWorth).toMatch(/^0,00\s€$/);
    expect(text.liquidity).toMatch(/^0,00\s€$/);
  });

  it("formats both amounts in euros", () => {
    const text = netWorthSummaryText({ netWorthCents: 1248032, liquidityCents: 391252 });
    expect(text.netWorth).toMatch(/^12\.480,32\s€$/);
    expect(text.liquidity).toMatch(/^3\.912,52\s€$/);
  });

  it("keeps the minus sign of a negative net worth", () => {
    const text = netWorthSummaryText({ netWorthCents: -50000, liquidityCents: 10000 });
    expect(text.netWorth).toMatch(/^[-−]500,00\s€$/);
    expect(text.liquidity).toMatch(/^100,00\s€$/);
  });
});
