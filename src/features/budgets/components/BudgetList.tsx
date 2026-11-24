import { Link } from "react-router-dom";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { PlusIcon } from "../../../components/ui/icons";
import { budgetEditPath } from "../budgetEditPath";
import { selectTopBudgets } from "../budgetProgress";
import BudgetProgressRow from "./BudgetProgressRow";

type BudgetListProps = {
  /** Result of `api.budgets.list` for this month; undefined while it loads. */
  budgets: (Doc<"budgets"> & { spentCents: number })[] | undefined;
};

/**
 * Every budget of the user on /budgets (US3.1 · AC2, AC3), most spent first.
 * Each row opens its edit screen, where the limit can be changed.
 */
export default function BudgetList({ budgets }: BudgetListProps) {
  if (budgets === undefined) {
    return (
      <p className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
        Carregant…
      </p>
    );
  }

  if (budgets.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center">
        <p className="text-sm text-slate-500">Encara no tens pressupostos.</p>
        <Link
          to="/budgets/new"
          className="flex items-center gap-1 text-sm font-medium text-primary"
        >
          <PlusIcon className="size-4" />
          Crear un pressupost
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {selectTopBudgets(budgets, budgets.length).map((budget) => (
          <li key={budget._id}>
            <Link
              to={budgetEditPath(budget._id)}
              className="block hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none"
            >
              <BudgetProgressRow
                category={budget.category}
                amountCents={budget.amountCents}
                spentCents={budget.spentCents}
              />
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-xs text-slate-500">Toca un pressupost per editar-ne el límit.</p>
    </div>
  );
}
