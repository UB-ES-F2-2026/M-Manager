import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../../convex/_generated/api";
import { ASSET_TYPES, type AssetType } from "../../../../convex/lib/assetTypes";
import { parseMoney } from "../../../lib/money";

/** Same limit as MAX_LABEL_LENGTH in convex/netWorth.ts. */
export const MAX_LABEL_LENGTH = 80;

export const REQUIRED_FIELD_MESSAGE = "Aquest camp és obligatori";
export const INVALID_AMOUNT_FORMAT_MESSAGE = "Escriu un import vàlid, per exemple 12,50.";
export const ZERO_AMOUNT_MESSAGE = "L'import ha de ser més gran que zero.";
export const MISSING_ASSET_TYPE_MESSAGE = "Tria un tipus d'actiu.";
export const INVALID_DUE_DATE_MESSAGE = "La data de venciment no és vàlida.";

/** Same texts as the backend validators in convex/netWorth.ts. */
export const LABEL_MESSAGES = {
  asset: {
    empty: "El nom de l'actiu és obligatori.",
    tooLong: "El nom de l'actiu és massa llarg.",
  },
  debt: {
    empty: "El concepte del deute és obligatori.",
    tooLong: "El concepte del deute és massa llarg.",
  },
} as const;

export type FormAlertMessage = {
  title: string;
  description: string;
};

/** Shown when the backend fails for a reason that is not tied to one field. */
export const SAVE_ERROR_ALERT: FormAlertMessage = {
  title: "No s'ha pogut desar",
  description: "Torna-ho a provar d'aquí a una estona.",
};

export type NetWorthKind = "asset" | "debt";

/** Raw form values, as the user types them. */
export type NetWorthFields = {
  kind: NetWorthKind;
  /** Asset name or debt concept. */
  label: string;
  /** Only used for assets. */
  assetType: AssetType | "";
  /** Euros as typed, e.g. "12,50". */
  amount: string;
  /** Only used for debts: day from the date input, "YYYY-MM-DD". */
  dueDate: string;
};

type ValidatedField = Exclude<keyof NetWorthFields, "kind">;

export type NetWorthFieldErrors = Partial<Record<ValidatedField, string>>;

/** What to send to the backend: the mutation to call and its arguments. */
export type NetWorthRequest =
  | { kind: "asset"; args: { name: string; type: AssetType; amountCents: number } }
  | { kind: "debt"; args: { concept: string; amountCents: number; dueDate: number } };

export type NetWorthErrors = {
  fieldErrors: NetWorthFieldErrors;
  alert?: FormAlertMessage;
};

export const EMPTY_NET_WORTH_FIELDS: NetWorthFields = {
  kind: "asset",
  label: "",
  assetType: "",
  amount: "",
  dueDate: "",
};

/** Local midnight of a "YYYY-MM-DD" date input value, or null if it is not a real day. */
export function parseDueDateInput(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(year, month - 1, day);
  // new Date() rolls 2026-02-30 over to March: reject days that do not exist.
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date.getTime();
}

function isAssetType(value: string): value is AssetType {
  return (ASSET_TYPES as readonly string[]).includes(value);
}

function parseAmount(amount: string): { amountCents: number | null; error?: string } {
  if (amount.trim() === "") {
    return { amountCents: null, error: REQUIRED_FIELD_MESSAGE };
  }
  const amountCents = parseMoney(amount);
  if (amountCents === null) {
    return { amountCents: null, error: INVALID_AMOUNT_FORMAT_MESSAGE };
  }
  if (amountCents <= 0) {
    return { amountCents: null, error: ZERO_AMOUNT_MESSAGE };
  }
  return { amountCents };
}

/**
 * Checks the fields of the chosen kind with the same rules as the backend and
 * builds the request. `request` is null while there is any error.
 */
export function parseNetWorthFields(fields: NetWorthFields): {
  request: NetWorthRequest | null;
  errors: NetWorthFieldErrors;
} {
  const errors: NetWorthFieldErrors = {};

  const label = fields.label.trim();
  if (label === "") {
    errors.label = LABEL_MESSAGES[fields.kind].empty;
  } else if (label.length > MAX_LABEL_LENGTH) {
    errors.label = LABEL_MESSAGES[fields.kind].tooLong;
  }

  const { amountCents, error: amountError } = parseAmount(fields.amount);
  if (amountError) {
    errors.amount = amountError;
  }

  if (fields.kind === "asset") {
    const type = isAssetType(fields.assetType) ? fields.assetType : null;
    if (type === null) {
      errors.assetType = MISSING_ASSET_TYPE_MESSAGE;
    }
    if (Object.keys(errors).length > 0 || amountCents === null || type === null) {
      return { request: null, errors };
    }
    return { request: { kind: "asset", args: { name: label, type, amountCents } }, errors };
  }

  const dueDate = fields.dueDate === "" ? null : parseDueDateInput(fields.dueDate);
  if (fields.dueDate === "") {
    errors.dueDate = REQUIRED_FIELD_MESSAGE;
  } else if (dueDate === null) {
    errors.dueDate = INVALID_DUE_DATE_MESSAGE;
  }
  if (Object.keys(errors).length > 0 || amountCents === null || dueDate === null) {
    return { request: null, errors };
  }
  return { request: { kind: "debt", args: { concept: label, amountCents, dueDate } }, errors };
}

function isCodedError(data: unknown): data is { code: string; message: string } {
  return (
    typeof data === "object" &&
    data !== null &&
    "code" in data &&
    typeof data.code === "string" &&
    "message" in data &&
    typeof data.message === "string"
  );
}

const FIELD_BY_ERROR_CODE: Record<string, ValidatedField> = {
  INVALID_NAME: "label",
  INVALID_CONCEPT: "label",
  INVALID_AMOUNT: "amount",
  INVALID_DUE_DATE: "dueDate",
};

/** Turns an error from createAsset or createDebt into messages for the form. */
export function getNetWorthErrors(error: unknown): NetWorthErrors {
  if (error instanceof ConvexError && isCodedError(error.data)) {
    const field = FIELD_BY_ERROR_CODE[error.data.code];
    if (field) {
      return { fieldErrors: { [field]: error.data.message } };
    }
  }
  return { fieldErrors: {}, alert: SAVE_ERROR_ALERT };
}

/** Form state and submit logic for the new asset or debt screen (US3.2). */
export function useNetWorthForm() {
  const createAsset = useMutation(api.netWorth.createAsset);
  const createDebt = useMutation(api.netWorth.createDebt);
  const navigate = useNavigate();
  const [fields, setFields] = useState<NetWorthFields>(EMPTY_NET_WORTH_FIELDS);
  const [errors, setErrors] = useState<NetWorthErrors>({ fieldErrors: {} });
  const [isSubmitting, setIsSubmitting] = useState(false);

  function setField<K extends keyof NetWorthFields>(name: K, value: NetWorthFields[K]) {
    setFields((current) => ({ ...current, [name]: value }));
    // Switching between asset and debt changes which fields count, so start clean.
    setErrors((current) =>
      name === "kind"
        ? { fieldErrors: {} }
        : { ...current, fieldErrors: { ...current.fieldErrors, [name]: undefined } },
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const { request, errors: fieldErrors } = parseNetWorthFields(fields);
    setErrors({ fieldErrors });
    if (!request) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (request.kind === "asset") {
        await createAsset(request.args);
      } else {
        await createDebt(request.args);
      }
      navigate("/", { replace: true });
    } catch (error) {
      setErrors(getNetWorthErrors(error));
      setIsSubmitting(false);
    }
  }

  return { fields, errors, isSubmitting, setField, handleSubmit };
}
