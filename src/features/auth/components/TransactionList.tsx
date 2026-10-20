import { IncomeIcon, TransferIcon } from "../../../components/ui/icons";
import { formatRelativeDay } from "../../../lib/dates";
import { formatSignedMoney } from "../../../lib/money";
import type { SampleTransaction } from "../homeSampleData";

type TransactionListProps = {
  transactions: SampleTransaction[];
  nowMs: number;
};

/** "Últims moviments": income in green, expenses in the default text colour. */
export default function TransactionList({ transactions, nowMs }: TransactionListProps) {
  return (
    <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
      {transactions.map((transaction) => {
        const isIncome = transaction.type === "income";
        return (
          <li key={transaction.id} className="flex items-center gap-3 px-4 py-3">
            <span
              aria-hidden="true"
              className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                isIncome ? "bg-green-50 text-success" : "bg-slate-100 text-slate-600"
              }`}
            >
              {isIncome ? <IncomeIcon className="size-5" /> : <TransferIcon className="size-5" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-slate-900">{transaction.title}</p>
              <p className="text-xs text-slate-500">
                {transaction.bankName} · {formatRelativeDay(transaction.date, nowMs)}
              </p>
            </div>
            <p className={`font-semibold ${isIncome ? "text-success" : "text-slate-900"}`}>
              {formatSignedMoney(transaction.amountCents, transaction.type)}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
