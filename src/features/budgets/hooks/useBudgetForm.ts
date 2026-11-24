import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import {
  BUDGET_CATEGORIES,
  type BudgetCategory,
} from "../../../../convex/lib/budgetCategories";
import { assertValidAmountCents } from "../../../../convex/lib/validation";
import { parseMoney, toAmountInputValue } from "../../../lib/money";
import { getMonthBounds } from "../../transactions/monthBounds";

export type FormAlertMessage = {
  title: string;
  description: string;
};

export const REQUIRED_FIELD_MESSAGE = "Aquest camp és obligatori";
export const INVALID_AMOUNT_FORMAT_MESSAGE = "Escriu un import vàlid, per exemple 12,50.";
export const MISSING_CATEGORY_MESSAGE = "Tria una categoria.";
/** Same text as BUDGET_EXISTS_MESSAGE in convex/budgets.ts. */
export const CATEGORY_TAKEN_MESSAGE = "Ja tens un pressupost per a aquesta categoria.";

/** Shown when the backend fails for a reason that is not tied to one field. */
export const SAVE_ERROR_ALERT: FormAlertMessage = {
  title: "No s'ha pogut desar el pressupost",
  description: "Torna-ho a provar d'aquí a una estona.",
};

/** Shown when saving an edit fails because the budget no longer exists. */
export const NOT_FOUND_ALERT: FormAlertMessage = {
  title: "No s'ha trobat aquest pressupost",
  description: "Potser s'ha eliminat. Torna a la llista de pressupostos.",
};

/** Raw form values, as the user types them. */
export type BudgetFields = {
  category: BudgetCategory | "";
  /** Monthly limit in euros as typed, e.g. "300,00". */
  amount: string;
};

export type BudgetFieldErrors = Partial<Record<keyof BudgetFields, string>>;

/** Arguments of `api.budgets.create` (and of `update`, plus the id). */
export type BudgetArgs = {
  category: BudgetCategory;
  amountCents: number;
};

export type BudgetErrors = {
  fieldErrors: BudgetFieldErrors;
  alert?: FormAlertMessage;
};

export const EMPTY_BUDGET_FIELDS: BudgetFields = { category: "", amount: "" };

/** Form values of a stored budget, to start the edit form filled in. */
export function budgetToFields(budget: Doc<"budgets">): BudgetFields {
  return { category: budget.category, amount: toAmountInputValue(budget.amountCents) };
}

/**
 * Categories that already have a budget, so the new form cannot pick them
 * again (US3.1: one budget per category). `exceptBudgetId` leaves out the
 * budget being edited.
 */
export function takenCategories(
  budgets: readonly Doc<"budgets">[],
  exceptBudgetId?: Id<"budgets">,
): BudgetCategory[] {
  return budgets
    .filter((budget) => budget._id !== exceptBudgetId)
    .map((budget) => budget.category);
}

function isBudgetCategory(value: string): value is BudgetCategory {
  return (BUDGET_CATEGORIES as readonly string[]).includes(value);
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
 * Checks the fields with the same rules as the backend and builds the
 * mutation arguments. `args` is null while there is any error.
 */
export function parseBudgetFields(
  fields: BudgetFields,
  taken: readonly BudgetCategory[] = [],
): { args: BudgetArgs | null; errors: BudgetFieldErrors } {
  const errors: BudgetFieldErrors = {};

  const category = isBudgetCategory(fields.category) ? fields.category : null;
  if (category === null) {
    errors.category = MISSING_CATEGORY_MESSAGE;
  } else if (taken.includes(category)) {
    errors.category = CATEGORY_TAKEN_MESSAGE;
  }

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

  if (Object.keys(errors).length > 0 || category === null || amountCents === null) {
    return { args: null, errors };
  }
  return { args: { category, amountCents }, errors };
}

const FIELD_BY_ERROR_CODE: Record<string, keyof BudgetFields> = {
  BUDGET_EXISTS: "category",
  INVALID_AMOUNT: "amount",
};

/** Turns an error from `api.budgets.create` or `update` into messages for the form. */
export function getBudgetErrors(error: unknown): BudgetErrors {
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
 * Form state and submit logic for the new budget screen and, when `budget`
 * is given, for editing it (US3.1 AC1). When editing only the limit changes:
 * the category stays the stored one.
 */
export function useBudgetForm(budget?: Doc<"budgets">) {
  const createBudget = useMutation(api.budgets.create);
  const updateBudget = useMutation(api.budgets.update);
  const navigate = useNavigate();
  const [now] = useState(() => Date.now());
  // Only the new form needs the user's budgets, to hide the taken categories.
  const budgets = useQuery(api.budgets.list, budget ? "skip" : getMonthBounds(now));
  const taken = budgets ? takenCategories(budgets) : [];

  const [fields, setFields] = useState<BudgetFields>(() =>
    budget ? budgetToFields(budget) : EMPTY_BUDGET_FIELDS,
  );
  const [errors, setErrors] = useState<BudgetErrors>({ fieldErrors: {} });
  const [isSubmitting, setIsSubmitting] = useState(false);

  function setField<K extends keyof BudgetFields>(name: K, value: BudgetFields[K]) {
    setFields((current) => ({ ...current, [name]: value }));
    // Clear the field's error as soon as the user starts fixing it.
    setErrors((current) => ({
      ...current,
      fieldErrors: { ...current.fieldErrors, [name]: undefined },
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const { args, errors: fieldErrors } = parseBudgetFields(fields, taken);
    setErrors({ fieldErrors });
    if (!args) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (budget) {
        await updateBudget({ budgetId: budget._id, ...args, category: budget.category });
      } else {
        await createBudget(args);
      }
      navigate("/budgets", { replace: true });
    } catch (error) {
      setErrors(getBudgetErrors(error));
      setIsSubmitting(false);
    }
  }

  return { fields, errors, isSubmitting, takenCategories: taken, setField, handleSubmit };
}
