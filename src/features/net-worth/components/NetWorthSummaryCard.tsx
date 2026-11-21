import { netWorthSummaryText, type NetWorthSummary } from "../netWorthSummaryText";

type NetWorthSummaryCardProps = {
  /** Result of `api.netWorth.summary`; undefined while it loads. */
  summary: NetWorthSummary | undefined;
};

/**
 * Blue card at the top of the main screen (US3.3): net worth and, below a
 * separator, the liquidity of bank accounts and cash. Totals come from the
 * backend and update on their own through the reactive query.
 */
export default function NetWorthSummaryCard({ summary }: NetWorthSummaryCardProps) {
  const isLoading = summary === undefined;
  const text = netWorthSummaryText(summary);
  const amountColor = isLoading ? "text-white/80" : "text-white";

  return (
    <section
      aria-busy={isLoading}
      className="flex flex-col gap-3 rounded-2xl bg-primary px-5 py-5 text-white"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-sm text-white/80">Patrimoni net</h2>
        <p className={`text-3xl font-bold ${amountColor}`}>{text.netWorth}</p>
      </div>
      <div className="flex flex-col gap-1 border-t border-white/20 pt-3">
        <h3 className="text-sm text-white/80">Liquiditat</h3>
        <p className={`text-xl font-semibold ${amountColor}`}>{text.liquidity}</p>
        <p className="text-xs text-white/75">Comptes i efectiu</p>
      </div>
    </section>
  );
}
