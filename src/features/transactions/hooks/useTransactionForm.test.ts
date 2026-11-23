import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { TRANSACTION_CATEGORIES } from "../../../../convex/lib/transactionCategories";
import { CATEGORY_LABELS } from "../categoryLabels";
import { DAY_OF_MONTH_MESSAGE } from "../../../../convex/lib/recurrenceFrequencies";
import {
  applyFieldChange,
  emptyTransactionFields,
  getTransactionErrors,
  INVALID_AMOUNT_FORMAT_MESSAGE,
  INVALID_DATE_MESSAGE,
  MISSING_CATEGORY_MESSAGE,
  NOT_FOUND_ALERT,
  parseDateInput,
  parseTransactionFields,
  recurrenceUpdateArg,
  REQUIRED_FIELD_MESSAGE,
  SAVE_ERROR_ALERT,
  toAmountInputValue,
  toDateInputValue,
  transactionToFields,
  type TransactionFields,
} from "./useTransactionForm";

// Local time, so the tests do not depend on the machine's time zone.
const NOW = new Date(2026, 10, 1, 18, 30, 15, 250).getTime();

const VALID_FIELDS: TransactionFields = {
  type: "expense",
  amount: "12,50",
  date: "2026-10-28",
  category: "groceries",
  concept: "  Compra setmanal  ",
  isRecurring: false,
  frequency: "monthly",
  dayOfMonth: "",
};

describe("toDateInputValue", () => {
  it("formats a timestamp as YYYY-MM-DD in local time", () => {
    expect(toDateInputValue(NOW)).toBe("2026-11-01");
    expect(toDateInputValue(new Date(2026, 0, 5).getTime())).toBe("2026-01-05");
  });
});

describe("parseDateInput", () => {
  it("returns the chosen day with the current time of day", () => {
    expect(parseDateInput("2026-10-28", NOW)).toBe(
      new Date(2026, 9, 28, 18, 30, 15, 250).getTime(),
    );
  });

  it("round-trips with toDateInputValue", () => {
    const timestamp = parseDateInput("2026-03-31", NOW);
    expect(timestamp).not.toBeNull();
    expect(toDateInputValue(timestamp as number)).toBe("2026-03-31");
  });

  it("rejects days that do not exist and other formats", () => {
    expect(parseDateInput("2026-02-30", NOW)).toBeNull();
    expect(parseDateInput("2026-13-01", NOW)).toBeNull();
    expect(parseDateInput("28/10/2026", NOW)).toBeNull();
    expect(parseDateInput("", NOW)).toBeNull();
  });
});

describe("emptyTransactionFields", () => {
  it("starts as an expense dated today", () => {
    expect(emptyTransactionFields(NOW)).toEqual({
      type: "expense",
      amount: "",
      date: "2026-11-01",
      category: "",
      concept: "",
      isRecurring: false,
      frequency: "monthly",
      dayOfMonth: "",
    });
  });
});

describe("parseTransactionFields", () => {
  it("builds the mutation arguments from valid fields", () => {
    expect(parseTransactionFields(VALID_FIELDS, NOW)).toEqual({
      args: {
        type: "expense",
        amountCents: 1250,
        date: new Date(2026, 9, 28, 18, 30, 15, 250).getTime(),
        category: "groceries",
        concept: "Compra setmanal",
      },
      recurrence: null,
      errors: {},
    });
  });

  it("keeps the type chosen by the user", () => {
    const { args } = parseTransactionFields(
      { ...VALID_FIELDS, type: "income", amount: "1850", category: "salary" },
      NOW,
    );
    expect(args).toMatchObject({ type: "income", amountCents: 185000, category: "salary" });
  });

  it("marks every empty field", () => {
    expect(
      parseTransactionFields(
        { ...VALID_FIELDS, amount: " ", date: "", category: "", concept: "   " },
        NOW,
      ),
    ).toEqual({
      args: null,
      recurrence: null,
      errors: {
        amount: REQUIRED_FIELD_MESSAGE,
        date: REQUIRED_FIELD_MESSAGE,
        category: MISSING_CATEGORY_MESSAGE,
        concept: REQUIRED_FIELD_MESSAGE,
      },
    });
  });

  it("rejects amounts that are not a positive number of euros", () => {
    for (const amount of ["abc", "-5", "12,345", "1.000,50"]) {
      expect(parseTransactionFields({ ...VALID_FIELDS, amount }, NOW).errors).toEqual({
        amount: INVALID_AMOUNT_FORMAT_MESSAGE,
      });
    }
  });

  it("uses the backend message for a zero amount", () => {
    expect(parseTransactionFields({ ...VALID_FIELDS, amount: "0,00" }, NOW).errors).toEqual({
      amount: "L'import ha de ser més gran que zero.",
    });
  });

  it("rejects a date that does not exist", () => {
    expect(parseTransactionFields({ ...VALID_FIELDS, date: "2026-02-30" }, NOW).errors).toEqual({
      date: INVALID_DATE_MESSAGE,
    });
  });
});

