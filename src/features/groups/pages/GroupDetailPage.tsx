import { useQuery } from "convex/react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../../../convex/_generated/api";
import BottomNav from "../../../components/layout/BottomNav";
import { PlusIcon } from "../../../components/ui/icons";
import GroupBalances from "../components/GroupBalances";
import GroupExpenseHistory from "../components/GroupExpenseHistory";
import GroupInviteCard from "../components/GroupInviteCard";
import GroupMemberList from "../components/GroupMemberList";
import GroupSettleUp from "../components/GroupSettleUp";
import { newGroupExpensePath } from "../groupExpensePaths";

/**
 * US4.1: /groups/:groupId, the group with its invite code and members.
 * US4.2: below them, «Afegir despesa» and the expense history.
 * US4.3: between those two, «Balanços» and «Per saldar».
 * `groups.get` returns null for a missing group and for one the user is not
 * in, so both show the same message and nobody learns that the group exists.
 */
export default function GroupDetailPage() {
  const { groupId = "" } = useParams();
  const group = useQuery(api.groups.get, { groupId });
  const expenses = useQuery(api.groups.listExpenses, { groupId });
  const balanceSummary = useQuery(api.groups.getBalances, { groupId });

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto flex max-w-md flex-col gap-6 px-5 pt-8 pb-28">
        <Link to="/groups" className="self-start text-sm font-medium text-primary">
          ← Tornar
        </Link>

        {group === undefined ? (
          <p role="status" className="text-sm text-slate-500">
            Carregant el grup…
          </p>
        ) : group === null ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
            No s'ha trobat el grup.
          </p>
        ) : (
          <>
            <header className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold break-words text-slate-900">{group.name}</h1>
              {group.description !== "" && (
                <p className="text-sm break-words text-slate-500">{group.description}</p>
              )}
            </header>
            <GroupInviteCard code={group.code} />
            <GroupMemberList members={group.members} />
            <Link
              to={newGroupExpensePath(group._id)}
              className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white"
            >
              <PlusIcon className="size-5" />
              Afegir despesa
            </Link>
            <GroupBalances summary={balanceSummary} />
            <GroupSettleUp groupId={group._id} summary={balanceSummary} />
            <GroupExpenseHistory expenses={expenses} />
          </>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
