import { describe, expect, it } from "vitest";
import { groupExpenseSummary, participantCountText, payerName } from "./groupExpenseSummary";

describe("groupExpenseSummary", () => {
  it("says who paid, how many take part and the date in Catalan", () => {
    const summary = groupExpenseSummary({
      paidByName: "Ana",
      participantCount: 3,
      _creationTime: new Date(2026, 10, 23, 18, 30).getTime(),
    });
    // The exact month text depends on the ICU data ("23 de nov. 2026" or "… del 2026").
    expect(summary).toMatch(/^Pagat per Ana · 3 persones · 23 de nov\. (del )?2026$/);
  });

  it("names a payer without a name", () => {
    expect(
      groupExpenseSummary({ paidByName: " ", participantCount: 2, _creationTime: 0 }),
    ).toMatch(/^Pagat per Membre sense nom · 2 persones · /);
  });
});

describe("participantCountText", () => {
  it("uses the singular for one person", () => {
    expect(participantCountText(1)).toBe("1 persona");
    expect(participantCountText(4)).toBe("4 persones");
  });
});

describe("payerName", () => {
  it("trims the name", () => {
    expect(payerName("  Bernat ")).toBe("Bernat");
  });
});
