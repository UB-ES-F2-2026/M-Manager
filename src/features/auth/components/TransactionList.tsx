import { Link } from "react-router-dom";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { IncomeIcon, TransferIcon } from "../../../components/ui/icons";
import { formatRelativeDay } from "../../../lib/dates";
import { formatSignedMoney } from "../../../lib/money";
import { CATEGORY_LABELS } from "../../transactions/categoryLabels";
import { transactionEditPath } from "../../transactions/transactionEditPath";

type TransactionListProps = {
  transactions: Doc<"transactions">[];
  nowMs: number;
};

/**
 * "Últims moviments" on the home screen: real Convex rows, newest first.
 * Each row opens the edit screen of its transaction (US2.2).
 */
export default function TransactionList({ transactions, nowMs }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
        Encara no tens moviments.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {transactions.map((transaction) => {
        const isIncome = transaction.type === "income";
        return (
          <li key={transaction._id}>
            <Link
              to={transactionEditPath(transaction._id)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none"
            >
              <span
                aria-hidden="true"
                className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                  isIncome ? "bg-green-50 text-success" : "bg-danger-soft text-danger"
                }`}
              >
                {isIncome ? <IncomeIcon className="size-5" /> : <TransferIcon className="size-5" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-900">{transaction.concept}</p>
                <p className="text-xs text-slate-500">
                  {CATEGORY_LABELS[transaction.category]} ·{" "}
                  {formatRelativeDay(transaction.date, nowMs)}
                </p>
              </div>
              <p className={`font-semibold ${isIncome ? "text-success" : "text-danger"}`}>
                {formatSignedMoney(transaction.amountCents, transaction.type)}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
