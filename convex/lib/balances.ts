/**
 * Balances of a group and the simplified list of debts (US4.3).
 * Pure functions, generic over the id type so they work with Convex ids and
 * plain strings. Everything is in integer cents.
 */

export type Balance<UserId extends string> = { userId: UserId; balanceCents: number };

export type Transfer<UserId extends string> = {
  fromUserId: UserId;
  toUserId: UserId;
  amountCents: number;
};

type ExpenseInput<UserId extends string> = {
  paidBy: UserId;
  amountCents: number;
  shares: { userId: UserId; amountCents: number }[];
};

type SettlementInput<UserId extends string> = {
  fromUserId: UserId;
  toUserId: UserId;
  amountCents: number;
};

/**
 * One balance per member, in the order of `memberIds`:
 * what they paid as payer − their shares as participant
 * + settlements received − settlements made.
 * > 0 means the others owe them («Li deuen»); < 0 means they owe («Deu»).
 * Users that are not in `memberIds` are ignored.
 */
export function computeBalances<UserId extends string>(
  memberIds: UserId[],
  expenses: ExpenseInput<UserId>[],
  settlements: SettlementInput<UserId>[],
): Balance<UserId>[] {
  const balances = new Map<UserId, number>(memberIds.map((userId) => [userId, 0]));
  const add = (userId: UserId, cents: number) => {
    const current = balances.get(userId);
    if (current !== undefined) {
      balances.set(userId, current + cents);
    }
  };

  for (const expense of expenses) {
    add(expense.paidBy, expense.amountCents);
    for (const share of expense.shares) {
      add(share.userId, -share.amountCents);
    }
  }
  for (const settlement of settlements) {
    add(settlement.fromUserId, settlement.amountCents);
    add(settlement.toUserId, -settlement.amountCents);
  }

  return memberIds.map((userId) => ({ userId, balanceCents: balances.get(userId) ?? 0 }));
}

function byUserId<Item extends { userId: string }>(a: Item, b: Item): number {
  return a.userId < b.userId ? -1 : a.userId > b.userId ? 1 : 0;
}

/** Index of the largest `cents`; on a tie, the first one (lowest userId). */
function indexOfLargest(entries: { cents: number }[]): number {
  let best = 0;
  for (let index = 1; index < entries.length; index += 1) {
    if (entries[index].cents > entries[best].cents) {
      best = index;
    }
  }
  return best;
}

/**
 * «Per saldar»: the classic deterministic greedy algorithm of the US.
 * Creditors (> 0) and debtors (< 0) are sorted by userId; then, repeatedly,
 * the debtor who owes the most pays the creditor who is owed the most until
 * one of them reaches 0 (ties go to the lowest userId).
 * Every transfer is > 0, and applying all of them leaves every balance at 0.
 * The same input always gives the same output, with at most n − 1 transfers.
 */
export function simplifyDebts<UserId extends string>(
  balances: Balance<UserId>[],
): Transfer<UserId>[] {
  const sorted = [...balances].sort(byUserId);
  const creditors = sorted
    .filter(({ balanceCents }) => balanceCents > 0)
    .map(({ userId, balanceCents }) => ({ userId, cents: balanceCents }));
  const debtors = sorted
    .filter(({ balanceCents }) => balanceCents < 0)
    .map(({ userId, balanceCents }) => ({ userId, cents: -balanceCents }));

  const transfers: Transfer<UserId>[] = [];
  while (creditors.length > 0 && debtors.length > 0) {
    const debtorIndex = indexOfLargest(debtors);
    const creditorIndex = indexOfLargest(creditors);
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amountCents = Math.min(debtor.cents, creditor.cents);

    transfers.push({ fromUserId: debtor.userId, toUserId: creditor.userId, amountCents });
    debtor.cents -= amountCents;
    creditor.cents -= amountCents;
    if (debtor.cents === 0) {
      debtors.splice(debtorIndex, 1);
    }
    if (creditor.cents === 0) {
      creditors.splice(creditorIndex, 1);
    }
  }
  return transfers;
}
