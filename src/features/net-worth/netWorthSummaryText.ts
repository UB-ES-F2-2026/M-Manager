import { formatMoney } from "../../lib/money";

/** Result of `api.netWorth.summary` (US3.3). */
export type NetWorthSummary = {
  netWorthCents: number;
  liquidityCents: number;
};

export const LOADING_TEXT = "Carregant…";

/**
 * Amounts shown on the home net worth card: "Carregant…" while the query loads,
 * otherwise formatted with formatMoney (a negative net worth keeps its minus sign).
 */
export function netWorthSummaryText(summary: NetWorthSummary | undefined): {
  netWorth: string;
  liquidity: string;
} {
  if (summary === undefined) {
    return { netWorth: LOADING_TEXT, liquidity: LOADING_TEXT };
  }
  return {
    netWorth: formatMoney(summary.netWorthCents),
    liquidity: formatMoney(summary.liquidityCents),
  };
}
