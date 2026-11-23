/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import type { FunctionReturnType } from "convex/server";
import { ConvexError, type Value } from "convex/values";
import { describe, expect, it } from "vitest";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { TRANSFER_NOT_PENDING_MESSAGE } from "../../../convex/groups";
import type { SplitMode } from "../../../convex/lib/splitModes";
import schema from "../../../convex/schema";
import {
  initialGroupExpenseFields,
  parseGroupExpenseFields,
  suggestedShares,
  type GroupMember,
} from "./hooks/useGroupExpenseForm";

// US4.3 · Qui deu a qui — integration / acceptance tests.
//
// The unit tests check the algorithm alone (convex/lib/balances.test.ts) and
// the backend tests check each function alone (groups.balances.test.ts,
// groups.settle.test.ts). These tests follow whole stories instead: members
// add expenses through the real form helpers of /groups/:groupId/expenses/new,
// read «Balanços» and «Per saldar» from groups.getBalances, and press
// «Saldar deute» on the cards with exactly the data the cards get.

const modules = import.meta.glob("../../../convex/**/!(*.*.*)*.*s");

function setup() {
  return convexTest(schema, modules);
}

type TestConvex = ReturnType<typeof setup>;
type Member = Awaited<ReturnType<typeof signedInAs>>;
type Balances = NonNullable<FunctionReturnType<typeof api.groups.getBalances>>;
type Card = Balances["transfers"][number];

async function signedInAs(t: TestConvex, name: string) {
  const userId = await t.run((ctx) => ctx.db.insert("users", { name }));
  return { userId, name, client: t.withIdentity({ subject: `${userId}|session` }) };
}

/** The first name creates the group and the others join it with its code. */
async function groupWith(t: TestConvex, names: string[]) {
  const members = [];
  for (const name of names) {
    members.push(await signedInAs(t, name));
  }
  const [owner, ...friends] = members;
  const groupId = await owner.client.mutation(api.groups.create, { name: "Viatge a Roma" });
  const code = (await owner.client.query(api.groups.get, { groupId }))?.code ?? "";
  for (const friend of friends) {
    await friend.client.mutation(api.groups.join, { code });
  }
  return { groupId, members };
}

/** The member list the expense form gets from groups.get. */
async function formMembers(member: Member, groupId: Id<"groups">): Promise<GroupMember[]> {
  return (await member.client.query(api.groups.get, { groupId }))?.members ?? [];
}

type ExpenseForm = {
  concept: string;
  /** Total as typed, e.g. "90,00". */
  amount: string;
  /** Who takes part; everyone by default, like the form. */
  participants?: Member[];
  mode?: SplitMode;
  /** «Imports» or «Percentatges» typed by hand, by member; the rest keep the suggestion. */
  typed?: Map<Member, string>;
};

/**
 * Does what the new expense screen does: start from the defaults, apply the
 * user's choices (the suggested shares are refreshed as the form does), check
 * everything in the browser and send groups.createExpense. The payer submits.
 */
async function payWithForm(payer: Member, groupId: Id<"groups">, form: ExpenseForm) {
  const members = await formMembers(payer, groupId);
  let fields = initialGroupExpenseFields(members, payer.userId);
  fields = {
    ...fields,
    concept: form.concept,
    amount: form.amount,
    participants: form.participants?.map((member) => member.userId) ?? fields.participants,
    mode: form.mode ?? "equal",
  };
  fields = { ...fields, ...suggestedShares(fields) };
  for (const [member, value] of form.typed ?? []) {
    if (fields.mode === "amounts") {
      fields.amounts = { ...fields.amounts, [member.userId]: value };
    } else {
      fields.percentages = { ...fields.percentages, [member.userId]: value };
    }
  }

  const { args, errors } = parseGroupExpenseFields(fields);
  if (args === null) {
    throw new Error(`The form should accept this expense: ${JSON.stringify(errors)}`);
  }
  return payer.client.mutation(api.groups.createExpense, { groupId, ...args });
}

async function balancesSeenBy(member: Member, groupId: Id<"groups">): Promise<Balances> {
  const result = await member.client.query(api.groups.getBalances, { groupId });
  if (result === null) {
    throw new Error(`${member.name} should see the balances of the group`);
  }
  return result;
}

/** «Confirmar pagament» on a «Per saldar» card: sends what the card shows. */
function settleCard(member: Member, groupId: Id<"groups">, card: Card) {
  return member.client.mutation(api.groups.settleDebt, {
    groupId,
    fromUserId: card.fromUserId,
    toUserId: card.toUserId,
    amountCents: card.amountCents,
  });
}

