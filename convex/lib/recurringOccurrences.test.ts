import { describe, expect, it } from "vitest";
import type { Doc } from "../_generated/dataModel";
import {
  expandUpcomingPayments,
  ruleMatchesCivilDay,
  sameUtcCivilDay,
  utcCivilParts,
  utcMidnight,
} from "./recurringOccurrences";

type Rule = Doc<"recurringTransactions">;

function rule(overrides: Partial<Rule> = {}): Rule {
  return {
    _id: "jd7rule" as Rule["_id"],
    _creationTime: 0,
    userId: "jd7user" as Rule["userId"],
    sourceTransactionId: "jd7tx" as Rule["sourceTransactionId"],
    type: "expense",
    amountCents: 1000,
    category: "housing",
    concept: "Lloguer",
    frequency: "monthly",
    dayOfMonth: 15,
    monthOfYear: 3,
    ...overrides,
  };
}

describe("US2.5 · recurringOccurrences helpers", () => {
  it("utcCivilParts and utcMidnight round-trip a civil day", () => {
    const ms = utcMidnight(2026, 4, 15);
    expect(utcCivilParts(ms)).toEqual({ year: 2026, month: 4, day: 15 });
    expect(sameUtcCivilDay(ms, Date.UTC(2026, 3, 15, 23, 59, 59))).toBe(true);
    expect(sameUtcCivilDay(ms, Date.UTC(2026, 3, 16))).toBe(false);
  });

  it("ruleMatchesCivilDay distinguishes monthly and yearly", () => {
    expect(ruleMatchesCivilDay(rule(), 4, 15)).toBe(true);
    expect(ruleMatchesCivilDay(rule(), 4, 14)).toBe(false);
    expect(ruleMatchesCivilDay(rule({ frequency: "yearly" }), 3, 15)).toBe(true);
    expect(ruleMatchesCivilDay(rule({ frequency: "yearly" }), 4, 15)).toBe(false);
  });

  it("expandUpcomingPayments sorts by date then concept", () => {
    const payments = expandUpcomingPayments(
      [
        rule({ concept: "Beta", dayOfMonth: 10 }),
        rule({
          _id: "jd7rule2" as Rule["_id"],
          sourceTransactionId: "jd7tx2" as Rule["sourceTransactionId"],
          concept: "Alfa",
          dayOfMonth: 10,
        }),
      ],
      Date.UTC(2026, 3, 1),
      Date.UTC(2026, 3, 30),
    );

    expect(payments.map((p) => p.concept)).toEqual(["Alfa", "Beta"]);
    expect(payments[0]?.date).toBe(Date.UTC(2026, 3, 10));
  });
});
