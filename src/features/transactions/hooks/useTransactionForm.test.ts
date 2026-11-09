import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { TRANSACTION_CATEGORIES } from "../../../../convex/lib/transactionCategories";
import { CATEGORY_LABELS } from "../categoryLabels";
import {
  emptyTransactionFields,
  getTransactionErrors,
  INVALID_AMOUNT_FORMAT_MESSAGE,
  INVALID_DATE_MESSAGE,
  MISSING_CATEGORY_MESSAGE,
  NOT_FOUND_ALERT,
  parseDateInput,
  parseTransactionFields,
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
        { type: "expense", amount: " ", date: "", category: "", concept: "   " },
        NOW,
      ),
    ).toEqual({
      args: null,
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
