import { describe, expect, it } from "vitest";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
  buildHistoryQueryArgs,
  EMPTY_HISTORY_FILTERS,
  groupTransactionsByDay,
  hasActiveFilters,
  INVALID_RANGE_MESSAGE,
  parseDayInput,
  type Transaction,
} from "./useTransactionHistory";

let nextId = 0;

/** Builds a stored transaction; dates are local time so tests ignore the time zone. */
function transaction(date: Date, overrides: Partial<Transaction> = {}): Transaction {
  nextId += 1;
  return {
    _id: `transaction${nextId}` as Id<"transactions">,
    _creationTime: date.getTime(),
    userId: "user1" as Id<"users">,
    type: "expense",
    amountCents: 1250,
    date: date.getTime(),
    category: "groceries",
    concept: `Moviment ${nextId}`,
    ...overrides,
  };
}

describe("groupTransactionsByDay", () => {
  it("returns no groups when there are no transactions", () => {
    expect(groupTransactionsByDay([])).toEqual([]);
  });

  it("puts transactions of the same day together, keeping their order", () => {
    const evening = transaction(new Date(2026, 10, 1, 20, 15));
    const morning = transaction(new Date(2026, 10, 1, 8, 5));

    expect(groupTransactionsByDay([evening, morning])).toEqual([
      { dayStartMs: new Date(2026, 10, 1).getTime(), transactions: [evening, morning] },
    ]);
  });

  it("starts a new group for each day, newest day first", () => {
    const today = transaction(new Date(2026, 10, 1, 9, 0));
    const yesterdayLate = transaction(new Date(2026, 9, 31, 23, 59));
    const yesterdayEarly = transaction(new Date(2026, 9, 31, 0, 1), { type: "income" });
    const lastWeek = transaction(new Date(2026, 9, 25, 12, 0));

    const days = groupTransactionsByDay([today, yesterdayLate, yesterdayEarly, lastWeek]);

    expect(days.map((day) => day.dayStartMs)).toEqual([
      new Date(2026, 10, 1).getTime(),
      new Date(2026, 9, 31).getTime(),
      new Date(2026, 9, 25).getTime(),
    ]);
    expect(days[1].transactions).toEqual([yesterdayLate, yesterdayEarly]);
  });
});

describe("parseDayInput", () => {
  it("returns local midnight of the chosen day", () => {
    expect(parseDayInput("2026-11-01")).toBe(new Date(2026, 10, 1).getTime());
  });

  it("returns null for empty values, other formats and days that do not exist", () => {
    expect(parseDayInput("")).toBeNull();
    expect(parseDayInput("01/11/2026")).toBeNull();
    expect(parseDayInput("2026-02-30")).toBeNull();
  });
});

describe("buildHistoryQueryArgs", () => {
  it("asks for the whole history when no filter is set", () => {
    expect(buildHistoryQueryArgs(EMPTY_HISTORY_FILTERS)).toEqual({ args: {} });
  });

  it("includes the whole of both days of the range", () => {
    const { args } = buildHistoryQueryArgs({
      ...EMPTY_HISTORY_FILTERS,
      from: "2026-10-01",
      to: "2026-10-31",
    });

    expect(args).toEqual({
      from: new Date(2026, 9, 1).getTime(),
      to: new Date(2026, 10, 1).getTime() - 1,
    });
  });

  it("accepts a range of a single day and a range with only one end", () => {
    const sameDay = buildHistoryQueryArgs({
      ...EMPTY_HISTORY_FILTERS,
      from: "2026-11-01",
      to: "2026-11-01",
    });
    expect(sameDay.args).toEqual({
      from: new Date(2026, 10, 1).getTime(),
      to: new Date(2026, 10, 1, 23, 59, 59, 999).getTime(),
    });

    expect(buildHistoryQueryArgs({ ...EMPTY_HISTORY_FILTERS, to: "2026-11-01" }).args).toEqual({
      to: new Date(2026, 10, 1, 23, 59, 59, 999).getTime(),
    });
  });

  it("passes the chosen category", () => {
    expect(buildHistoryQueryArgs({ ...EMPTY_HISTORY_FILTERS, category: "leisure" })).toEqual({
      args: { category: "leisure" },
    });
  });

  it("does not query when the start date is after the end date", () => {
    expect(
      buildHistoryQueryArgs({ ...EMPTY_HISTORY_FILTERS, from: "2026-11-02", to: "2026-11-01" }),
    ).toEqual({ args: null, rangeError: INVALID_RANGE_MESSAGE });
  });
});

describe("hasActiveFilters", () => {
  it("is false only when every filter is empty", () => {
    expect(hasActiveFilters(EMPTY_HISTORY_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...EMPTY_HISTORY_FILTERS, from: "2026-11-01" })).toBe(true);
    expect(hasActiveFilters({ ...EMPTY_HISTORY_FILTERS, category: "salary" })).toBe(true);
  });
});
