import { formatMoney } from "../../../lib/money";

type MonthlySavingsCardProps = {
  /** Income − expenses for the current month (can be negative). */
  savingsCents: number;
  /** e.g. "Novembre de 2026". */
  monthLabel: string;
};

/** Indicator with the month's savings under the total balance (US2.4). */
export default function MonthlySavingsCard({
  savingsCents,
  monthLabel,
}: MonthlySavingsCardProps) {
  const isNegative = savingsCents < 0;

  return (
    <section className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white px-5 py-4">
      <h2 className="text-sm text-slate-500">Estalvi del mes</h2>
      <p className={`text-2xl font-bold ${isNegative ? "text-danger" : "text-slate-900"}`}>
        {formatMoney(savingsCents)}
      </p>
      <p className="text-xs text-slate-500">{monthLabel}</p>
    </section>
  );
}
