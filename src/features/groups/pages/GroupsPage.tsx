import { useQuery } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "../../../../convex/_generated/api";
import BottomNav from "../../../components/layout/BottomNav";
import { PlusIcon } from "../../../components/ui/icons";
import GroupList from "../components/GroupList";

/** US4.1: /groups, the groups of the signed-in user plus the ways to create or join one. */
export default function GroupsPage() {
  const groups = useQuery(api.groups.listMine);

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto flex max-w-md flex-col gap-6 px-5 pt-8 pb-28">
        <h1 className="text-2xl font-bold text-slate-900">Grups</h1>

        <div className="flex flex-col items-center gap-3">
          <Link
            to="/groups/new"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white"
          >
            <PlusIcon className="size-5" />
            Crear un grup
          </Link>
          <Link to="/groups/join" className="text-sm font-medium text-primary">
            Tinc un codi
          </Link>
        </div>

        {groups === undefined ? (
          <p role="status" className="text-sm text-slate-500">
            Carregant els grups…
          </p>
        ) : (
          <GroupList groups={groups} />
        )}
      </main>
      <BottomNav />
    </div>
  );
}
