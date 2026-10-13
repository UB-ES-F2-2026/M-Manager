/** Empty state until transactions (US2.x) provide a backend-computed balance. */
export function BalanceCard() {
  return (
    <section
      aria-labelledby="balance-title"
      className="flex flex-col gap-1 rounded-2xl bg-brand px-6 py-5 text-white shadow-sm"
    >
      <h2 id="balance-title" className="text-sm text-white/80">
        Saldo total
      </h2>
      <p className="text-2xl font-semibold">Encara no hi ha moviments</p>
      <p className="text-xs text-white/75">
        Quan registris ingressos i despeses, aquí veuràs el teu saldo.
      </p>
    </section>
  );
}