describe("getTransactionErrors", () => {
  it("shows backend validation errors under the matching field", () => {
    const error = new ConvexError({
      code: "INVALID_AMOUNT",
      message: "L'import ha de ser més gran que zero.",
    });
    expect(getTransactionErrors(error)).toEqual({
      fieldErrors: { amount: "L'import ha de ser més gran que zero." },
    });
  });

  it("shows the not found alert when the edited transaction no longer exists", () => {
    const error = new ConvexError({ code: "NOT_FOUND", message: "No s'ha trobat aquest moviment." });
    expect(getTransactionErrors(error)).toEqual({ fieldErrors: {}, alert: NOT_FOUND_ALERT });
  });

  it("shows the backend day error under the payment day field", () => {
    const error = new ConvexError({ code: "INVALID_DAY_OF_MONTH", message: DAY_OF_MONTH_MESSAGE });
    expect(getTransactionErrors(error)).toEqual({
      fieldErrors: { dayOfMonth: DAY_OF_MONTH_MESSAGE },
    });
  });

  it("falls back to a general alert for any other failure", () => {
    expect(getTransactionErrors(new Error("Server Error"))).toEqual({
      fieldErrors: {},
      alert: SAVE_ERROR_ALERT,
    });
    expect(
      getTransactionErrors(new ConvexError({ code: "UNAUTHENTICATED", message: "Has d'iniciar sessió." })),
    ).toEqual({ fieldErrors: {}, alert: SAVE_ERROR_ALERT });
  });
});

describe("toAmountInputValue", () => {
  it("writes cents as euros with a decimal comma and no thousands separator", () => {
    expect(toAmountInputValue(4290)).toBe("42,90");
    expect(toAmountInputValue(500)).toBe("5,00");
    expect(toAmountInputValue(185000)).toBe("1850,00");
  });
});

describe("transactionToFields", () => {
  const STORED: Doc<"transactions"> = {
    _id: "transaction-1" as Id<"transactions">,
    _creationTime: 0,
    userId: "user-1" as Id<"users">,
    type: "expense",
    amountCents: 4290,
    date: new Date(2026, 9, 28, 10, 15).getTime(),
    category: "groceries",
    concept: "Supermercat",
  };

  it("fills the form with the stored transaction", () => {
    expect(transactionToFields(STORED)).toEqual({
      type: "expense",
      amount: "42,90",
      date: "2026-10-28",
      category: "groceries",
      concept: "Supermercat",
      isRecurring: false,
      frequency: "monthly",
      dayOfMonth: "",
    });
  });

  it("starts with the switch on and the saved values of a recurrent transaction", () => {
    expect(
      transactionToFields(STORED, { frequency: "yearly", dayOfMonth: 15, monthOfYear: 10 }),
    ).toMatchObject({ isRecurring: true, frequency: "yearly", dayOfMonth: "15" });
    expect(transactionToFields(STORED, null)).toMatchObject({
      isRecurring: false,
      frequency: "monthly",
      dayOfMonth: "",
    });
  });

  it("saves the same values back, keeping the original time of day", () => {
    const { args } = parseTransactionFields(transactionToFields(STORED), STORED.date);
    expect(args).toEqual({
      type: "expense",
      amountCents: 4290,
      date: STORED.date,
      category: "groceries",
      concept: "Supermercat",
    });
  });

  it("keeps the original time of day when only the day changes", () => {
    const fields = { ...transactionToFields(STORED), date: "2026-10-30" };
    const { args } = parseTransactionFields(fields, STORED.date);
    expect(args?.date).toBe(new Date(2026, 9, 30, 10, 15).getTime());
  });
});

