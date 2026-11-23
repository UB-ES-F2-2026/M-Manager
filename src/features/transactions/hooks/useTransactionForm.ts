import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../../convex/_generated/api";
import type { Doc } from "../../../../convex/_generated/dataModel";
import {
  DAY_OF_MONTH_MESSAGE,
  type RecurrenceFrequency,
  type RecurrenceInput,
} from "../../../../convex/lib/recurrenceFrequencies";
import {
  TRANSACTION_CATEGORIES,
  type TransactionCategory,
} from "../../../../convex/lib/transactionCategories";
import { assertValidAmountCents } from "../../../../convex/lib/validation";
import { parseMoney } from "../../../lib/money";
import { defaultDayOfMonth, parseDayOfMonth } from "../recurrenceFields";

export type FormAlertMessage = {
  title: string;
  description: string;
};

export const REQUIRED_FIELD_MESSAGE = "Aquest camp és obligatori";
export const INVALID_AMOUNT_FORMAT_MESSAGE = "Escriu un import vàlid, per exemple 12,50.";
export const INVALID_DATE_MESSAGE = "La data no és vàlida.";
export const MISSING_CATEGORY_MESSAGE = "Tria una categoria.";

/** Shown when the backend fails for a reason that is not tied to one field. */
export const SAVE_ERROR_ALERT: FormAlertMessage = {
  title: "No s'ha pogut desar el moviment",
  description: "Torna-ho a provar d'aquí a una estona.",
};

/** Shown when the transaction being edited no longer exists. */
export const NOT_FOUND_ALERT: FormAlertMessage = {
  title: "No s'ha trobat aquest moviment",
  description: "Potser s'ha eliminat. Torna a la pantalla principal.",
};

export type TransactionType = "expense" | "income";

/** Raw form values, as the user types them. */
export type TransactionFields = {
  type: TransactionType;
  /** Euros as typed, e.g. "12,50". */
  amount: string;
  /** Day from the date input, "YYYY-MM-DD". */
  date: string;
  category: TransactionCategory | "";
  concept: string;
  /** "Moviment recurrent" switch (US2.5). When off, frequency and day are ignored. */
  isRecurring: boolean;
  frequency: RecurrenceFrequency;
  /** Payment day as typed, "1"–"28". */
  dayOfMonth: string;
};

type ValidatedField = Exclude<keyof TransactionFields, "type" | "isRecurring" | "frequency">;

export type TransactionFieldErrors = Partial<Record<ValidatedField, string>>;

/** Arguments of `api.transactions.create`. */
export type CreateTransactionArgs = {
  type: TransactionType;
  amountCents: number;
  date: number;
  category: TransactionCategory;
  concept: string;
};

export type TransactionErrors = {
  fieldErrors: TransactionFieldErrors;
  alert?: FormAlertMessage;
};

/** "YYYY-MM-DD" of a timestamp in the user's time zone, for `<input type="date">`. */
export function toDateInputValue(timestampMs: number): string {
  const date = new Date(timestampMs);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Turns the date input value into a timestamp in ms, or null if it is not a real day.
 * The time of day comes from `nowMs`, so movements of the same day keep the order
 * in which they were added.
 */
export function parseDateInput(value: string, nowMs: number): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }
  const [year, month, day] = match.slice(1).map(Number);
  const now = new Date(nowMs);
  const date = new Date(
    year,
    month - 1,
    day,
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
    now.getMilliseconds(),
  );
  // new Date() rolls 2026-02-30 over to March: reject days that do not exist.
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date.getTime();
}

/** Empty form: an expense dated today. */
export function emptyTransactionFields(nowMs: number): TransactionFields {
  return {
    type: "expense",
    amount: "",
    date: toDateInputValue(nowMs),
    category: "",
    concept: "",
    isRecurring: false,
    frequency: "monthly",
    dayOfMonth: "",
  };
}

