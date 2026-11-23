import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import {
  AMOUNTS_SUM_MESSAGE,
  PERCENTAGES_SUM_MESSAGE,
  SHARE_AMOUNT_MESSAGE,
  SHARE_PERCENTAGE_MESSAGE,
  splitByAmounts,
  splitByPercentages,
  splitEqually,
} from "./splitExpense";

function total(shares: { amountCents: number }[]): number {
  return shares.reduce((sum, share) => sum + share.amountCents, 0);
}

function expectSplitError(run: () => unknown, message: string) {
  try {
    run();
  } catch (error) {
    expect(error).toBeInstanceOf(ConvexError);
    expect((error as ConvexError<{ code: string; message: string }>).data).toEqual({
      code: "INVALID_SPLIT",
      message,
    });
    return;
  }
  expect.fail(`Expected «${message}»`);
}

describe("splitEqually («Igual»)", () => {
  it("divides an exact amount in equal parts", () => {
    expect(splitEqually(900, ["a", "b", "c"])).toEqual([
      { userId: "a", amountCents: 300 },
      { userId: "b", amountCents: 300 },
      { userId: "c", amountCents: 300 },
    ]);
  });

  it("gives the leftover cents one by one to the first participants by userId", () => {
    expect(splitEqually(1000, ["c", "a", "b"])).toEqual([
      { userId: "a", amountCents: 334 },
      { userId: "b", amountCents: 333 },
      { userId: "c", amountCents: 333 },
    ]);
    expect(splitEqually(1001, ["c", "a", "b"])).toEqual([
      { userId: "a", amountCents: 334 },
      { userId: "b", amountCents: 334 },
      { userId: "c", amountCents: 333 },
    ]);
  });

  it("does not depend on the order the participants come in", () => {
    expect(splitEqually(1000, ["b", "c", "a"])).toEqual(splitEqually(1000, ["a", "b", "c"]));
  });

  it("gives everything to a single participant", () => {
    expect(splitEqually(1234, ["a"])).toEqual([{ userId: "a", amountCents: 1234 }]);
  });

  it("gives 0 to the last ones when there are fewer cents than participants", () => {
    expect(splitEqually(2, ["a", "b", "c"])).toEqual([
      { userId: "a", amountCents: 1 },
      { userId: "b", amountCents: 1 },
      { userId: "c", amountCents: 0 },
    ]);
  });

  it.each([1, 7, 99, 100, 101, 12_345, 999_999])("always adds up to %i cents", (amount) => {
    for (let people = 1; people <= 7; people += 1) {
      const participants = Array.from({ length: people }, (_, index) => `u${index}`);
      expect(total(splitEqually(amount, participants))).toBe(amount);
    }
  });
});

describe("splitByAmounts («Imports»)", () => {
  it("keeps each participant's cents, sorted by userId", () => {
    expect(
      splitByAmounts(5000, [
        { userId: "b", amountCents: 2000 },
        { userId: "a", amountCents: 3000 },
      ]),
    ).toEqual([
      { userId: "a", amountCents: 3000 },
      { userId: "b", amountCents: 2000 },
    ]);
  });

  it.each([
    ["less", 4999],
    ["more", 5001],
  ])("rejects amounts that add up to %s than the expense", (_, total) => {
    expectSplitError(
      () =>
        splitByAmounts(total, [
          { userId: "a", amountCents: 3000 },
          { userId: "b", amountCents: 2000 },
        ]),
      AMOUNTS_SUM_MESSAGE,
    );
  });

  it.each([0, -100, 10.5, Number.NaN])("rejects a participant with %s cents", (amountCents) => {
    expectSplitError(
      () =>
        splitByAmounts(5000, [
          { userId: "a", amountCents: 5000 },
          { userId: "b", amountCents },
        ]),
      SHARE_AMOUNT_MESSAGE,
    );
  });
});

describe("splitByPercentages («Percentatges»)", () => {
  it("converts the percentages to cents", () => {
    expect(
      splitByPercentages(10_000, [
        { userId: "a", percentage: 50 },
        { userId: "b", percentage: 30 },
        { userId: "c", percentage: 20 },
      ]),
    ).toEqual([
      { userId: "a", amountCents: 5000 },
      { userId: "b", amountCents: 3000 },
      { userId: "c", amountCents: 2000 },
    ]);
  });

  it("uses the same leftover rule as «Igual»", () => {
    expect(
      splitByPercentages(100, [
        { userId: "c", percentage: 33.33 },
        { userId: "a", percentage: 33.33 },
        { userId: "b", percentage: 33.34 },
      ]),
    ).toEqual([
      { userId: "a", amountCents: 34 },
      { userId: "b", amountCents: 33 },
      { userId: "c", amountCents: 33 },
    ]);
  });

  it("always adds up to the total", () => {
    const percentages = [
      { userId: "a", percentage: 12.5 },
      { userId: "b", percentage: 37.25 },
      { userId: "c", percentage: 50.25 },
    ];
    for (const amount of [1, 3, 999, 1001, 123_457]) {
      expect(total(splitByPercentages(amount, percentages))).toBe(amount);
    }
  });

  it("is exact for very large amounts", () => {
    const amount = Number.MAX_SAFE_INTEGER;
    const shares = splitByPercentages(amount, [
      { userId: "a", percentage: 33.33 },
      { userId: "b", percentage: 66.67 },
    ]);
    expect(total(shares)).toBe(amount);
  });

  it.each([
    ["less", 99.99],
    ["more", 100.01],
  ])("rejects percentages that add up to %s than 100", (_, last) => {
    expectSplitError(
      () =>
        splitByPercentages(1000, [
          { userId: "a", percentage: 50 },
          { userId: "b", percentage: last - 50 },
        ]),
      PERCENTAGES_SUM_MESSAGE,
    );
  });

  it("accepts decimals that do not add up exactly in floating point", () => {
    const shares = splitByPercentages(1000, [
      { userId: "a", percentage: 0.1 },
      { userId: "b", percentage: 0.2 },
      { userId: "c", percentage: 99.7 },
    ]);
    expect(total(shares)).toBe(1000);
  });

  it.each([0, -10, 33.333, Number.POSITIVE_INFINITY])(
    "rejects a participant with %s%",
    (percentage) => {
      expectSplitError(
        () =>
          splitByPercentages(1000, [
            { userId: "a", percentage: 100 },
            { userId: "b", percentage },
          ]),
        SHARE_PERCENTAGE_MESSAGE,
      );
    },
  );
});
