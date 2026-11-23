import { Link } from "react-router-dom";
import { GROUP_CODE_LENGTH } from "../../../../convex/lib/groupCodes";
import Button from "../../../components/ui/Button";
import FormAlert from "../../../components/ui/FormAlert";
import TextField from "../../../components/ui/TextField";
import { useJoinGroupForm } from "../hooks/useJoinGroupForm";

/** US4.1 AC3: /groups/join, join a group with its invite code. */
export default function JoinGroupPage() {
  const { code, errors, isSubmitting, notice, changeCode, handleSubmit } = useJoinGroupForm();
  const isBusy = isSubmitting || notice !== null;

  return (
    <main className="flex min-h-screen justify-center bg-white px-6 py-8">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <header className="flex flex-col gap-3">
          <Link to="/groups" className="self-start text-sm font-medium text-primary">
            ← Tornar
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Unir-me a un grup</h1>
          <p className="text-sm text-slate-500">
            Escriu el codi de {GROUP_CODE_LENGTH} caràcters que t'han passat.
          </p>
        </header>

        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
          {errors.alert && (
            <FormAlert title={errors.alert.title} description={errors.alert.description} />
          )}
          {notice && (
            <p
              role="status"
              className="rounded-lg border border-primary bg-primary-soft px-3 py-2.5 text-sm font-medium text-primary"
            >
              {notice}
            </p>
          )}
          <TextField
            label="Codi del grup"
            placeholder="K7M2QX"
            value={code}
            onChange={(event) => changeCode(event.target.value)}
            error={errors.codeError}
            disabled={isBusy}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            autoFocus
          />

          <Button type="submit" loading={isBusy} className="mt-2">
            {isBusy ? "Entrant…" : "Unir-me"}
          </Button>
        </form>
      </div>
    </main>
  );
}
