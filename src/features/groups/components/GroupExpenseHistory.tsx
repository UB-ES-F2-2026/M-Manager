import type { FunctionReturnType } from "convex/server";
import type { api } from "../../../../convex/_generated/api";
import { formatMoney } from "../../../lib/money";
import { initialsFromLabel } from "../../../lib/initialsFromLabel";
import { groupExpenseSummary, payerName } from "../groupExpenseSummary";

type GroupExpenseHistoryProps = {
  /** Result of `api.groups.listExpenses`; undefined while it loads. */
  expenses: FunctionReturnType<typeof api.groups.listExpenses> | undefined;
};

/**
 * «Historial» of the group detail (US4.2 AC3): the group's expenses, most
 * recent first, with the same row layout as the transaction list. Convex
 * updates it on its own when someone adds an expense.
 */
export default function GroupExpenseHistory({ expenses }: GroupExpenseHistoryProps) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-slate-900">Historial</h2>
      {expenses === undefined ? (
        <p className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
          Carregant…
        </p>
      ) : expenses === null || expenses.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
          Encara no hi ha despeses al grup.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {expenses.map((expense) => (
            <li key={expense._id} className="flex items-center gap-3 px-4 py-3">
              <span
                aria-hidden="true"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary"
              >
                {initialsFromLabel(payerName(expense.paidByName))}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-900">{expense.concept}</p>
                <p className="text-xs text-slate-500">{groupExpenseSummary(expense)}</p>
              </div>
              <p className="font-semibold text-danger">{formatMoney(expense.amountCents)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
