import type { Id } from "../../../../convex/_generated/dataModel";
import type { SplitMode } from "../../../../convex/lib/splitModes";
import type { GroupExpenseFieldErrors, GroupMember } from "../hooks/useGroupExpenseForm";
import { memberLabel } from "../memberLabel";

type ParticipantListProps = {
  members: readonly GroupMember[];
  currentUserId: Id<"users"> | undefined;
  participants: readonly Id<"users">[];
  mode: SplitMode;
  /** Value typed for each participant in the current mode, by userId. */
  shares: Record<string, string>;
  fieldErrors: GroupExpenseFieldErrors;
  disabled: boolean;
  onToggle: (userId: Id<"users">) => void;
  onShareChange: (userId: Id<"users">, value: string) => void;
};

/**
 * «Qui participa»: one checkbox per member. With «Imports» or «Percentatges»,
 * each checked member gets a small field (€ or %) under their name.
 */
export default function ParticipantList({
  members,
  currentUserId,
  participants,
  mode,
  shares,
  fieldErrors,
  disabled,
  onToggle,
  onShareChange,
}: ParticipantListProps) {
  const unit = mode === "amounts" ? "€" : "%";
  const groupError = fieldErrors.participants ?? fieldErrors.split;

  return (
    <fieldset className="flex flex-col gap-1.5" aria-describedby={groupError ? "participants-message" : undefined}>
      <legend className="mb-1.5 text-sm font-medium text-slate-900">Qui participa</legend>
      <ul className="divide-y divide-slate-100 rounded-lg border border-slate-300">
        {members.map((member) => {
          const isChecked = participants.includes(member.userId);
          const label = memberLabel(member, currentUserId);
          const shareError = fieldErrors.shares?.[member.userId];
          return (
            <li key={member.userId} className="flex flex-col gap-2 px-3 py-2.5">
              <label className="flex items-center gap-3 text-sm text-slate-900">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggle(member.userId)}
                  disabled={disabled}
                  className="size-4 accent-primary"
                />
                {label}
              </label>
              {isChecked && mode !== "equal" && (
                <div className="flex flex-col gap-1 pl-7">
                  <div
                    className={`flex items-center rounded-lg border bg-white ${
                      shareError ? "border-danger" : "border-slate-300 focus-within:border-primary"
                    }`}
                  >
                    <input
                      aria-label={`${mode === "amounts" ? "Import" : "Percentatge"} de ${label}`}
                      aria-invalid={Boolean(shareError)}
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder={mode === "amounts" ? "0,00" : "0"}
                      value={shares[member.userId] ?? ""}
                      onChange={(event) => onShareChange(member.userId, event.target.value)}
                      disabled={disabled}
                      className="w-full min-w-0 rounded-lg bg-transparent px-3 py-1.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    />
                    <span className="pr-3 text-sm text-slate-500">{unit}</span>
                  </div>
                  {shareError && (
                    <p role="alert" className="text-xs text-danger">
                      {shareError}
                    </p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {groupError && (
        <p id="participants-message" role="alert" className="text-xs text-danger">
          {groupError}
        </p>
      )}
    </fieldset>
  );
}