/** Cents as the amount input expects them, e.g. 4290 → "42,90" (no thousands separator). */
export function toAmountInputValue(amountCents: number): string {
  return (amountCents / 100).toFixed(2).replace(".", ",");
}

/**
 * Form values of a stored transaction, to start the edit form filled in.
 * With its recurrence rule (`api.recurring.forTransaction`, US2.5) the switch
 * starts on and shows the saved frequency and day.
 */
export function transactionToFields(
  transaction: Doc<"transactions">,
  recurrence?: RecurrenceInput | null,
): TransactionFields {
  return {
    type: transaction.type,
    amount: toAmountInputValue(transaction.amountCents),
    date: toDateInputValue(transaction.date),
    category: transaction.category,
    concept: transaction.concept,
    isRecurring: Boolean(recurrence),
    frequency: recurrence?.frequency ?? "monthly",
    dayOfMonth: recurrence ? String(recurrence.dayOfMonth) : "",
  };
}

/**
 * New form values after the user changes one field. Turning the recurrence switch on
 * starts it as "Mensual" with the payment day of the "Data" field (capped at 28).
 */
export function applyFieldChange<K extends keyof TransactionFields>(
  fields: TransactionFields,
  name: K,
  value: TransactionFields[K],
): TransactionFields {
  const next = { ...fields, [name]: value };
  if (name === "isRecurring" && value === true && !fields.isRecurring) {
    next.frequency = "monthly";
    next.dayOfMonth = defaultDayOfMonth(fields.date);
  }
  return next;
}

