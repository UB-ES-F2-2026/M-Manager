import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { BottomNav } from "../../../components/layout/BottomNav";
import { FullPageSpinner } from "../../../components/ui/Spinner";
import { BalanceCard } from "../components/BalanceCard";
import { HomeHeader } from "../components/HomeHeader";
import { RecentTransactions } from "../components/RecentTransactions";

/** Main menu shown after signing in (US1.2 AC1). Protected by RequireAuth. */
export function HomePage() {
  const user = useQuery(api.users.currentUser);

  if (!user) {
    return <FullPageSpinner />;
  }

  return (
    <div className="min-h-screen bg-surface">
      <main className="mx-auto flex max-w-md flex-col gap-6 px-5 pt-8 pb-28">
        <HomeHeader name={user.name} />
        <BalanceCard />
        <RecentTransactions />
      </main>
      <BottomNav />
    </div>
  );
}
