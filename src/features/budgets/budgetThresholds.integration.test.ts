/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { ConvexError, type Value } from "convex/values";
import { describe, expect, it } from "vitest";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { BUDGET_EXISTS_MESSAGE } from "../../../convex/budgets";
import type { BudgetCategory } from "../../../convex/lib/budgetCategories";
import type { TransactionCategory } from "../../../convex/lib/transactionCategories";
import schema from "../../../convex/schema";
import { getMonthBounds } from "../transactions/monthBounds";
import {
  emptyTransactionFields,
  parseTransactionFields,
  type TransactionType,
} from "../transactions/hooks/useTransactionForm";
import {
  budgetBarWidth,
  budgetPercent,
  budgetStatus,
  MAX_BUDGET_ALERT,
  selectTopBudgets,
  type BudgetStatus,
} from "./budgetProgress";
import { HOME_BUDGET_LIMIT } from "./components/HomeBudgetSummary";
import {
  budgetToFields,
  CATEGORY_TAKEN_MESSAGE,
  EMPTY_BUDGET_FIELDS,
  getBudgetErrors,
  parseBudgetFields,
  takenCategories,
} from "./hooks/useBudgetForm";

// US3.1 · Pressupostos per categoria — integration / acceptance tests of the
// 80% and 100% thresholds.
//
// The unit tests check each piece alone: the bar helpers (budgetProgress.test.ts),
// the form (useBudgetForm.test.ts) and each backend function (convex/budgets.test.ts).
// These tests follow the user instead: they create budgets with the real form
// helpers, add expenses with the real transaction form, read `budgets.list`
// with the same month bounds as /budgets and the home screen, and turn each
// row into what BudgetProgressRow shows (percentage, colour, bar and alert).

const modules = import.meta.glob("../../../convex/**/!(*.*.*)*.*s");

/** «Today» in the tests: 15 November 2026 at noon, in the user's time zone. */
const NOW = new Date(2026, 10, 15, 12, 0).getTime();

function setup() {
  return convexTest(schema, modules);
}

type TestConvex = ReturnType<typeof setup>;
type Client = Awaited<ReturnType<typeof signedInAs>>["client"];

async function signedInAs(t: TestConvex, name: string) {
  const userId = await t.run((ctx) => ctx.db.insert("users", { name }));
  return { userId, client: t.withIdentity({ subject: `${userId}|session` }) };
}

/** What /budgets and the home screen ask for: this month's budgets with their spending. */
function budgetsThisMonth(client: Client, nowMs = NOW) {
  return client.query(api.budgets.list, getMonthBounds(nowMs));
}

/**
 * Does what /budgets/new does on submit: the categories already taken come
 * from the same list, the fields are checked in the browser, then create.
 */
async function createBudgetWithForm(client: Client, category: BudgetCategory, amount: string) {
  const taken = takenCategories(await budgetsThisMonth(client));
  const { args, errors } = parseBudgetFields({ category, amount }, taken);
  if (args === null) {
    throw new Error(`The form should accept this budget: ${JSON.stringify(errors)}`);
  }
  return client.mutation(api.budgets.create, args);
}

/** Does what /budgets/:id/edit does on submit: only the limit changes. */
async function changeLimitWithForm(client: Client, budgetId: Id<"budgets">, amount: string) {
  const budget = await client.query(api.budgets.get, { budgetId });
  if (budget === null) {
    throw new Error("The edit screen should find the budget");
  }
  const fields = { ...budgetToFields(budget), amount };
  const { args, errors } = parseBudgetFields(fields);
  if (args === null) {
    throw new Error(`The form should accept this limit: ${JSON.stringify(errors)}`);
  }
  return client.mutation(api.budgets.update, { budgetId, ...args, category: budget.category });
}

type Movement = {
  amount: string;
  category: TransactionCategory;
  type?: TransactionType;
  /** Day as the date input gives it; today by default. */
  date?: string;
  /** Clock used for the time of day (the form takes it from «now»). */
  clock?: number;
};

