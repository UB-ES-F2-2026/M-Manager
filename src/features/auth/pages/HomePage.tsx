import { useQuery } from "convex/react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../../../convex/_generated/api";
import BottomNav from "../../../components/layout/BottomNav";
import { PlusIcon } from "../../../components/ui/icons";
import NetWorthList from "../../net-worth/components/NetWorthList";
import BalanceCard from "../components/BalanceCard";
import HomeHeader from "../components/HomeHeader";
import HomeSection from "../components/HomeSection";
import SessionLoading from "../components/SessionLoading";
import TransactionList from "../components/TransactionList";
import {
  SAMPLE_ACCOUNTS,
  SAMPLE_TOTAL_BALANCE_CENTS,
  SAMPLE_TRANSACTIONS,
} from "../homeSampleData";

/**
 * Main screen. Assets and debts come from Convex (US3.2);
 * the balance card and recent movements are still sample data for now.
 */
export default function HomePage() {
  const user = useQuery(api.users.currentUser);
  const netWorth = useQuery(api.netWorth.list);
  const [now] = useState(() => Date.now());

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
        <HomeSection title="Últims moviments" actionLabel="Veure'ls tots">
          <TransactionList transactions={SAMPLE_TRANSACTIONS} nowMs={now} />
        </HomeSection>
      </main>
      <BottomNav />
    </div>
  );
}
