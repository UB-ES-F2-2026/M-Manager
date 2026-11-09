import { useQuery } from "convex/react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../../../convex/_generated/api";
import BottomNav from "../../../components/layout/BottomNav";
import { PlusIcon } from "../../../components/ui/icons";
import NetWorthList from "../../net-worth/components/NetWorthList";
import { formatMonthLabel, getMonthBounds } from "../../transactions/monthBounds";
import { selectRecentTransactions } from "../../transactions/selectRecentTransactions";
import BalanceCard from "../components/BalanceCard";
import HomeHeader from "../components/HomeHeader";
import HomeSection from "../components/HomeSection";
import MonthlySavingsCard from "../components/MonthlySavingsCard";
import SessionLoading from "../components/SessionLoading";
import TransactionList from "../components/TransactionList";
import { SAMPLE_ACCOUNTS, SAMPLE_TOTAL_BALANCE_CENTS } from "../homeSampleData";

/**
 * Main screen. Monthly savings (US2.4), recent movements (US2.3) and assets /
 * debts (US3.2) come from Convex; the total balance is still sample data for now.
 */
export default function HomePage() {
  const user = useQuery(api.users.currentUser);
  const transactions = useQuery(api.transactions.list, {});
  const netWorth = useQuery(api.netWorth.list);
  const [now] = useState(() => Date.now());
  const monthBounds = getMonthBounds(now);
  const savings = useQuery(api.transactions.monthlySavings, monthBounds);

  if (!user) {
    return <SessionLoading />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto flex max-w-md flex-col gap-6 px-5 pt-8 pb-28">
        <HomeHeader name={user.name} />
        <BalanceCard
          totalCents={SAMPLE_TOTAL_BALANCE_CENTS}
          accountCount={SAMPLE_ACCOUNTS.length}
        />
        {savings === undefined ? (
          <section className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white px-5 py-4">
            <h2 className="text-sm text-slate-500">Estalvi del mes</h2>
            <p className="text-2xl font-bold text-slate-400">Carregant…</p>
            <p className="text-xs text-slate-500">{formatMonthLabel(now)}</p>
          </section>
        ) : (
          <MonthlySavingsCard
            savingsCents={savings.savingsCents}
            monthLabel={formatMonthLabel(now)}
          />
        )}
        <Link
          to="/transactions/new"
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white"
        >
          <PlusIcon className="size-5" />
          Afegir moviment
        </Link>
        <HomeSection title="Actius i deutes" actionLabel="Veure'ls tots">
          {netWorth === undefined ? (
            <p className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
              Carregant…
            </p>
          ) : (
            <NetWorthList assets={netWorth.assets} debts={netWorth.debts} />
          )}
        </HomeSection>
        <Link
          to="/net-worth/new"
          className="-mt-3 flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-3 text-sm font-medium text-primary"
        >
          <PlusIcon className="size-4" />
          Afegir un actiu o un deute
        </Link>
        <HomeSection
          title="Últims moviments"
          actionLabel="Veure'ls tots"
          actionTo="/transactions"
        >
          {transactions === undefined ? (
            <p className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
              Carregant…
            </p>
          ) : (
            <TransactionList
              transactions={selectRecentTransactions(transactions)}
              nowMs={now}
            />
          )}
        </HomeSection>
      </main>
      <BottomNav />
    </div>
  );
}