/** Does what /transactions/new does on submit. */
async function addMovementWithForm(client: Client, movement: Movement) {
  const clock = movement.clock ?? NOW;
  const fields = {
    ...emptyTransactionFields(clock),
    type: movement.type ?? "expense",
    amount: movement.amount,
    category: movement.category,
    concept: "Moviment",
    ...(movement.date ? { date: movement.date } : {}),
  };
  const { args, errors } = parseTransactionFields(fields, clock);
  if (args === null) {
    throw new Error(`The form should accept this movement: ${JSON.stringify(errors)}`);
  }
  return client.mutation(api.transactions.create, args);
}

type Row = { category: BudgetCategory; amountCents: number; spentCents: number };

/** What BudgetProgressRow shows for one budget. */
function onScreen(row: Row) {
  const percent = budgetPercent(row);
  const status = budgetStatus(percent);
  return {
    category: row.category,
    text: `${percent}%`,
    status,
    barWidth: budgetBarWidth(percent),
    alert: ALERT_TEXT[status],
  };
}

const ALERT_TEXT: Record<BudgetStatus, string | null> = {
  ok: null,
  warning: "Has arribat al 80% del pressupost.",
  exceeded: "Has superat el pressupost.",
};

async function rowOf(client: Client, category: BudgetCategory, nowMs = NOW) {
  const row = (await budgetsThisMonth(client, nowMs)).find((budget) => budget.category === category);
  if (row === undefined) {
    throw new Error(`There should be a ${category} budget`);
  }
  return onScreen(row);
}

