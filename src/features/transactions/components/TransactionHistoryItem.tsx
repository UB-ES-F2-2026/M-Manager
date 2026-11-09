import { IncomeIcon, TransferIcon } from "../../../components/ui/icons";
import { formatSignedMoney } from "../../../lib/money";
import { CATEGORY_LABELS } from "../categoryLabels";
import type { Transaction } from "../hooks/useTransactionHistory";

/** One row of the history: concept, category and signed amount (income green, expenses red). */
export default function TransactionHistoryItem({ transaction }: { transaction: Transaction }) {
  const isIncome = transaction.type === "income";

  return (
    <li className="flex items-center gap-3 px-4 py-3">
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
        <p className="text-xs text-slate-500">{CATEGORY_LABELS[transaction.category]}</p>
      </div>
      <p className={`font-semibold ${isIncome ? "text-success" : "text-danger"}`}>
        {formatSignedMoney(transaction.amountCents, transaction.type)}
      </p>
    </li>
  );
}
