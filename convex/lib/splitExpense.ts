import { ConvexError } from "convex/values";

/**
 * Splitting a group expense into the cents each participant owes (US4.2).
 * Pure functions: the result always adds up to exactly `amountCents`, and the
 * shares come in a stable order (by userId), the order the remaining cents use.
 * Generic over the id type so it works with Convex ids and plain strings.
 */

export type Share<UserId extends string> = { userId: UserId; amountCents: number };

export const AMOUNTS_SUM_MESSAGE = "La suma dels imports ha de ser igual a la despesa.";
export const PERCENTAGES_SUM_MESSAGE = "La suma dels percentatges ha de ser 100.";
export const SHARE_AMOUNT_MESSAGE = "Cada participant ha de tenir un import més gran que zero.";
export const SHARE_PERCENTAGE_MESSAGE =
  "Cada participant ha de tenir un percentatge més gran que zero, amb dos decimals com a màxim.";

/** 100% expressed in hundredths of a percent, so 33.33% is 3333. */
const HUNDRED_PERCENT = 10_000;

function throwSplitError(message: string): never {
  throw new ConvexError({ code: "INVALID_SPLIT", message });
}

function byUserId<Item extends { userId: string }>(a: Item, b: Item): number {
  return a.userId < b.userId ? -1 : a.userId > b.userId ? 1 : 0;
}

/**
 * Gives each participant `floor(amountCents * weight / totalWeight)` and then
 * the cents left over, one by one, to the first participants in userId order.
 */
function splitByWeights<UserId extends string>(
  amountCents: number,
  weights: { userId: UserId; weight: number }[],
): Share<UserId>[] {
  const sorted = [...weights].sort(byUserId);
  const total = BigInt(amountCents);
  const totalWeight = BigInt(sorted.reduce((sum, { weight }) => sum + weight, 0));

  const shares = sorted.map(({ userId, weight }) => ({
    userId,
    amountCents: Number((total * BigInt(weight)) / totalWeight),
  }));

  let remaining = amountCents - shares.reduce((sum, share) => sum + share.amountCents, 0);
  for (let index = 0; remaining > 0; index += 1, remaining -= 1) {
    shares[index].amountCents += 1;
  }
  return shares;
}

/** «Igual»: the same share for everyone; leftover cents go to the first ones. */
export function splitEqually<UserId extends string>(
  amountCents: number,
  participants: UserId[],
): Share<UserId>[] {
  return splitByWeights(
    amountCents,
    participants.map((userId) => ({ userId, weight: 1 })),
  );
}

/** «Imports»: each participant's cents, which must add up to the total. */
export function splitByAmounts<UserId extends string>(
  amountCents: number,
  shares: Share<UserId>[],
): Share<UserId>[] {
  for (const share of shares) {
    if (!Number.isSafeInteger(share.amountCents) || share.amountCents <= 0) {
      throwSplitError(SHARE_AMOUNT_MESSAGE);
    }
  }
  const sum = shares.reduce((total, share) => total + share.amountCents, 0);
  if (sum !== amountCents) {
    throwSplitError(AMOUNTS_SUM_MESSAGE);
  }
  return [...shares].sort(byUserId);
}

/** 33.33 → 3333. Null when it is not a positive number with at most 2 decimals. */
function toHundredths(percentage: number): number | null {
  if (!Number.isFinite(percentage) || percentage <= 0) {
    return null;
  }
  const hundredths = Math.round(percentage * 100);
  return Math.abs(hundredths - percentage * 100) < 1e-6 ? hundredths : null;
}

/**
 * «Percentatges»: each participant's percentage (up to 2 decimals), adding up
 * to 100; converted to cents with the same leftover rule as «Igual».
 */
export function splitByPercentages<UserId extends string>(
  amountCents: number,
  percentages: { userId: UserId; percentage: number }[],
): Share<UserId>[] {
  const weights = percentages.map(({ userId, percentage }) => {
    const weight = toHundredths(percentage);
    return weight === null ? throwSplitError(SHARE_PERCENTAGE_MESSAGE) : { userId, weight };
  });
  const sum = weights.reduce((total, { weight }) => total + weight, 0);
  if (sum !== HUNDRED_PERCENT) {
    throwSplitError(PERCENTAGES_SUM_MESSAGE);
  }
  return splitByWeights(amountCents, weights);
}
