import { Link } from "react-router-dom";
import type { BudgetCategory } from "../../../../convex/lib/budgetCategories";
import { selectTopBudgets } from "../budgetProgress";
import BudgetProgressRow from "./BudgetProgressRow";

/** Maximum budgets shown on the home screen; the rest are only on /budgets (US3.1 · AC2). */
export const HOME_BUDGET_LIMIT = 3;

type HomeBudget = {
  _id: string;
  category: BudgetCategory;
  amountCents: number;
  spentCents: number;
};

type HomeBudgetSummaryProps = {
  /** Result of `api.budgets.list` for this month; undefined while it loads. */
  budgets: HomeBudget[] | undefined;
};

/** Content of the home "Pressupostos" section: up to 3 budgets, most spent first. */
export default function HomeBudgetSummary({ budgets }: HomeBudgetSummaryProps) {
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
        <Link to="/budgets/new" className="text-sm font-medium text-primary">
          Crear un pressupost
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {selectTopBudgets(budgets, HOME_BUDGET_LIMIT).map((budget) => (
        <li key={budget._id}>
          <BudgetProgressRow
            category={budget.category}
            amountCents={budget.amountCents}
            spentCents={budget.spentCents}
          />
        </li>
      ))}
    </ul>
  );
}
