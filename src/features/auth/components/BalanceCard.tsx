import { formatMoney } from "../../../lib/money";

type BalanceCardProps = {
  totalCents: number;
  accountCount: number;
};

/** Blue "Saldo total" card at the top of the main screen. */
export default function BalanceCard({ totalCents, accountCount }: BalanceCardProps) {
  return (
    <section className="flex flex-col gap-1 rounded-2xl bg-primary px-5 py-5 text-white">
      <h2 className="text-sm text-white/80">Saldo total</h2>
      <p className="text-3xl font-bold">{formatMoney(totalCents)}</p>
      <p className="text-xs text-white/75">
        {accountCount} comptes connectats · Actualitzat fa 2 min
      </p>
    </section>
  );
}
