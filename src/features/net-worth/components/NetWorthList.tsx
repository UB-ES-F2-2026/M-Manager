import type { Doc } from "../../../../convex/_generated/dataModel";
import { formatMoney } from "../../../lib/money";
import { ASSET_TYPE_LABELS } from "../assetTypeLabels";
import { initialsFromLabel } from "../initialsFromLabel";

type NetWorthListProps = {
  assets: Doc<"assets">[];
  debts: Doc<"debts">[];
};

const DUE_DATE = new Intl.DateTimeFormat("ca-ES", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** Home list of the signed-in user's assets and debts (US3.2). */
export default function NetWorthList({ assets, debts }: NetWorthListProps) {
  if (assets.length === 0 && debts.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
        Encara no tens actius ni deutes.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {assets.length > 0 && (
        <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
          {assets.map((asset) => (
            <li key={asset._id} className="flex items-center gap-3 px-4 py-3">
              <span
                aria-hidden="true"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary"
              >
                {initialsFromLabel(asset.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900">{asset.name}</p>
                <p className="text-xs text-slate-500">{ASSET_TYPE_LABELS[asset.type]}</p>
              </div>
              <p className="font-semibold text-slate-900">{formatMoney(asset.amountCents)}</p>
            </li>
          ))}
        </ul>
      )}

      {debts.length > 0 && (
        <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
          {debts.map((debt) => (
            <li key={debt._id} className="flex items-center gap-3 px-4 py-3">
              <span
                aria-hidden="true"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600"
              >
                {initialsFromLabel(debt.concept)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900">{debt.concept}</p>
                <p className="text-xs text-slate-500">
                  Venciment · {DUE_DATE.format(debt.dueDate)}
                </p>
              </div>
              <p className="font-semibold text-red-600">{formatMoney(debt.amountCents)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
