import { describe, expect, it } from "vitest";
import type { Id } from "../../../../convex/_generated/dataModel";
import { groupTransactionsByDay, type Transaction } from "./useTransactionHistory";

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