function isTransactionCategory(value: string): value is TransactionCategory {
  return (TRANSACTION_CATEGORIES as readonly string[]).includes(value);
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

/** Message of a backend validator's ConvexError, or null when the value is valid. */
function backendMessage(check: () => void): string | null {
  try {
    check();
    return null;
  } catch (error) {
    if (error instanceof ConvexError && isCodedError(error.data)) {
      return error.data.message;
    }
    throw error;
  }
}

/**
 * Checks every field with the same rules as the backend and builds the
 * mutation arguments. `args` is null while there is any error.
 * Frequency and day are only checked when the recurrence switch is on; then
 * `recurrence` also carries the month of the date (needed for yearly rules).
 */
export function parseTransactionFields(
  fields: TransactionFields,
  nowMs: number,
): {
  args: CreateTransactionArgs | null;
  recurrence: RecurrenceInput | null;
  errors: TransactionFieldErrors;
} {
  const errors: TransactionFieldErrors = {};

  const amountCents = fields.amount.trim() === "" ? null : parseMoney(fields.amount);
  if (fields.amount.trim() === "") {
    errors.amount = REQUIRED_FIELD_MESSAGE;
  } else if (amountCents === null) {
    errors.amount = INVALID_AMOUNT_FORMAT_MESSAGE;
  } else {
    const message = backendMessage(() => assertValidAmountCents(amountCents));
    if (message) {
      errors.amount = message;
    }
  }

  const date = fields.date === "" ? null : parseDateInput(fields.date, nowMs);
  if (fields.date === "") {
    errors.date = REQUIRED_FIELD_MESSAGE;
  } else if (date === null) {
    errors.date = INVALID_DATE_MESSAGE;
  }

  const category = isTransactionCategory(fields.category) ? fields.category : null;
  if (category === null) {
    errors.category = MISSING_CATEGORY_MESSAGE;
  }

  const concept = fields.concept.trim();
  if (concept === "") {
    errors.concept = REQUIRED_FIELD_MESSAGE;
  }

  const dayOfMonth = fields.isRecurring ? parseDayOfMonth(fields.dayOfMonth) : null;
  if (fields.isRecurring && dayOfMonth === null) {
    errors.dayOfMonth = DAY_OF_MONTH_MESSAGE;
  }

  if (Object.keys(errors).length > 0 || amountCents === null || date === null || category === null) {
    return { args: null, recurrence: null, errors };
  }

  const recurrence =
    dayOfMonth === null
      ? null
      : { frequency: fields.frequency, dayOfMonth, monthOfYear: new Date(date).getMonth() + 1 };

  return {
    args: { type: fields.type, amountCents, date, category, concept },
    recurrence,
    errors,
  };
}

const FIELD_BY_ERROR_CODE: Record<string, ValidatedField> = {
  INVALID_AMOUNT: "amount",
  INVALID_DATE: "date",
  INVALID_CONCEPT: "concept",
  INVALID_DAY_OF_MONTH: "dayOfMonth",
};

/** Turns an error from `api.transactions.create` or `update` into messages for the form. */
export function getTransactionErrors(error: unknown): TransactionErrors {
  if (error instanceof ConvexError && isCodedError(error.data)) {
    if (error.data.code === "NOT_FOUND") {
      return { fieldErrors: {}, alert: NOT_FOUND_ALERT };
    }
    const field = FIELD_BY_ERROR_CODE[error.data.code];
    if (field) {
      return { fieldErrors: { [field]: error.data.message } };
    }
  }
  return { fieldErrors: {}, alert: SAVE_ERROR_ALERT };
}

/**
 * `recurrence` argument of `api.transactions.update` (US2.5): the rule when the
 * switch is on, null to remove a rule the transaction had, or undefined to leave
 * it as it is (a transaction that was not recurrent and still is not).
 */
export function recurrenceUpdateArg(
  recurrence: RecurrenceInput | null,
  wasRecurring: boolean,
): RecurrenceInput | null | undefined {
  if (recurrence) {
    return recurrence;
  }
  return wasRecurring ? null : undefined;
}

/**
 * Form state and submit logic for the new transaction screen (US2.1) and,
 * when `transaction` is given, for editing it (US2.2). `savedRecurrence` is the
 * transaction's saved rule, if any (US2.5).
 */
export function useTransactionForm(
  transaction?: Doc<"transactions">,
  savedRecurrence?: RecurrenceInput | null,
) {
  const createTransaction = useMutation(api.transactions.create);
  const updateTransaction = useMutation(api.transactions.update);
  const navigate = useNavigate();
  const [fields, setFields] = useState<TransactionFields>(() =>
    transaction
      ? transactionToFields(transaction, savedRecurrence)
      : emptyTransactionFields(Date.now()),
  );
  const [errors, setErrors] = useState<TransactionErrors>({ fieldErrors: {} });
  const [isSubmitting, setIsSubmitting] = useState(false);

  function setField<K extends keyof TransactionFields>(name: K, value: TransactionFields[K]) {
    setFields((current) => applyFieldChange(current, name, value));
    // Clear the field's error as soon as the user starts fixing it. The switch also
    // clears the day error, since the day is hidden and ignored while it is off.
    setErrors((current) => ({
      ...current,
      fieldErrors: {
        ...current.fieldErrors,
        [name]: undefined,
        ...(name === "isRecurring" ? { dayOfMonth: undefined } : {}),
      },
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // When editing, keep the original time of day so the order within the day does not change.
    const timeOfDayMs = transaction ? transaction.date : Date.now();
    const { args, recurrence, errors: fieldErrors } = parseTransactionFields(fields, timeOfDayMs);
    setErrors({ fieldErrors });
    if (!args) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (transaction) {
        const recurrenceArg = recurrenceUpdateArg(recurrence, Boolean(savedRecurrence));
        await updateTransaction({
          transactionId: transaction._id,
          ...args,
          ...(recurrenceArg === undefined ? {} : { recurrence: recurrenceArg }),
        });
      } else {
        await createTransaction(recurrence ? { ...args, recurrence } : args);
      }
      navigate("/", { replace: true });
    } catch (error) {
      setErrors(getTransactionErrors(error));
      setIsSubmitting(false);
    }
  }

  return { fields, errors, isSubmitting, setField, handleSubmit };
}