/** Balance of each member by name, e.g. { Ana: 5000, Bert: -1000 }. */
function balanceByName(result: Balances): Record<string, number> {
  return Object.fromEntries(result.balances.map((row) => [row.name, row.balanceCents]));
}

/** «Per saldar» cards as the user reads them: «Bert paga a Ana» + cents. */
function cardsOf(result: Balances): string[] {
  return result.transfers.map((card) => `${card.fromName} → ${card.toName}: ${card.amountCents}`);
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

/**
 * The error a failing call gives the dialog. convex-test hands ConvexError
 * data back as a JSON string, while the browser client (convex/react) parses
 * it, so this parses it too.
 */
async function rejectionOf(promise: Promise<unknown>): Promise<unknown> {
  const error: unknown = await promise.then(
    () => expect.fail("Expected the call to fail"),
    (rejection: unknown) => rejection,
  );
  if (error instanceof ConvexError && typeof error.data === "string") {
    return new ConvexError(JSON.parse(error.data) as Value);
  }
  return error;
}

describe("US4.3 AC1 · «Balanços»: què ha pagat i què li toca a cadascú", () => {
  it("a trip with two expenses gives who is owed and who owes, adding up to zero", async () => {
    const t = setup();
    const { groupId, members } = await groupWith(t, ["Ana", "Bert", "Carla"]);
    const [ana, bert] = members;

    await payWithForm(ana, groupId, { concept: "Hotel", amount: "90,00" });
    await payWithForm(bert, groupId, { concept: "Sopar", amount: "30,00" });

    const result = await balancesSeenBy(ana, groupId);
    // Ana: 90 − 30 − 10 = +50 · Bert: 30 − 30 − 10 = −10 · Carla: −30 − 10 = −40.
    expect(balanceByName(result)).toEqual({ Ana: 5000, Bert: -1000, Carla: -4000 });
    expect(sum(result.balances.map((row) => row.balanceCents))).toBe(0);
  });

  it("expenses split by «Percentatges» and by «Imports» count each person's share", async () => {
    const t = setup();
    const { groupId, members } = await groupWith(t, ["Ana", "Bert", "Carla"]);
    const [ana, bert, carla] = members;

    await payWithForm(bert, groupId, {
      concept: "Lloguer del cotxe",
      amount: "60,00",
      mode: "percentages",
      typed: new Map([
        [ana, "50"],
        [bert, "25"],
        [carla, "25"],
      ]),
    });
    // Carla paid but does not take part.
    await payWithForm(carla, groupId, {
      concept: "Entrades",
      amount: "20,00",
      participants: [ana, bert],
      mode: "amounts",
      typed: new Map([
        [ana, "5,00"],
        [bert, "15,00"],
      ]),
    });

    const result = await balancesSeenBy(carla, groupId);
    // Ana: −30 − 5 = −35 · Bert: 60 − 15 − 15 = +30 · Carla: 20 − 15 = +5.
    expect(balanceByName(result)).toEqual({ Ana: -3500, Bert: 3000, Carla: 500 });
    expect(cardsOf(result)).toEqual(["Ana → Bert: 3000", "Ana → Carla: 500"]);
  });

  it("an amount that cannot be split equally does not lose or create a cent", async () => {
    const t = setup();
    const { groupId, members } = await groupWith(t, ["Ana", "Bert", "Carla"]);
    const [ana, , carla] = members;

    await payWithForm(carla, groupId, { concept: "Gelats", amount: "10,00" });

    const result = await balancesSeenBy(ana, groupId);
    const balances = result.balances.map((row) => row.balanceCents);
    expect(sum(balances)).toBe(0);
    // 10,00 € / 3 → 3,34 + 3,33 + 3,33: Carla gets back exactly what the others owe.
    const carlaBalance = balanceByName(result).Carla;
    expect([666, 667]).toContain(carlaBalance);
    expect(sum(result.transfers.map((card) => card.amountCents))).toBe(carlaBalance);
  });

  it("every member sees the same balances and the same «Per saldar» cards", async () => {
    const t = setup();
    const { groupId, members } = await groupWith(t, ["Ana", "Bert", "Carla"]);
    const [ana, bert] = members;
    await payWithForm(ana, groupId, { concept: "Hotel", amount: "90,00" });
    await payWithForm(bert, groupId, { concept: "Sopar", amount: "30,00" });

    const seen = await Promise.all(members.map((member) => balancesSeenBy(member, groupId)));

    for (const result of seen) {
      expect(result).toEqual(seen[0]);
    }
  });
});

describe("US4.3 AC2 · «Per saldar»: els mínims pagaments per quedar en pau", () => {
  it("suggests the biggest debts first, with the names the cards show", async () => {
    const t = setup();
    const { groupId, members } = await groupWith(t, ["Ana", "Bert", "Carla"]);
    const [ana, bert] = members;
    await payWithForm(ana, groupId, { concept: "Hotel", amount: "90,00" });
    await payWithForm(bert, groupId, { concept: "Sopar", amount: "30,00" });

    const result = await balancesSeenBy(bert, groupId);

    expect(cardsOf(result)).toEqual(["Carla → Ana: 4000", "Bert → Ana: 1000"]);
  });

  it("chains debts: a member who paid and owes the same ends «En pau» and out of the cards", async () => {
    const t = setup();
    const { groupId, members } = await groupWith(t, ["Ana", "Bert", "Carla"]);
    const [ana, bert, carla] = members;

    // Ana pays for Bert, and Bert pays the same for Carla.
    await payWithForm(ana, groupId, { concept: "Bitllet de Bert", amount: "10,00", participants: [bert] });
    await payWithForm(bert, groupId, { concept: "Bitllet de Carla", amount: "10,00", participants: [carla] });

    const result = await balancesSeenBy(ana, groupId);
    expect(balanceByName(result)).toEqual({ Ana: 1000, Bert: 0, Carla: -1000 });
    // One payment instead of two: Carla pays Ana directly.
    expect(cardsOf(result)).toEqual(["Carla → Ana: 1000"]);
  });
});

describe("US4.3 AC3 · «Saldar deute»", () => {
  it("settling every card leaves the whole group «En pau» and the history untouched", async () => {
    const t = setup();
    const { groupId, members } = await groupWith(t, ["Ana", "Bert", "Carla"]);
    const [ana, bert] = members;
    await payWithForm(ana, groupId, { concept: "Hotel", amount: "90,00" });
    await payWithForm(bert, groupId, { concept: "Sopar", amount: "30,00" });
    const historyBefore = await ana.client.query(api.groups.listExpenses, { groupId });

    const [carlaPaysAna, bertPaysAna] = (await balancesSeenBy(ana, groupId)).transfers;
    // Bert settles his own debt; Ana marks Carla's as received.
    await settleCard(bert, groupId, bertPaysAna);
    expect(cardsOf(await balancesSeenBy(ana, groupId))).toEqual(["Carla → Ana: 4000"]);
    await settleCard(ana, groupId, carlaPaysAna);

    const after = await balancesSeenBy(bert, groupId);
    expect(balanceByName(after)).toEqual({ Ana: 0, Bert: 0, Carla: 0 });
    expect(after.transfers).toEqual([]);
    // Settlements do not show up in the history nor change any expense.
    expect(await ana.client.query(api.groups.listExpenses, { groupId })).toEqual(historyBefore);
  });

  it("a member who is not in the debt can record it, and the settler is saved", async () => {
    const t = setup();
    const { groupId, members } = await groupWith(t, ["Ana", "Bert", "Carla"]);
    const [ana, bert, carla] = members;
    await payWithForm(ana, groupId, { concept: "Taxi", amount: "20,00", participants: [ana, bert] });
    const [bertPaysAna] = (await balancesSeenBy(carla, groupId)).transfers;

    await settleCard(carla, groupId, bertPaysAna);

    expect((await balancesSeenBy(ana, groupId)).transfers).toEqual([]);
    const [settlement] = await t.run((ctx) => ctx.db.query("groupSettlements").collect());
    expect(settlement).toMatchObject({
      fromUserId: bert.userId,
      toUserId: ana.userId,
      amountCents: 1000,
      recordedBy: carla.userId,
    });
  });

  it("an expense added after settling opens new debts only for that expense", async () => {
    const t = setup();
    const { groupId, members } = await groupWith(t, ["Ana", "Bert", "Carla"]);
    const [ana, bert, carla] = members;
    await payWithForm(ana, groupId, { concept: "Taxi", amount: "20,00", participants: [ana, bert] });
    await settleCard(bert, groupId, (await balancesSeenBy(bert, groupId)).transfers[0]);

    await payWithForm(carla, groupId, { concept: "Museu", amount: "24,00", participants: [ana, carla] });

    const result = await balancesSeenBy(ana, groupId);
    expect(balanceByName(result)).toEqual({ Ana: -1200, Bert: 0, Carla: 1200 });
    expect(cardsOf(result)).toEqual(["Ana → Carla: 1200"]);
  });

  it("a card that changed while the dialog was open is rejected with the message for the dialog", async () => {
    const t = setup();
    const { groupId, members } = await groupWith(t, ["Ana", "Bert", "Carla"]);
    const [ana, bert, carla] = members;
    await payWithForm(ana, groupId, { concept: "Taxi", amount: "30,00", participants: [ana, bert] });
    // Bert opens «Bert paga a Ana · 15,00 €»…
    const [staleCard] = (await balancesSeenBy(bert, groupId)).transfers;
    expect(cardsOf({ balances: [], transfers: [staleCard] })).toEqual(["Bert → Ana: 1500"]);

    // …meanwhile Carla adds a dinner, so the debts change.
    await payWithForm(carla, groupId, { concept: "Sopar", amount: "20,00", participants: [ana, bert] });
    const error = await rejectionOf(settleCard(bert, groupId, staleCard));

    // useSettleDebt shows this message inside the dialog (#140).
    expect(error).toBeInstanceOf(ConvexError);
    expect((error as ConvexError<Value>).data).toEqual({
      code: "TRANSFER_NOT_PENDING",
      message: TRANSFER_NOT_PENDING_MESSAGE,
    });
    expect(await t.run((ctx) => ctx.db.query("groupSettlements").collect())).toEqual([]);

    // The new cards can be settled and everyone ends «En pau».
    const fresh = await balancesSeenBy(bert, groupId);
    expect(cardsOf(fresh)).toEqual(["Bert → Carla: 2000", "Bert → Ana: 500"]);
    for (const card of fresh.transfers) {
      await settleCard(bert, groupId, card);
    }
    expect(Object.values(balanceByName(await balancesSeenBy(ana, groupId)))).toEqual([0, 0, 0]);
  });

  it("two members confirming the same card at once only record one payment", async () => {
    const t = setup();
    const { groupId, members } = await groupWith(t, ["Ana", "Bert", "Carla"]);
    const [ana, bert] = members;
    await payWithForm(ana, groupId, { concept: "Taxi", amount: "20,00", participants: [ana, bert] });
    const [card] = (await balancesSeenBy(ana, groupId)).transfers;

    const results = await Promise.allSettled([
      settleCard(ana, groupId, card),
      settleCard(bert, groupId, card),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(await t.run((ctx) => ctx.db.query("groupSettlements").collect())).toHaveLength(1);
    expect(balanceByName(await balancesSeenBy(bert, groupId))).toEqual({ Ana: 0, Bert: 0, Carla: 0 });
  });
});

describe("US4.3 · regressió amb un grup gran", () => {
  it("after many expenses of every kind, settling the cards always ends «En pau» in at most n − 1 payments", async () => {
    const t = setup();
    const { groupId, members } = await groupWith(t, ["Ana", "Bert", "Carla", "Dani", "Eva"]);
    const modes: SplitMode[] = ["equal", "amounts", "percentages"];

    // 15 expenses with awkward amounts, different payers and different participants.
    for (let index = 0; index < 15; index += 1) {
      const payer = members[(index * 3) % members.length];
      const participants = members.filter((_, position) => (index + position) % 3 !== 0);
      const cents = 101 + ((index * 1237) % 9000);
      await payWithForm(payer, groupId, {
        concept: `Despesa ${index + 1}`,
        amount: `${Math.floor(cents / 100)},${String(cents % 100).padStart(2, "0")}`,
        participants,
        mode: modes[index % modes.length],
      });
    }

    // Oracle: paid as payer − own shares, straight from the saved expenses.
    const expenses = await t.run((ctx) => ctx.db.query("groupExpenses").collect());
    const expected = Object.fromEntries(
      members.map((member) => [
        member.name,
        sum(
          expenses.map(
            (expense) =>
              (expense.paidBy === member.userId ? expense.amountCents : 0) -
              sum(
                expense.shares
                  .filter((share) => share.userId === member.userId)
                  .map((share) => share.amountCents),
              ),
          ),
        ),
      ]),
    );
    const before = await balancesSeenBy(members[0], groupId);
    expect(balanceByName(before)).toEqual(expected);
    expect(before.transfers.length).toBeLessThanOrEqual(members.length - 1);
    expect(before.transfers.every((card) => card.amountCents > 0)).toBe(true);

    for (const [index, card] of before.transfers.entries()) {
      await settleCard(members[index % members.length], groupId, card);
    }

    const after = await balancesSeenBy(members[4], groupId);
    expect(after.balances.every((row) => row.balanceCents === 0)).toBe(true);
    expect(after.transfers).toEqual([]);
    expect(await t.run((ctx) => ctx.db.query("groupExpenses").collect())).toEqual(expenses);
  });
});
