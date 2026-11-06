import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import { ASSET_TYPES } from "../../../../convex/lib/assetTypes";
import { ASSET_TYPE_LABELS } from "../assetTypeLabels";
import {
  EMPTY_NET_WORTH_FIELDS,
  getNetWorthErrors,
  INVALID_AMOUNT_FORMAT_MESSAGE,
  INVALID_DUE_DATE_MESSAGE,
  LABEL_MESSAGES,
  MAX_LABEL_LENGTH,
  MISSING_ASSET_TYPE_MESSAGE,
  parseDueDateInput,
  parseNetWorthFields,
  REQUIRED_FIELD_MESSAGE,
  SAVE_ERROR_ALERT,
  ZERO_AMOUNT_MESSAGE,
  type NetWorthFields,
} from "./useNetWorthForm";

const VALID_ASSET: NetWorthFields = {
  kind: "asset",
  label: "  Compte d'estalvi  ",
  assetType: "bankAccount",
  amount: "3250,75",
  dueDate: "",
};

const VALID_DEBT: NetWorthFields = {
  kind: "debt",
  label: " Préstec del cotxe ",
  assetType: "",
  amount: "4500",
  dueDate: "2027-06-30",
};

describe("parseDueDateInput", () => {
  it("returns local midnight of the chosen day", () => {
    expect(parseDueDateInput("2027-06-30")).toBe(new Date(2027, 5, 30).getTime());
  });

  it("rejects days that do not exist and other formats", () => {
    expect(parseDueDateInput("2027-02-30")).toBeNull();
    expect(parseDueDateInput("30/06/2027")).toBeNull();
    expect(parseDueDateInput("")).toBeNull();
  });
});

describe("parseNetWorthFields · assets", () => {
  it("builds the createAsset arguments from valid fields", () => {
    expect(parseNetWorthFields(VALID_ASSET)).toEqual({
      request: {
        kind: "asset",
        args: { name: "Compte d'estalvi", type: "bankAccount", amountCents: 325075 },
      },
      errors: {},
    });
  });

  it("marks the empty fields of an asset, and ignores the due date", () => {
    expect(parseNetWorthFields(EMPTY_NET_WORTH_FIELDS)).toEqual({
      request: null,
      errors: {
        label: LABEL_MESSAGES.asset.empty,
        amount: REQUIRED_FIELD_MESSAGE,
        assetType: MISSING_ASSET_TYPE_MESSAGE,
      },
    });
  });

  it("rejects a name longer than the backend limit", () => {
    const label = "a".repeat(MAX_LABEL_LENGTH + 1);
    expect(parseNetWorthFields({ ...VALID_ASSET, label }).errors).toEqual({
      label: LABEL_MESSAGES.asset.tooLong,
    });
    expect(
      parseNetWorthFields({ ...VALID_ASSET, label: "a".repeat(MAX_LABEL_LENGTH) }).request,
    ).not.toBeNull();
  });
});

describe("parseNetWorthFields · debts", () => {
  it("builds the createDebt arguments from valid fields", () => {
    expect(parseNetWorthFields(VALID_DEBT)).toEqual({
      request: {
        kind: "debt",
        args: {
          concept: "Préstec del cotxe",
          amountCents: 450000,
          dueDate: new Date(2027, 5, 30).getTime(),
        },
      },
      errors: {},
    });
  });

  it("marks the empty fields of a debt, and ignores the asset type", () => {
    expect(parseNetWorthFields({ ...EMPTY_NET_WORTH_FIELDS, kind: "debt" })).toEqual({
      request: null,
      errors: {
        label: LABEL_MESSAGES.debt.empty,
        amount: REQUIRED_FIELD_MESSAGE,
        dueDate: REQUIRED_FIELD_MESSAGE,
      },
    });
  });

  it("rejects a due date that does not exist", () => {
    expect(parseNetWorthFields({ ...VALID_DEBT, dueDate: "2027-02-30" }).errors).toEqual({
      dueDate: INVALID_DUE_DATE_MESSAGE,
    });
  });
});

describe("parseNetWorthFields · amount", () => {
  it("rejects amounts that are not a positive number of euros", () => {
    for (const amount of ["abc", "-5", "12,345"]) {
      expect(parseNetWorthFields({ ...VALID_DEBT, amount }).errors).toEqual({
        amount: INVALID_AMOUNT_FORMAT_MESSAGE,
      });
    }
    expect(parseNetWorthFields({ ...VALID_DEBT, amount: "0" }).errors).toEqual({
      amount: ZERO_AMOUNT_MESSAGE,
    });
  });
});

describe("getNetWorthErrors", () => {
  it("shows backend validation errors under the matching field", () => {
    expect(
      getNetWorthErrors(
        new ConvexError({ code: "INVALID_CONCEPT", message: LABEL_MESSAGES.debt.tooLong }),
      ),
    ).toEqual({ fieldErrors: { label: LABEL_MESSAGES.debt.tooLong } });
    expect(
      getNetWorthErrors(new ConvexError({ code: "INVALID_AMOUNT", message: ZERO_AMOUNT_MESSAGE })),
    ).toEqual({ fieldErrors: { amount: ZERO_AMOUNT_MESSAGE } });
  });

  it("falls back to a general alert for any other failure", () => {
    expect(getNetWorthErrors(new Error("Server Error"))).toEqual({
      fieldErrors: {},
      alert: SAVE_ERROR_ALERT,
    });
  });
});

describe("ASSET_TYPE_LABELS", () => {
  it("has a Catalan label for every asset type the backend accepts", () => {
    for (const type of ASSET_TYPES) {
      expect(ASSET_TYPE_LABELS[type]).toEqual(expect.any(String));
    }
    expect(Object.keys(ASSET_TYPE_LABELS)).toHaveLength(ASSET_TYPES.length);
  });
});
