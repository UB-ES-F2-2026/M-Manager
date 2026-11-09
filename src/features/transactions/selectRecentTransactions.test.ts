import { describe, expect, it } from "vitest";
import {
  HOME_RECENT_TRANSACTION_LIMIT,
  selectRecentTransactions,
} from "./selectRecentTransactions";

describe("selectRecentTransactions", () => {
  it("keeps only the first rows for the home preview", () => {
    const rows = [1, 2, 3, 4, 5];
    expect(selectRecentTransactions(rows)).toEqual([1, 2, 3]);
    expect(selectRecentTransactions(rows)).toHaveLength(HOME_RECENT_TRANSACTION_LIMIT);
  });

  it("returns the whole list when there are fewer than the limit", () => {
    expect(selectRecentTransactions([10, 20])).toEqual([10, 20]);
  });

  it("returns an empty list when there are no transactions", () => {
    expect(selectRecentTransactions([])).toEqual([]);
  });
});
