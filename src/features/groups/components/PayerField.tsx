import { useId } from "react";
import type { Id } from "../../../../convex/_generated/dataModel";
import type { GroupMember } from "../hooks/useGroupExpenseForm";
import { memberLabel } from "../memberLabel";

type PayerFieldProps = {
  members: readonly GroupMember[];
  currentUserId: Id<"users"> | undefined;
  value: Id<"users"> | "";
  onChange: (value: Id<"users"> | "") => void;
  error?: string;
  disabled?: boolean;
};

/** «Qui ha pagat»: dropdown of the group members, with the same look as CategoryField. */
export default function PayerField({
  members,
  currentUserId,
  value,
  onChange,
  error,
  disabled,
}: PayerFieldProps) {
  const selectId = useId();
  const messageId = `${selectId}-message`;
  const borderClasses = error ? "border-danger" : "border-slate-300 focus:border-primary";

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-sm font-medium text-slate-900">
        Qui ha pagat
      </label>
      <select
        id={selectId}
        name="paidBy"
        value={value}
        onChange={(event) => onChange(event.target.value as Id<"users"> | "")}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? messageId : undefined}
        className={`rounded-lg border bg-white px-3 py-2.5 text-sm outline-none disabled:bg-slate-100 disabled:text-slate-400 ${borderClasses} ${
          value === "" ? "text-slate-400" : "text-slate-900"
        }`}
      >
        <option value="" disabled>
          Tria qui ha pagat
        </option>
        {members.map((member) => (
          <option key={member.userId} value={member.userId} className="text-slate-900">
            {memberLabel(member, currentUserId)}
          </option>
        ))}
      </select>
      {error && (
        <p id={messageId} role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
