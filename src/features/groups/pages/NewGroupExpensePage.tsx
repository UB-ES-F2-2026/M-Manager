import { useQuery } from "convex/react";
import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import Button from "../../../components/ui/Button";
import FormAlert from "../../../components/ui/FormAlert";
import TextField from "../../../components/ui/TextField";
import SessionLoading from "../../auth/components/SessionLoading";
import ParticipantList from "../components/ParticipantList";
import PayerField from "../components/PayerField";
import SplitModeToggle from "../components/SplitModeToggle";
import { groupPath } from "../groupExpensePaths";
import { NOT_FOUND_ALERT, useGroupExpenseForm, type GroupMember } from "../hooks/useGroupExpenseForm";

/** US4.2: add a shared expense to a group, at /groups/:groupId/expenses/new. Members only. */
export default function NewGroupExpensePage() {
  const { groupId = "" } = useParams();
  const group = useQuery(api.groups.get, { groupId });
  const user = useQuery(api.users.currentUser);

  if (group === undefined || user === undefined) {
    return <SessionLoading />;
  }

  if (group === null) {
    // Same screen for a missing group and a group the user is not in (README §7).
    return (
      <ExpenseLayout backTo="/">
        <FormAlert title={NOT_FOUND_ALERT.title} description={NOT_FOUND_ALERT.description} />
      </ExpenseLayout>
    );
  }

  return (
    <ExpenseLayout backTo={groupPath(group._id)}>
      <NewGroupExpenseForm groupId={group._id} members={group.members} currentUserId={user?._id} />
    </ExpenseLayout>
  );
}

function ExpenseLayout({ backTo, children }: { backTo: string; children: ReactNode }) {
  return (
    <main className="flex min-h-screen justify-center bg-white px-6 py-8">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <header className="flex flex-col gap-3">
          <Link to={backTo} className="self-start text-sm font-medium text-primary">
            ← Tornar
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Nova despesa de grup</h1>
        </header>
        {children}
      </div>
    </main>
  );
}

/** Mounted once the members have loaded, so the defaults (payer, participants) are right. */
function NewGroupExpenseForm({
  groupId,
  members,
  currentUserId,
}: {
  groupId: Id<"groups">;
  members: GroupMember[];
  currentUserId: Id<"users"> | undefined;
}) {
  const form = useGroupExpenseForm(groupId, members, currentUserId);
  const { fields, errors, isSubmitting } = form;
  const { fieldErrors, alert } = errors;

  return (
    <form noValidate onSubmit={form.handleSubmit} className="flex flex-col gap-5">
      {alert && <FormAlert title={alert.title} description={alert.description} />}
      <TextField
        label="Concepte"
        name="concept"
        autoComplete="off"
        placeholder="Ex. Sopar de dissabte"
        value={fields.concept}
        onChange={(event) => form.setText("concept", event.target.value)}
        error={fieldErrors.concept}
        disabled={isSubmitting}
      />
      <TextField
        label="Import"
        name="amount"
        inputMode="decimal"
        autoComplete="off"
        placeholder="0,00"
        value={fields.amount}
        onChange={(event) => form.setText("amount", event.target.value)}
        error={fieldErrors.amount}
        trailing={<span className="pr-3 text-sm text-slate-500">€</span>}
        disabled={isSubmitting}
      />
      <PayerField
        members={members}
        currentUserId={currentUserId}
        value={fields.paidBy}
        onChange={form.setPaidBy}
        error={fieldErrors.paidBy}
        disabled={isSubmitting}
      />
      <SplitModeToggle value={fields.mode} onChange={form.setMode} disabled={isSubmitting} />
      <ParticipantList
        members={members}
        currentUserId={currentUserId}
        participants={fields.participants}
        mode={fields.mode}
        shares={fields.mode === "amounts" ? fields.amounts : fields.percentages}
        fieldErrors={fieldErrors}
        disabled={isSubmitting}
        onToggle={form.toggleParticipant}
        onShareChange={form.setShare}
      />

      <Button type="submit" loading={isSubmitting} className="mt-2">
        {isSubmitting ? "Desant…" : "Desar despesa"}
      </Button>
    </form>
  );
}
