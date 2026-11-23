import type { FunctionReturnType } from "convex/server";
import type { api } from "../../../../convex/_generated/api";
import Button from "../../../components/ui/Button";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { formatMoney } from "../../../lib/money";
import { useSettleDebt } from "../hooks/useSettleDebt";
import { settleDebtDescription, transferSummary } from "../settleDebtTexts";

type GroupSettleUpProps = {
  groupId: string;
  /** Result of `api.groups.getBalances`; undefined while it loads. */
  summary: FunctionReturnType<typeof api.groups.getBalances> | undefined;
};

/**
 * «Per saldar» of the group detail (US4.3): the suggested payments, each with
 * «Saldar deute». Any member can settle; once recorded, Convex recomputes the
 * balances and this list on its own.
 */
export default function GroupSettleUp({ groupId, summary }: GroupSettleUpProps) {
  const { selected, isSettling, error, requestSettle, cancelSettle, confirmSettle } =
    useSettleDebt(groupId);
  const transfers = summary?.transfers ?? [];

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-slate-900">Per saldar</h2>
      {summary === undefined ? (
        <p className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
          Carregant…
        </p>
      ) : transfers.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
          No hi ha deutes pendents.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {transfers.map((transfer) => (
            <li
              key={`${transfer.fromUserId}-${transfer.toUserId}`}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 text-sm break-words text-slate-600">
                  {transferSummary(transfer)}
                </p>
                <p className="shrink-0 text-lg font-bold text-slate-900">
                  {formatMoney(transfer.amountCents)}
                </p>
              </div>
              <Button onClick={() => requestSettle(transfer)}>Saldar deute</Button>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={selected !== null}
        title="Saldar deute"
        description={selected === null ? "" : settleDebtDescription(selected)}
        confirmLabel="Confirmar pagament"
        confirmVariant="primary"
        loading={isSettling}
        error={error}
        onConfirm={confirmSettle}
        onCancel={cancelSettle}
      />
    </section>
  );
}
