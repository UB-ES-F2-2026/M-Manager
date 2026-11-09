import { formatMoney } from "../../../lib/money";

type BalanceCardProps = {
  /** Income − expenses for the current month (can be negative). */
  savingsCents: number;
  /** e.g. "Novembre de 2026". */
  monthLabel: string;
};

/** Blue card with the signed-in user's monthly savings (US2.4). */
export default function BalanceCard({ savingsCents, monthLabel }: BalanceCardProps) {
  const isNegative = savingsCents < 0;

  return (
    <section className="flex flex-col gap-1 rounded-2xl bg-primary px-5 py-5 text-white">
      <h2 className="text-sm text-white/80">Estalvi del mes</h2>
      <p className={`text-3xl font-bold ${isNegative ? "text-red-200" : ""}`}>
        {formatMoney(savingsCents)}
      </p>
      <p className="text-xs text-white/75">{monthLabel}</p>
    </section>
  );
}
