import type { BudgetCategory } from "../../../../convex/lib/budgetCategories";
import { formatMoney } from "../../../lib/money";
import { CATEGORY_LABELS } from "../../transactions/categoryLabels";
import { budgetBarWidth, budgetPercent, budgetStatus, type BudgetStatus } from "../budgetProgress";

type BudgetProgressRowProps = {
  category: BudgetCategory;
  amountCents: number;
  spentCents: number;
};

const FILL_CLASSES: Record<BudgetStatus, string> = {
  ok: "bg-primary",
  warning: "bg-strength-3",
  exceeded: "bg-danger",
};

/**
 * One budget with its progress bar (US3.1 · AC2, AC3): category, "spent / limit",
 * whole percentage, a bar coloured by threshold and the inline alert.
 * Used by the home summary and meant for the /budgets screen too.
 */
export default function BudgetProgressRow({ category, amountCents, spentCents }: BudgetProgressRowProps) {
  const percent = budgetPercent({ amountCents, spentCents });
  const status = budgetStatus(percent);
  const label = CATEGORY_LABELS[category];

  return (
    <div className="flex flex-col gap-2 px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900">{label}</p>
          <p className="text-xs text-slate-500">
            {formatMoney(spentCents)} / {formatMoney(amountCents)}
          </p>
        </div>
        <p className={`text-sm font-semibold ${status === "exceeded" ? "text-danger" : "text-slate-900"}`}>
          {percent}%
        </p>
      </div>
      <div
        role="progressbar"
        aria-label={`Pressupost de ${label}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={budgetBarWidth(percent)}
        aria-valuetext={`${percent}%`}
        className="h-2 overflow-hidden rounded-full bg-slate-100"
      >
        <div
          className={`h-2 rounded-full transition-all duration-300 ease-out ${FILL_CLASSES[status]}`}
          // Dynamic width is the one case where the README allows `style`.
          style={{ width: `${budgetBarWidth(percent)}%` }}
        />
      </div>
      {status === "warning" && (
        <p className="flex items-center gap-1.5 text-xs text-slate-700">
          <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-strength-3" />
          Has arribat al 80% del pressupost.
        </p>
      )}
      {status === "exceeded" && <p className="text-xs text-danger">Has superat el pressupost.</p>}
    </div>
  );
}
