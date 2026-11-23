import type { FunctionReturnType } from "convex/server";
import { Link } from "react-router-dom";
import type { api } from "../../../../convex/_generated/api";
import { initialsFromLabel } from "../../../lib/initialsFromLabel";

type GroupListProps = {
  groups: FunctionReturnType<typeof api.groups.listMine>;
};

/** Groups the signed-in user belongs to; each row opens its detail (US4.1). */
export default function GroupList({ groups }: GroupListProps) {
  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center">
        <p className="text-sm text-slate-500">Encara no tens grups.</p>
        <Link to="/groups/new" className="text-sm font-medium text-primary">
          Crear un grup
        </Link>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {groups.map((group) => (
        <li key={group._id}>
          <Link
            to={`/groups/${group._id}`}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none"
          >
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary"
            >
              {initialsFromLabel(group.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-slate-900">{group.name}</p>
              {group.description !== "" && (
                <p className="truncate text-xs text-slate-500">{group.description}</p>
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
