import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
import BottomNav from "../../../components/layout/BottomNav";
import AccountList from "../components/AccountList";
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
 * Static main screen (US1.2). Only the user's name is real; balances,
 * accounts and transactions are sample data from homeSampleData.ts.
 */
export default function HomePage() {
  const user = useQuery(api.users.currentUser);
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