describe("CATEGORY_LABELS", () => {
  it("has a Catalan label for every category the backend accepts", () => {
    for (const category of TRANSACTION_CATEGORIES) {
      expect(CATEGORY_LABELS[category]).toEqual(expect.any(String));
    }
    expect(Object.keys(CATEGORY_LABELS)).toHaveLength(TRANSACTION_CATEGORIES.length);
  });
});

describe("parseTransactionFields · recurrence (US2.5)", () => {
  const RECURRENT: TransactionFields = {
    ...VALID_FIELDS,
    isRecurring: true,
    frequency: "yearly",
    dayOfMonth: "5",
  };

  it("returns the frequency, the day and the month of the date when the switch is on", () => {
    const { args, recurrence, errors } = parseTransactionFields(RECURRENT, NOW);
    expect(errors).toEqual({});
    expect(args).not.toBeNull();
    // VALID_FIELDS.date is 2026-10-28 → October.
    expect(recurrence).toEqual({ frequency: "yearly", dayOfMonth: 5, monthOfYear: 10 });
  });

  it("ignores frequency and day while the switch is off", () => {
    const { args, recurrence, errors } = parseTransactionFields(
      { ...RECURRENT, isRecurring: false, dayOfMonth: "99" },
      NOW,
    );
    expect(errors).toEqual({});
    expect(args).not.toBeNull();
    expect(recurrence).toBeNull();
  });

  it("rejects an empty, out of range or non-integer day", () => {
    for (const dayOfMonth of ["", "0", "29", "2,5", "abc"]) {
      expect(parseTransactionFields({ ...RECURRENT, dayOfMonth }, NOW)).toEqual({
        args: null,
        recurrence: null,
        errors: { dayOfMonth: DAY_OF_MONTH_MESSAGE },
      });
    }
  });
});

describe("applyFieldChange", () => {
  it("starts as Mensual with the day of the date when the switch is turned on", () => {
    const fields = { ...VALID_FIELDS, date: "2026-11-05", frequency: "yearly" as const };
    expect(applyFieldChange(fields, "isRecurring", true)).toMatchObject({
      isRecurring: true,
      frequency: "monthly",
      dayOfMonth: "5",
    });
  });

  it("caps the starting day at 28", () => {
    const fields = { ...VALID_FIELDS, date: "2026-10-31" };
    expect(applyFieldChange(fields, "isRecurring", true).dayOfMonth).toBe("28");
  });

  it("keeps the values typed by the user while the switch stays on", () => {
    const fields = applyFieldChange({ ...VALID_FIELDS, date: "2026-11-05" }, "isRecurring", true);
    const edited = applyFieldChange(fields, "dayOfMonth", "20");
    expect(applyFieldChange(edited, "date", "2026-11-09").dayOfMonth).toBe("20");
    expect(applyFieldChange(edited, "isRecurring", true).dayOfMonth).toBe("20");
  });

  it("turns the switch off without losing the other fields", () => {
    const on = applyFieldChange(VALID_FIELDS, "isRecurring", true);
    expect(applyFieldChange(on, "isRecurring", false)).toEqual({ ...on, isRecurring: false });
  });
});

describe("recurrenceUpdateArg", () => {
  const RULE = { frequency: "monthly" as const, dayOfMonth: 5, monthOfYear: 11 };

  it("sends the rule while the switch is on", () => {
    expect(recurrenceUpdateArg(RULE, false)).toEqual(RULE);
    expect(recurrenceUpdateArg(RULE, true)).toEqual(RULE);
  });

  it("sends null to remove the rule when a recurrent transaction is switched off", () => {
    expect(recurrenceUpdateArg(null, true)).toBeNull();
  });

  it("leaves the recurrence untouched when the transaction was never recurrent", () => {
    expect(recurrenceUpdateArg(null, false)).toBeUndefined();
  });
});