/**
 * The error a failing call gives the form. convex-test hands ConvexError data
 * back as a JSON string, while the browser client (convex/react) parses it, so
 * this parses it too.
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

describe("US3.1 AC3 · llindars del 80% i del 100%", () => {
  it("uses the fixed thresholds of the story: MAX_BUDGET_ALERT = 80", () => {
    expect(MAX_BUDGET_ALERT).toBe(80);
  });

  it.each([
    { spent: "0,01", text: "0%", status: "ok", barWidth: 0 },
    { spent: "79,99", text: "79%", status: "ok", barWidth: 79 },
    { spent: "80,00", text: "80%", status: "warning", barWidth: 80 },
    { spent: "99,99", text: "99%", status: "warning", barWidth: 99 },
    { spent: "100,00", text: "100%", status: "exceeded", barWidth: 100 },
    { spent: "150,00", text: "150%", status: "exceeded", barWidth: 100 },
  ])("a 100,00 € budget with $spent € spent shows $text ($status)", async (testCase) => {
    const t = setup();
    const ana = await signedInAs(t, "Ana");
    await createBudgetWithForm(ana.client, "groceries", "100,00");

    await addMovementWithForm(ana.client, { amount: testCase.spent, category: "groceries" });

    expect(await rowOf(ana.client, "groceries")).toEqual({
      category: "groceries",
      text: testCase.text,
      status: testCase.status,
      barWidth: testCase.barWidth,
      alert: ALERT_TEXT[testCase.status as BudgetStatus],
    });
  });

  it.each([
    { spent: "266,66", text: "79%", status: "ok" },
    { spent: "266,67", text: "80%", status: "warning" },
    { spent: "333,32", text: "99%", status: "warning" },
    { spent: "333,33", text: "100%", status: "exceeded" },
  ])("with an odd limit (333,33 €) the colour changes exactly at the threshold: $spent €", async (testCase) => {
    const t = setup();
    const ana = await signedInAs(t, "Ana");
    await createBudgetWithForm(ana.client, "housing", "333,33");

    await addMovementWithForm(ana.client, { amount: testCase.spent, category: "housing" });

    const row = await rowOf(ana.client, "housing");
    expect(row.text).toBe(testCase.text);
    expect(row.status).toBe(testCase.status);
  });

  it("the alerts follow the user's spending during the month, and go back when a movement is undone", async () => {
    const t = setup();
    const ana = await signedInAs(t, "Ana");
    await createBudgetWithForm(ana.client, "restaurants", "200,00");
    const statuses: string[] = [];
    const snapshot = async () => {
      const row = await rowOf(ana.client, "restaurants");
      statuses.push(`${row.text} ${row.status}`);
    };

    await snapshot();
    await addMovementWithForm(ana.client, { amount: "120,00", category: "restaurants" });
    await snapshot();
    await addMovementWithForm(ana.client, { amount: "45,50", category: "restaurants" });
    await snapshot();
    const lastDinner = await addMovementWithForm(ana.client, { amount: "40,00", category: "restaurants" });
    await snapshot();
    await ana.client.mutation(api.transactions.remove, { transactionId: lastDinner });
    await snapshot();

    expect(statuses).toEqual([
      "0% ok",
      "60% ok",
      "82% warning",
      "102% exceeded",
      "82% warning",
    ]);
  });

  it("editing an expense moves the budget across the threshold", async () => {
    const t = setup();
    const ana = await signedInAs(t, "Ana");
    await createBudgetWithForm(ana.client, "transport", "50,00");
    const ticket = await addMovementWithForm(ana.client, { amount: "30,00", category: "transport" });
    expect((await rowOf(ana.client, "transport")).status).toBe("ok");

    const stored = await ana.client.query(api.transactions.get, { transactionId: ticket });
    if (stored === null) {
      throw new Error("The movement should exist");
    }
    await ana.client.mutation(api.transactions.update, {
      transactionId: ticket,
      type: stored.type,
      date: stored.date,
      category: stored.category,
      concept: stored.concept,
      amountCents: 5000,
    });

    expect(await rowOf(ana.client, "transport")).toMatchObject({ text: "100%", status: "exceeded" });
  });

  it("raising the limit in the edit screen turns an exceeded budget back to normal", async () => {
    const t = setup();
    const ana = await signedInAs(t, "Ana");
    const budgetId = await createBudgetWithForm(ana.client, "leisure", "60,00");
    await addMovementWithForm(ana.client, { amount: "66,00", category: "leisure" });
    expect((await rowOf(ana.client, "leisure")).status).toBe("exceeded");

    await changeLimitWithForm(ana.client, budgetId, "75,00");
    expect(await rowOf(ana.client, "leisure")).toMatchObject({ text: "88%", status: "warning" });

    await changeLimitWithForm(ana.client, budgetId, "100,00");
    expect(await rowOf(ana.client, "leisure")).toMatchObject({ text: "66%", status: "ok", alert: null });
  });
});

describe("US3.1 · què compta com a consum del mes", () => {
  it("counts only this calendar month, from the first to the last millisecond", async () => {
    const t = setup();
    const ana = await signedInAs(t, "Ana");
    await createBudgetWithForm(ana.client, "groceries", "100,00");
    const firstInstant = new Date(2026, 10, 1, 0, 0, 0, 0).getTime();
    const lastInstant = new Date(2026, 10, 30, 23, 59, 59, 999).getTime();
    const before = new Date(2026, 9, 31, 23, 59, 59, 999).getTime();
    const after = new Date(2026, 11, 1, 0, 0, 0, 0).getTime();

    await addMovementWithForm(ana.client, { amount: "40,00", category: "groceries", date: "2026-11-01", clock: firstInstant });
    await addMovementWithForm(ana.client, { amount: "40,00", category: "groceries", date: "2026-11-30", clock: lastInstant });
    await addMovementWithForm(ana.client, { amount: "500,00", category: "groceries", date: "2026-10-31", clock: before });
    await addMovementWithForm(ana.client, { amount: "500,00", category: "groceries", date: "2026-12-01", clock: after });

    expect(await rowOf(ana.client, "groceries")).toMatchObject({ text: "80%", status: "warning" });
  });

  it("ignores income, other categories and other users' expenses", async () => {
    const t = setup();
    const ana = await signedInAs(t, "Ana");
    const bert = await signedInAs(t, "Bert");
    await createBudgetWithForm(ana.client, "shopping", "100,00");

    await addMovementWithForm(ana.client, { amount: "70,00", category: "shopping" });
    await addMovementWithForm(ana.client, { amount: "500,00", category: "shopping", type: "income" });
    await addMovementWithForm(ana.client, { amount: "500,00", category: "gifts" });
    await addMovementWithForm(bert.client, { amount: "500,00", category: "shopping" });

    expect(await rowOf(ana.client, "shopping")).toMatchObject({ text: "70%", status: "ok" });
    expect(await budgetsThisMonth(bert.client)).toEqual([]);
  });

  it("a budget exceeded in November starts December at 0% without touching anything", async () => {
    const t = setup();
    const ana = await signedInAs(t, "Ana");
    await createBudgetWithForm(ana.client, "subscriptions", "20,00");
    await addMovementWithForm(ana.client, { amount: "25,00", category: "subscriptions" });
    const december = new Date(2026, 11, 5, 9, 0).getTime();

    expect((await rowOf(ana.client, "subscriptions")).status).toBe("exceeded");
    expect(await rowOf(ana.client, "subscriptions", december)).toMatchObject({
      text: "0%",
      status: "ok",
      barWidth: 0,
    });
  });
});

describe("US3.1 AC2 · resum a l'inici i pantalla /budgets", () => {
  it("the home screen shows the 3 budgets closest to their limit, the exceeded ones first", async () => {
    const t = setup();
    const ana = await signedInAs(t, "Ana");
    const plan: [BudgetCategory, string, string][] = [
      ["groceries", "300,00", "150,00"], // 50%
      ["transport", "50,00", "55,00"], // 110%
      ["leisure", "100,00", "85,00"], // 85%
      ["health", "80,00", "10,00"], // 12%
      ["restaurants", "120,00", "119,00"], // 99%
    ];
    for (const [category, limit, spent] of plan) {
      await createBudgetWithForm(ana.client, category, limit);
      await addMovementWithForm(ana.client, { amount: spent, category });
    }

    const budgets = await budgetsThisMonth(ana.client);
    const home = selectTopBudgets(budgets, HOME_BUDGET_LIMIT).map(onScreen);
    const all = selectTopBudgets(budgets, budgets.length).map(onScreen);

    expect(home.map((row) => `${row.category} ${row.text} ${row.status}`)).toEqual([
      "transport 110% exceeded",
      "restaurants 99% warning",
      "leisure 85% warning",
    ]);
    // /budgets shows every budget in the same order, with the same rows on top.
    expect(all).toHaveLength(5);
    expect(all.slice(0, HOME_BUDGET_LIMIT)).toEqual(home);
  });
});

describe("US3.1 AC1 · un pressupost per categoria", () => {
  it("the form hides a category that already has a budget, and the backend says the same", async () => {
    const t = setup();
    const ana = await signedInAs(t, "Ana");
    await createBudgetWithForm(ana.client, "groceries", "300,00");

    const taken = takenCategories(await budgetsThisMonth(ana.client));
    const inTheBrowser = parseBudgetFields({ ...EMPTY_BUDGET_FIELDS, category: "groceries", amount: "50,00" }, taken);
    const fromTheBackend = getBudgetErrors(
      await rejectionOf(ana.client.mutation(api.budgets.create, { category: "groceries", amountCents: 5000 })),
    );

    expect(inTheBrowser).toEqual({ args: null, errors: { category: CATEGORY_TAKEN_MESSAGE } });
    expect(fromTheBackend).toEqual({ fieldErrors: { category: BUDGET_EXISTS_MESSAGE } });
    expect(CATEGORY_TAKEN_MESSAGE).toBe(BUDGET_EXISTS_MESSAGE);
    expect(await budgetsThisMonth(ana.client)).toHaveLength(1);
  });
});
