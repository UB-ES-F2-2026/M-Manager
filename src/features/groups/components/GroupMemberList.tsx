import type { FunctionReturnType } from "convex/server";
import type { api } from "../../../../convex/_generated/api";

type GroupMembers = NonNullable<FunctionReturnType<typeof api.groups.get>>["members"];

type GroupMemberListProps = {
  members: GroupMembers;
};

/** «Membres» block of the group detail; the creator is tagged «Admin» (US4.1). */
export default function GroupMemberList({ members }: GroupMemberListProps) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-slate-900">Membres</h2>
      <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {members.map((member) => (
          <li key={member.userId} className="flex items-center gap-3 px-4 py-3">
            <p className="min-w-0 flex-1 truncate font-medium text-slate-900">
              {member.name.trim() === "" ? "Membre sense nom" : member.name}
            </p>
            {member.role === "owner" && (
              <span className="text-xs font-medium text-primary">Admin</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
