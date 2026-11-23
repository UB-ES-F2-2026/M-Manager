import type { UpcomingPayment } from "../../../../convex/lib/recurringOccurrences";
import { IncomeIcon, TransferIcon } from "../../../components/ui/icons";
import { formatRelativeDay } from "../../../lib/dates";
import { formatSignedMoney } from "../../../lib/money";
import { CATEGORY_LABELS } from "../categoryLabels";
import { selectHomeUpcomingPayments, upcomingDateToLocal } from "../upcomingPayments";

type UpcomingPaymentsListProps = {
  /** Result of `api.recurring.upcomingPayments`; undefined while it loads. */
  payments: UpcomingPayment[] | undefined;
  nowMs: number;
};

/**
 * Content of the home "Pròxims pagaments" section (US2.5 · AC2): the 5 nearest
 * occurrences of the user's recurring movements in the next 30 days. Same row
 * layout as "Últims moviments", but rows are not links (there is no detail screen).
 */
export default function UpcomingPaymentsList({ payments, nowMs }: UpcomingPaymentsListProps) {
  if (payments === undefined) {
    return (
      <p className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
        Carregant…
      </p>
    );
  }

  if (payments.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
        No tens pagaments els propers 30 dies.
      </p>
    );
  }

  // Fades in when the list first appears (starting: = @starting-style), not on
  // every reactive update, because the <ul> stays mounted (AC2).
  return (
    <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white transition-opacity duration-200 ease-out starting:opacity-0">
      {selectHomeUpcomingPayments(payments).map((payment) => {
        const isIncome = payment.type === "income";
        return (
          <li
            key={`${payment.sourceTransactionId}-${payment.date}`}
            className="flex items-center gap-3 px-4 py-3"
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
              <p className="truncate font-medium text-slate-900">{payment.concept}</p>
              <p className="text-xs text-slate-500">
                {CATEGORY_LABELS[payment.category]} ·{" "}
                {formatRelativeDay(upcomingDateToLocal(payment.date), nowMs)} ·{" "}
                <span className="text-primary">Recurrent</span>
              </p>
            </div>
            <p className={`font-semibold ${isIncome ? "text-success" : "text-danger"}`}>
              {formatSignedMoney(payment.amountCents, payment.type)}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
