import { useState } from "react";
import BottomNav from "../../../components/layout/BottomNav";
import { TransferIcon } from "../../../components/ui/icons";
import { formatRelativeDay } from "../../../lib/dates";
import TransactionHistoryItem from "../components/TransactionHistoryItem";
import { useTransactionHistory } from "../hooks/useTransactionHistory";

/** US2.3: every transaction of the user, newest first, grouped by day. */
export default function TransactionHistoryPage() {
  const days = useTransactionHistory();
  const [now] = useState(() => Date.now());

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto flex max-w-md flex-col gap-6 px-5 pt-8 pb-28">
        <h1 className="text-2xl font-bold text-slate-900">Moviments</h1>

        {days === undefined ? (
          <p role="status" className="text-sm text-slate-500">
            Carregant els moviments…
          </p>
        ) : days.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary">
              <TransferIcon />
            </span>
            <p className="font-medium text-slate-900">Encara no tens moviments</p>
            <p className="text-sm text-slate-500">
              Quan registris un ingrés o una despesa, el veuràs aquí.
            </p>
          </div>
        ) : (
          days.map((day) => (
            <section key={day.dayStartMs} className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-slate-500">
                {formatRelativeDay(day.dayStartMs, now)}
              </h2>
              <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
                {day.transactions.map((transaction) => (
                  <TransactionHistoryItem key={transaction._id} transaction={transaction} />
                ))}
              </ul>
            </section>
          ))
        )}
      </main>
      <BottomNav />
    </div>
  );
}
