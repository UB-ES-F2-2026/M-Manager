import { formatMoney } from "../../lib/money";
import { payerName } from "./groupExpenseSummary";

type TransferNames = { fromName: string; toName: string };

/** «Balanços» row status (US4.3): who is owed, who owes and who is even. */
export function balanceStatus(balanceCents: number): { label: string; className: string } {
  if (balanceCents > 0) {
    return { label: "Li deuen", className: "text-success" };
  }
  if (balanceCents < 0) {
    return { label: "Deu", className: "text-danger" };
  }
  return { label: "En pau", className: "text-slate-500" };
}

/** «Per saldar» card text: «{deutor} paga a {creditor}». */
export function transferSummary(transfer: TransferNames): string {
  return `${payerName(transfer.fromName)} paga a ${payerName(transfer.toName)}`;
}

/** Description of the «Saldar deute» confirmation dialog. */
export function settleDebtDescription(transfer: TransferNames & { amountCents: number }): string {
  return (
    `Es registrarà que ${payerName(transfer.fromName)} ha pagat ` +
    `${formatMoney(transfer.amountCents)} a ${payerName(transfer.toName)}. ` +
    "Aquesta acció no es pot desfer."
  );
}
