import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
  AMOUNTS_SUM_MESSAGE,
  PERCENTAGES_SUM_MESSAGE,
} from "../../../../convex/lib/splitExpense";
import { groupPath, newGroupExpensePath } from "../groupExpensePaths";
import { memberLabel } from "../memberLabel";
import {
  getGroupExpenseErrors,
  initialGroupExpenseFields,
  INVALID_AMOUNT_FORMAT_MESSAGE,
  INVALID_PERCENTAGE_FORMAT_MESSAGE,
  MISSING_PAYER_MESSAGE,
  NO_PARTICIPANTS_MESSAGE,
  NOT_FOUND_ALERT,
  parseGroupExpenseFields,
  parsePercentage,
  REQUIRED_FIELD_MESSAGE,
  SAVE_ERROR_ALERT,
  suggestedShares,
  type GroupExpenseFields,
} from "./useGroupExpenseForm";

const ANA = "ana" as Id<"users">;
const BERNAT = "bernat" as Id<"users">;
const CARLA = "carla" as Id<"users">;
const MEMBERS = [
  { userId: ANA, name: "Ana" },
  { userId: BERNAT, name: "Bernat" },
  { userId: CARLA, name: "Carla" },
];

const VALID: GroupExpenseFields = {
  concept: "  Sopar  ",
  amount: "60,00",
  paidBy: ANA,
  participants: [ANA, BERNAT, CARLA],
  mode: "equal",
  amounts: {},
  percentages: {},
};

describe("initialGroupExpenseFields", () => {
  it("starts with the current user as payer, everyone taking part and an equal split", () => {
    expect(initialGroupExpenseFields(MEMBERS, BERNAT)).toMatchObject({
      paidBy: BERNAT,
      participants: [ANA, BERNAT, CARLA],
      mode: "equal",
    });
  });

  it("leaves the payer empty when the current user is not a member", () => {
    expect(initialGroupExpenseFields(MEMBERS, "zoe" as Id<"users">).paidBy).toBe("");
  });
});

describe("parseGroupExpenseFields · equal", () => {
  it("builds the createExpense arguments", () => {
    expect(parseGroupExpenseFields(VALID)).toEqual({
      args: {
        concept: "Sopar",
        amountCents: 6000,
        paidBy: ANA,
        split: { mode: "equal", participants: [ANA, BERNAT, CARLA] },
      },
      errors: {},
    });
  });

  it("marks every missing field", () => {
    const fields = { ...VALID, concept: " ", amount: "", paidBy: "" as const, participants: [] };
    expect(parseGroupExpenseFields(fields)).toEqual({
      args: null,
      errors: {
        concept: "El concepte és obligatori.",
        amount: REQUIRED_FIELD_MESSAGE,
        paidBy: MISSING_PAYER_MESSAGE,
        participants: NO_PARTICIPANTS_MESSAGE,
      },
    });
  });

  it("rejects a concept longer than 80 characters and a zero or badly written amount", () => {
    expect(parseGroupExpenseFields({ ...VALID, concept: "a".repeat(81) }).errors).toEqual({
      concept: "El concepte és massa llarg.",
    });
    expect(parseGroupExpenseFields({ ...VALID, amount: "0" }).errors).toEqual({
      amount: "L'import ha de ser més gran que zero.",
    });
    expect(parseGroupExpenseFields({ ...VALID, amount: "abc" }).errors).toEqual({
      amount: INVALID_AMOUNT_FORMAT_MESSAGE,
    });
  });

  it("lets the payer stay out of the participants", () => {
    const { args } = parseGroupExpenseFields({ ...VALID, participants: [BERNAT, CARLA] });
    expect(args?.paidBy).toBe(ANA);
    expect(args?.split).toEqual({ mode: "equal", participants: [BERNAT, CARLA] });
  });
});

describe("parseGroupExpenseFields · amounts", () => {
  const AMOUNTS: GroupExpenseFields = {
    ...VALID,
    mode: "amounts",
    amounts: { [ANA]: "30", [BERNAT]: "20,00", [CARLA]: "10" },
  };

  it("sends each participant's cents when they add up to the total", () => {
    expect(parseGroupExpenseFields(AMOUNTS).args?.split).toEqual({
      mode: "amounts",
      shares: [
        { userId: ANA, amountCents: 3000 },
        { userId: BERNAT, amountCents: 2000 },
        { userId: CARLA, amountCents: 1000 },
      ],
    });
  });

  it("does not save when the amounts do not add up to the total", () => {
    const fields = { ...AMOUNTS, amounts: { ...AMOUNTS.amounts, [CARLA]: "5" } };
    expect(parseGroupExpenseFields(fields)).toEqual({
      args: null,
      errors: { split: AMOUNTS_SUM_MESSAGE },
    });
  });

  it("marks each empty or badly written share", () => {
    const fields = { ...AMOUNTS, amounts: { [ANA]: "30", [BERNAT]: "", [CARLA]: "x" } };
    expect(parseGroupExpenseFields(fields).errors).toEqual({
      shares: { [BERNAT]: REQUIRED_FIELD_MESSAGE, [CARLA]: INVALID_AMOUNT_FORMAT_MESSAGE },
    });
  });

  it("only asks for the shares of the members who take part", () => {
    const fields = { ...AMOUNTS, participants: [ANA, BERNAT], amounts: { [ANA]: "40", [BERNAT]: "20" } };
    expect(parseGroupExpenseFields(fields).errors).toEqual({});
  });
});

