import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type BudgetFormLayoutProps = {
  title: string;
  children: ReactNode;
};

/** White screen with "← Tornar" to /budgets and a title, shared by the new and edit screens. */
export default function BudgetFormLayout({ title, children }: BudgetFormLayoutProps) {
  return (
    <main className="flex min-h-screen justify-center bg-white px-6 py-8">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <header className="flex flex-col gap-3">
          <Link to="/budgets" className="self-start text-sm font-medium text-primary">
            ← Tornar
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        </header>
        {children}
      </div>
    </main>
  );
}
