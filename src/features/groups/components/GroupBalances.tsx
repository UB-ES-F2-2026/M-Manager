import type { FunctionReturnType } from "convex/server";
import type { api } from "../../../../convex/_generated/api";
import { formatMoney } from "../../../lib/money";
import { initialsFromLabel } from "../../../lib/initialsFromLabel";
import { payerName } from "../groupExpenseSummary";
import { balanceStatus } from "../settleDebtTexts";

type GroupBalancesProps = {
  /** Result of `api.groups.getBalances`; undefined while it loads. */
  summary: FunctionReturnType<typeof api.groups.getBalances> | undefined;
};

/**
 * «Balanços» of the group detail (US4.3): one row per member with what they
 * are owed (green) or owe (red). The backend computes the amounts.
 */
export default function GroupBalances({ summary }: GroupBalancesProps) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-slate-900">Balanços</h2>
      {summary === undefined ? (
        <p className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
          Carregant…
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {(summary?.balances ?? []).map((balance) => {
            const name = payerName(balance.name);
            const status = balanceStatus(balance.balanceCents);
            return (
              <li key={balance.userId} className="flex items-center gap-3 px-4 py-3">
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary"
                >
                  {initialsFromLabel(name)}
                </span>
                <p className="min-w-0 flex-1 truncate font-medium text-slate-900">{name}</p>
                <div className={`text-right ${status.className}`}>
                  <p className="font-semibold">{formatMoney(Math.abs(balance.balanceCents))}</p>
                  <p className="text-xs">{status.label}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
