import { describe, expect, it } from "vitest";
import { formatMoney } from "../../lib/money";
import { balanceStatus, settleDebtDescription, transferSummary } from "./settleDebtTexts";

describe("balanceStatus", () => {
  it("says «Li deuen» in green when the balance is positive", () => {
    expect(balanceStatus(2500)).toEqual({ label: "Li deuen", className: "text-success" });
  });

  it("says «Deu» in red when the balance is negative", () => {
    expect(balanceStatus(-1)).toEqual({ label: "Deu", className: "text-danger" });
  });

  it("says «En pau» in grey when the balance is zero", () => {
    expect(balanceStatus(0)).toEqual({ label: "En pau", className: "text-slate-500" });
  });
});

describe("transferSummary", () => {
  it("names the debtor and the creditor", () => {
    expect(transferSummary({ fromName: "Anna", toName: "Pau" })).toBe("Anna paga a Pau");
  });

  it("uses a placeholder for members without a name", () => {
    expect(transferSummary({ fromName: "  ", toName: "Pau" })).toBe(
      "Membre sense nom paga a Pau",
    );
  });
});

describe("settleDebtDescription", () => {
  it("explains who pays how much to whom", () => {
    expect(settleDebtDescription({ fromName: "Anna", toName: "Pau", amountCents: 2550 })).toBe(
      `Es registrarà que Anna ha pagat ${formatMoney(2550)} a Pau. Aquesta acció no es pot desfer.`,
    );
  });
});
