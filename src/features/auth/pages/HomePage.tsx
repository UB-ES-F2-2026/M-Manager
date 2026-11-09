import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
import BottomNav from "../../../components/layout/BottomNav";
import { formatMonthLabel, getMonthBounds } from "../../transactions/monthBounds";
import AccountList from "../components/AccountList";
import BalanceCard from "../components/BalanceCard";
import HomeHeader from "../components/HomeHeader";
import HomeSection from "../components/HomeSection";
import SessionLoading from "../components/SessionLoading";
import TransactionList from "../components/TransactionList";
import { SAMPLE_ACCOUNTS, SAMPLE_TRANSACTIONS } from "../homeSampleData";

/**
 * Main screen. Monthly savings come from Convex (US2.4);
 * accounts and recent movements are still sample data on this story branch.
 */
export default function HomePage() {
  const user = useQuery(api.users.currentUser);
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
        {savings === undefined ? (
          <section className="flex flex-col gap-1 rounded-2xl bg-primary px-5 py-5 text-white">
            <h2 className="text-sm text-white/80">Estalvi del mes</h2>
            <p className="text-3xl font-bold text-white/70">Carregant…</p>
            <p className="text-xs text-white/75">{formatMonthLabel(now)}</p>
          </section>
        ) : (
          <BalanceCard
            savingsCents={savings.savingsCents}
            monthLabel={formatMonthLabel(now)}
          />
        )}
        <HomeSection title="Els meus comptes" actionLabel="Veure'ls tots">
          <AccountList accounts={SAMPLE_ACCOUNTS} />
        </HomeSection>
        <HomeSection title="Últims moviments" actionLabel="Veure'ls tots">
          <TransactionList transactions={SAMPLE_TRANSACTIONS} nowMs={now} />
        </HomeSection>
      </main>
      <BottomNav />
    </div>
  );
}
