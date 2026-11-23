import { useQuery } from "convex/react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../../../convex/_generated/api";
import { PlusIcon } from "../../../components/ui/icons";
import { getMonthBounds } from "../../transactions/monthBounds";
import BudgetList from "../components/BudgetList";

/**
 * US3.1 analysis screen (/budgets): every budget with what has been spent this
 * month, its progress bar and the 80% / 100% alerts. Spending comes from the
 * backend and updates on its own when a transaction or a budget changes.
 */
export default function BudgetsPage() {
  const [now] = useState(() => Date.now());
  const budgets = useQuery(api.budgets.list, getMonthBounds(now));

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto flex max-w-md flex-col gap-6 px-5 py-8">
        <header className="flex flex-col gap-3">
          <Link to="/" className="self-start text-sm font-medium text-primary">
            ← Tornar
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Pressupostos</h1>
        </header>

        <Link
          to="/budgets/new"
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white"
        >
          <PlusIcon className="size-5" />
          Nou pressupost
        </Link>

        <BudgetList budgets={budgets} />
      </main>
    </div>
  );
}