describe("parseGroupExpenseFields · percentages", () => {
  const PERCENTAGES: GroupExpenseFields = {
    ...VALID,
    mode: "percentages",
    percentages: { [ANA]: "50", [BERNAT]: "33,33", [CARLA]: "16.67" },
  };

  it("sends each participant's percentage when they add up to 100", () => {
    expect(parseGroupExpenseFields(PERCENTAGES).args?.split).toEqual({
      mode: "percentages",
      shares: [
        { userId: ANA, percentage: 50 },
        { userId: BERNAT, percentage: 33.33 },
        { userId: CARLA, percentage: 16.67 },
      ],
    });
  });

  it("does not save when the percentages do not add up to 100", () => {
    const fields = { ...PERCENTAGES, percentages: { ...PERCENTAGES.percentages, [CARLA]: "10" } };
    expect(parseGroupExpenseFields(fields)).toEqual({
      args: null,
      errors: { split: PERCENTAGES_SUM_MESSAGE },
    });
  });

  it("rejects a percentage with more than two decimals", () => {
    const fields = { ...PERCENTAGES, percentages: { ...PERCENTAGES.percentages, [CARLA]: "16,666" } };
    expect(parseGroupExpenseFields(fields).errors).toEqual({
      shares: { [CARLA]: INVALID_PERCENTAGE_FORMAT_MESSAGE },
    });
  });
});

describe("parsePercentage", () => {
  it("accepts a comma or a dot and up to two decimals", () => {
    expect(parsePercentage("33,33")).toBe(33.33);
    expect(parsePercentage(" 50 ")).toBe(50);
    expect(parsePercentage("12.5")).toBe(12.5);
  });

  it("rejects anything else", () => {
    expect(parsePercentage("abc")).toBeNull();
    expect(parsePercentage("-10")).toBeNull();
    expect(parsePercentage("1,234")).toBeNull();
  });
});

describe("suggestedShares", () => {
  it("splits the total and 100% equally, leftovers to the first participants", () => {
    expect(suggestedShares({ amount: "10", participants: [ANA, BERNAT, CARLA] })).toEqual({
      amounts: { [ANA]: "3,34", [BERNAT]: "3,33", [CARLA]: "3,33" },
      percentages: { [ANA]: "33,34", [BERNAT]: "33,33", [CARLA]: "33,33" },
    });
  });

  it("suggests round percentages without decimals", () => {
    expect(suggestedShares({ amount: "", participants: [ANA, BERNAT] }).percentages).toEqual({
      [ANA]: "50",
      [BERNAT]: "50",
    });
  });

  it("leaves the amounts empty while the total is not valid", () => {
    expect(suggestedShares({ amount: "", participants: [ANA] }).amounts).toEqual({ [ANA]: "" });
  });

  it("returns nothing when nobody takes part", () => {
    expect(suggestedShares({ amount: "10", participants: [] })).toEqual({
      amounts: {},
      percentages: {},
    });
  });

  it("gives suggestions that the form accepts as they are", () => {
    const participants = [ANA, BERNAT, CARLA];
    const shares = suggestedShares({ amount: "100", participants });
    for (const mode of ["amounts", "percentages"] as const) {
      const fields = { ...VALID, amount: "100", participants, mode, ...shares };
      expect(parseGroupExpenseFields(fields).errors).toEqual({});
    }
  });
});

describe("getGroupExpenseErrors", () => {
  it.each([
    ["INVALID_CONCEPT", "concept"],
    ["INVALID_AMOUNT", "amount"],
    ["INVALID_PAYER", "paidBy"],
    ["INVALID_PARTICIPANTS", "participants"],
    ["INVALID_SPLIT", "split"],
  ])("puts %s under the %s field", (code, field) => {
    const error = new ConvexError({ code, message: "Missatge" });
    expect(getGroupExpenseErrors(error)).toEqual({ fieldErrors: { [field]: "Missatge" } });
  });

  it("shows the not found alert for a group the user cannot see", () => {
    const error = new ConvexError({ code: "NOT_FOUND", message: "No s'ha trobat el grup." });
    expect(getGroupExpenseErrors(error)).toEqual({ fieldErrors: {}, alert: NOT_FOUND_ALERT });
  });

  it("shows a generic alert for anything else", () => {
    expect(getGroupExpenseErrors(new Error("network"))).toEqual({
      fieldErrors: {},
      alert: SAVE_ERROR_ALERT,
    });
  });
});

describe("memberLabel and paths", () => {
  it("marks the current user and names members without a name", () => {
    expect(memberLabel({ userId: ANA, name: "Ana" }, ANA)).toBe("Ana (tu)");
    expect(memberLabel({ userId: BERNAT, name: " " }, ANA)).toBe("Membre sense nom");
  });

  it("builds the group and new expense URLs", () => {
    expect(groupPath("g1")).toBe("/groups/g1");
    expect(newGroupExpensePath("g1")).toBe("/groups/g1/expenses/new");
  });
});
