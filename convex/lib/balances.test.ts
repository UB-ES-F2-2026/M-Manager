import { describe, expect, it } from "vitest";
import { computeBalances, simplifyDebts, type Balance, type Transfer } from "./balances";

function balance(userId: string, balanceCents: number): Balance<string> {
  return { userId, balanceCents };
}

/** Applies the transfers: the debtor pays (+) and the creditor receives (−). */
function applyTransfers(balances: Balance<string>[], transfers: Transfer<string>[]) {
  const result = new Map(balances.map(({ userId, balanceCents }) => [userId, balanceCents]));
  for (const { fromUserId, toUserId, amountCents } of transfers) {
    result.set(fromUserId, (result.get(fromUserId) ?? 0) + amountCents);
    result.set(toUserId, (result.get(toUserId) ?? 0) - amountCents);
  }
  return [...result.values()];
}

/** Small deterministic generator, so the "many cases" test always runs the same cases. */
function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1_103_515_245 + 12_345) % 2_147_483_648;
    return state / 2_147_483_648;
  };
}

describe("computeBalances", () => {
  it("is paid as payer minus shares as participant", () => {
    expect(
      computeBalances(
        ["a", "b", "c"],
        [
          {
            paidBy: "a",
            amountCents: 900,
            shares: [
              { userId: "a", amountCents: 300 },
              { userId: "b", amountCents: 300 },
              { userId: "c", amountCents: 300 },
            ],
          },
        ],
        [],
      ),
    ).toEqual([balance("a", 600), balance("b", -300), balance("c", -300)]);
  });

  it("counts a payer who does not participate", () => {
    expect(
      computeBalances(
        ["a", "b"],
        [{ paidBy: "a", amountCents: 500, shares: [{ userId: "b", amountCents: 500 }] }],
        [],
      ),
    ).toEqual([balance("a", 500), balance("b", -500)]);
  });

  it("adds the settlements made and subtracts the ones received", () => {
    expect(
      computeBalances(
        ["a", "b"],
        [{ paidBy: "a", amountCents: 500, shares: [{ userId: "b", amountCents: 500 }] }],
        [{ fromUserId: "b", toUserId: "a", amountCents: 500 }],
      ),
    ).toEqual([balance("a", 0), balance("b", 0)]);
  });

  it("gives 0 to everyone without expenses or settlements, in the members' order", () => {
    expect(computeBalances(["c", "a", "b"], [], [])).toEqual([
      balance("c", 0),
      balance("a", 0),
      balance("b", 0),
    ]);
  });

  it("always adds up to 0", () => {
    const balances = computeBalances(
      ["a", "b", "c", "d"],
      [
        {
          paidBy: "a",
          amountCents: 1001,
          shares: [
            { userId: "a", amountCents: 334 },
            { userId: "b", amountCents: 334 },
            { userId: "c", amountCents: 333 },
          ],
        },
        { paidBy: "d", amountCents: 250, shares: [{ userId: "a", amountCents: 250 }] },
      ],
      [{ fromUserId: "c", toUserId: "a", amountCents: 100 }],
    );
    expect(balances.reduce((sum, { balanceCents }) => sum + balanceCents, 0)).toBe(0);
  });
});

describe("simplifyDebts («Per saldar»)", () => {
  it("returns no transfers when everyone is settled", () => {
    expect(simplifyDebts([balance("a", 0), balance("b", 0)])).toEqual([]);
    expect(simplifyDebts([])).toEqual([]);
  });

  it("makes the biggest debtor pay the biggest creditor first", () => {
    expect(
      simplifyDebts([balance("a", 600), balance("b", -100), balance("c", -500)]),
    ).toEqual([
      { fromUserId: "c", toUserId: "a", amountCents: 500 },
      { fromUserId: "b", toUserId: "a", amountCents: 100 },
    ]);
  });

  it("splits a debt between creditors when one of them reaches 0", () => {
    expect(
      simplifyDebts([balance("a", 300), balance("b", 200), balance("c", -500)]),
    ).toEqual([
      { fromUserId: "c", toUserId: "a", amountCents: 300 },
      { fromUserId: "c", toUserId: "b", amountCents: 200 },
    ]);
  });

  it("breaks ties by the lowest userId", () => {
    expect(
      simplifyDebts([balance("d", 100), balance("c", 100), balance("b", -100), balance("a", -100)]),
    ).toEqual([
      { fromUserId: "a", toUserId: "c", amountCents: 100 },
      { fromUserId: "b", toUserId: "d", amountCents: 100 },
    ]);
  });

  it("gives the same output whatever the input order", () => {
    const balances = [balance("a", 700), balance("b", -200), balance("c", -450), balance("d", -50)];
    expect(simplifyDebts([...balances].reverse())).toEqual(simplifyDebts(balances));
  });

  it("needs fewer payments than every participant paying every payer", () => {
    // Three expenses of 300 paid by a, b and c, split among all four.
    // Without simplifying, each participant pays each payer: 9 payments
    // (3 payers × 3 other participants). Greedy needs only d → a, b, c.
    const balances = computeBalances(
      ["a", "b", "c", "d"],
      ["a", "b", "c"].map((payer) => ({
        paidBy: payer,
        amountCents: 300,
        shares: ["a", "b", "c", "d"].map((userId) => ({ userId, amountCents: 75 })),
      })),
      [],
    );
    expect(balances).toEqual([
      balance("a", 75),
      balance("b", 75),
      balance("c", 75),
      balance("d", -225),
    ]);
    expect(simplifyDebts(balances)).toEqual([
      { fromUserId: "d", toUserId: "a", amountCents: 75 },
      { fromUserId: "d", toUserId: "b", amountCents: 75 },
      { fromUserId: "d", toUserId: "c", amountCents: 75 },
    ]);
  });

  it("chains debts instead of paying through the middle", () => {
    // a owes b 100 and b owes c 100: b is even, so a pays c directly.
    const balances = computeBalances(
      ["a", "b", "c"],
      [
        { paidBy: "b", amountCents: 100, shares: [{ userId: "a", amountCents: 100 }] },
        { paidBy: "c", amountCents: 100, shares: [{ userId: "b", amountCents: 100 }] },
      ],
      [],
    );
    expect(simplifyDebts(balances)).toEqual([
      { fromUserId: "a", toUserId: "c", amountCents: 100 },
    ]);
  });

  it("settles everything, with positive transfers and at most n − 1 of them, in many cases", () => {
    const random = seededRandom(42);
    for (let run = 0; run < 300; run += 1) {
      const people = 2 + Math.floor(random() * 7);
      const raw = Array.from({ length: people }, () => Math.floor(random() * 20_001) - 10_000);
      const sum = raw.reduce((total, cents) => total + cents, 0);
      raw[0] -= sum;
      const balances = raw.map((cents, index) => balance(`u${index}`, cents));

      const transfers = simplifyDebts(balances);

      expect(applyTransfers(balances, transfers).every((cents) => cents === 0)).toBe(true);
      expect(transfers.every(({ amountCents }) => amountCents > 0)).toBe(true);
      expect(transfers.length).toBeLessThanOrEqual(people - 1);
      expect(transfers.every(({ fromUserId, toUserId }) => fromUserId !== toUserId)).toBe(true);
    }
  });
});
