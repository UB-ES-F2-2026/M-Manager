import { useQuery } from "convex/react";
import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../../../convex/_generated/api";
import Button from "../../../components/ui/Button";
import FormAlert from "../../../components/ui/FormAlert";
import SessionLoading from "../../auth/components/SessionLoading";
import NetWorthFormFields from "../components/NetWorthFormFields";
import { useNetWorthForm, type NetWorthItem, type NetWorthKind } from "../hooks/useNetWorthForm";

const TEXTS = {
  asset: { title: "Editar actiu", notFound: "No s'ha trobat aquest actiu" },
  debt: { title: "Editar deute", notFound: "No s'ha trobat aquest deute" },
} as const;

type EditNetWorthItemPageProps = {
  kind: NetWorthKind;
};

/** US3.2 AC3: edit an asset or a debt. The id comes from the URL. */
export default function EditNetWorthItemPage({ kind }: EditNetWorthItemPageProps) {
  const { itemId = "" } = useParams();
  const asset = useQuery(api.netWorth.getAsset, kind === "asset" ? { assetId: itemId } : "skip");
  const debt = useQuery(api.netWorth.getDebt, kind === "debt" ? { debtId: itemId } : "skip");
  const item: NetWorthItem | null | undefined =
    kind === "asset" ? asset && { kind, asset } : debt && { kind, debt };

  if (item === undefined) {
    return <SessionLoading />;
  }

  if (item === null) {
    return (
      <EditLayout title={TEXTS[kind].title}>
        <FormAlert
          title={TEXTS[kind].notFound}
          description="Potser s'ha eliminat o l'enllaç no és correcte."
        />
      </EditLayout>
    );
  }

  return (
    <EditLayout title={TEXTS[kind].title}>
      <EditNetWorthItemForm item={item} />
    </EditLayout>
  );
}

function EditLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="flex min-h-screen justify-center bg-white px-6 py-8">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <header className="flex flex-col gap-3">
          <Link to="/" className="self-start text-sm font-medium text-primary">
            ← Tornar
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        </header>
        {children}
      </div>
    </main>
  );
}

/** Mounted only once the item has loaded, so useState starts from its values. */
function EditNetWorthItemForm({ item }: { item: NetWorthItem }) {
  const { fields, errors, isSubmitting, setField, handleSubmit } = useNetWorthForm(item);
  const { fieldErrors, alert } = errors;

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      {alert && <FormAlert title={alert.title} description={alert.description} />}
      <NetWorthFormFields
        fields={fields}
        fieldErrors={fieldErrors}
        disabled={isSubmitting}
        setField={setField}
      />

      <Button type="submit" loading={isSubmitting} className="mt-2">
        {isSubmitting ? "Desant…" : "Desar canvis"}
      </Button>
    </form>
  );
}
