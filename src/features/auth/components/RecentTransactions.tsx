import { TransferIcon } from "../../../components/ui/icons";

/** Empty state until transactions (US2.x) exist. */
export function RecentTransactions() {
  return (
    <section aria-labelledby="recent-title" className="flex flex-col gap-3">
      <h2 id="recent-title" className="text-lg font-semibold text-ink">
        Últims moviments
      </h2>
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-white px-6 py-8 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand">
          <TransferIcon className="size-6" />
        </span>
        <div className="flex flex-col gap-1">
          <p className="font-medium text-ink">Encara no tens moviments</p>
          <p className="text-sm text-muted">
            Els ingressos i les despeses que afegeixis apareixeran aquí.
          </p>
        </div>
      </div>
    </section>
  );
}
