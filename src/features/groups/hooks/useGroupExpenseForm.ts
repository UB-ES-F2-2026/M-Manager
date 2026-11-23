import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import type { SplitMode } from "../../../../convex/lib/splitModes";
import { splitByAmounts, splitByPercentages } from "../../../../convex/lib/splitExpense";
import { assertValidAmountCents, assertValidConcept } from "../../../../convex/lib/validation";
import { parseMoney, toAmountInputValue } from "../../../lib/money";
import { groupPath } from "../groupExpensePaths";

export type FormAlertMessage = {
  title: string;
  description: string;
};

export const REQUIRED_FIELD_MESSAGE = "Aquest camp és obligatori";
export const INVALID_AMOUNT_FORMAT_MESSAGE = "Escriu un import vàlid, per exemple 12,50.";
export const INVALID_PERCENTAGE_FORMAT_MESSAGE = "Escriu un percentatge vàlid, per exemple 33,33.";
export const MISSING_PAYER_MESSAGE = "Tria qui ha pagat.";
/** Same text as the backend check in convex/groups.ts. */
export const NO_PARTICIPANTS_MESSAGE = "Cal almenys un participant.";

/** Shown when the group does not exist or the user is not a member. */
export const NOT_FOUND_ALERT: FormAlertMessage = {
  title: "No s'ha trobat el grup",
  description: "Potser no en formes part o l'enllaç no és correcte.",
};

/** Shown when the backend fails for a reason that is not tied to one field. */
export const SAVE_ERROR_ALERT: FormAlertMessage = {
  title: "No s'ha pogut desar la despesa",
  description: "Torna-ho a provar d'aquí a una estona.",
};

export type GroupMember = {
  userId: Id<"users">;
  name: string;
};

/** Raw form values, as the user types them. */
export type GroupExpenseFields = {
  concept: string;
  /** Total in euros as typed, e.g. "60,00". */
  amount: string;
  paidBy: Id<"users"> | "";
  /** Checked members, in the order of the member list. */
  participants: Id<"users">[];
  mode: SplitMode;
  /** «Imports»: euros typed for each participant, by userId. */
  amounts: Record<string, string>;
  /** «Percentatges»: percentage typed for each participant, by userId. */
  percentages: Record<string, string>;
};

export type GroupExpenseFieldErrors = {
  concept?: string;
  amount?: string;
  paidBy?: string;
  participants?: string;
  /** The shares as a whole, e.g. they do not add up to the total. */
  split?: string;
  /** One participant's share, by userId. */
  shares?: Record<string, string>;
};

/** Arguments of `api.groups.createExpense`, without the group id. */
export type GroupExpenseArgs = {
  concept: string;
  amountCents: number;
  paidBy: Id<"users">;
  split:
    | { mode: "equal"; participants: Id<"users">[] }
    | { mode: "amounts"; shares: { userId: Id<"users">; amountCents: number }[] }
    | { mode: "percentages"; shares: { userId: Id<"users">; percentage: number }[] };
};

export type GroupExpenseErrors = {
  fieldErrors: GroupExpenseFieldErrors;
  alert?: FormAlertMessage;
};

/**
 * Starting values (US4.2): the current user paid if they are a member, every
 * member takes part, and the expense is split equally.
 */
export function initialGroupExpenseFields(
  members: readonly GroupMember[],
  currentUserId: Id<"users"> | undefined,
): GroupExpenseFields {
  const isMember = members.some((member) => member.userId === currentUserId);
  return {
    concept: "",
    amount: "",
    paidBy: isMember && currentUserId ? currentUserId : "",
    participants: members.map((member) => member.userId),
    mode: "equal",
    amounts: {},
    percentages: {},
  };
}

/** Splits `total` units in `count` whole parts; the leftover units go to the first ones. */
function equalParts(total: number, count: number): number[] {
  const base = Math.floor(total / count);
  return Array.from({ length: count }, (_, index) => base + (index < total - base * count ? 1 : 0));
}

/** Hundredths of a percent as the field shows them: 3334 → "33,34", 5000 → "50". */
function formatPercentage(hundredths: number): string {
  const text = (hundredths / 100).toFixed(2).replace(/\.?0+$/, "");
  return text.replace(".", ",");
}

/**
 * Suggested shares when the user picks «Imports» or «Percentatges» or changes
 * who takes part: an equal split of the total (or of 100%) among the
 * participants, which the user can then change. Amounts stay empty while the
 * total is not a valid amount yet.
 */
export function suggestedShares(
  fields: Pick<GroupExpenseFields, "amount" | "participants">,
): Pick<GroupExpenseFields, "amounts" | "percentages"> {
  const count = fields.participants.length;
  if (count === 0) {
    return { amounts: {}, percentages: {} };
  }
  const totalCents = parseMoney(fields.amount);
  const centParts = totalCents && totalCents > 0 ? equalParts(totalCents, count) : null;
  const percentParts = equalParts(10_000, count);

  const amounts: Record<string, string> = {};
  const percentages: Record<string, string> = {};
  fields.participants.forEach((userId, index) => {
    amounts[userId] = centParts ? toAmountInputValue(centParts[index]) : "";
    percentages[userId] = formatPercentage(percentParts[index]);
  });
  return { amounts, percentages };
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

/** "33,33" or "33.33" → 33.33. Null when it is not a number with at most 2 decimals. */
export function parsePercentage(text: string): number | null {
  const normalized = text.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }
  return Number(normalized);
}

function parseTotal(amount: string): { amountCents: number | null; error?: string } {
  if (amount.trim() === "") {
    return { amountCents: null, error: REQUIRED_FIELD_MESSAGE };
  }
  const amountCents = parseMoney(amount);
  if (amountCents === null) {
    return { amountCents: null, error: INVALID_AMOUNT_FORMAT_MESSAGE };
  }
  const message = backendMessage(() => assertValidAmountCents(amountCents));
  return message ? { amountCents: null, error: message } : { amountCents };
}

/** «Imports» and «Percentatges»: each participant's value, or the errors found. */
function parseShares(
  fields: GroupExpenseFields,
  amountCents: number | null,
): { split: GroupExpenseArgs["split"] | null; shares?: Record<string, string>; splitError?: string } {
  const shareErrors: Record<string, string> = {};

  if (fields.mode === "amounts") {
    const shares = fields.participants.map((userId) => {
      const text = fields.amounts[userId] ?? "";
      const cents = text.trim() === "" ? null : parseMoney(text);
      if (text.trim() === "") {
        shareErrors[userId] = REQUIRED_FIELD_MESSAGE;
      } else if (cents === null) {
        shareErrors[userId] = INVALID_AMOUNT_FORMAT_MESSAGE;
      }
      return { userId, amountCents: cents ?? 0 };
    });
    if (Object.keys(shareErrors).length > 0) {
      return { split: null, shares: shareErrors };
    }
    if (amountCents === null) {
      return { split: null };
    }
    const message = backendMessage(() => splitByAmounts(amountCents, shares));
    return message ? { split: null, splitError: message } : { split: { mode: "amounts", shares } };
  }

  const shares = fields.participants.map((userId) => {
    const text = fields.percentages[userId] ?? "";
    const percentage = text.trim() === "" ? null : parsePercentage(text);
    if (text.trim() === "") {
      shareErrors[userId] = REQUIRED_FIELD_MESSAGE;
    } else if (percentage === null) {
      shareErrors[userId] = INVALID_PERCENTAGE_FORMAT_MESSAGE;
    }
    return { userId, percentage: percentage ?? 0 };
  });
  if (Object.keys(shareErrors).length > 0) {
    return { split: null, shares: shareErrors };
  }
  // The percentages do not depend on the total: any amount checks them.
  const message = backendMessage(() => splitByPercentages(amountCents ?? 100, shares));
  return message
    ? { split: null, splitError: message }
    : { split: { mode: "percentages", shares } };
}

/**
 * Checks every field with the same rules as the backend and builds the
 * `createExpense` arguments. `args` is null while there is any error, so
 * nothing is saved if the split is wrong (US4.2 AC2).
 */
export function parseGroupExpenseFields(fields: GroupExpenseFields): {
  args: GroupExpenseArgs | null;
  errors: GroupExpenseFieldErrors;
} {
  const errors: GroupExpenseFieldErrors = {};

  const conceptMessage = backendMessage(() => assertValidConcept(fields.concept));
  if (conceptMessage) {
    errors.concept = conceptMessage;
  }

  const { amountCents, error: amountError } = parseTotal(fields.amount);
  if (amountError) {
    errors.amount = amountError;
  }

  const paidBy = fields.paidBy === "" ? null : fields.paidBy;
  if (paidBy === null) {
    errors.paidBy = MISSING_PAYER_MESSAGE;
  }

  let split: GroupExpenseArgs["split"] | null = null;
  if (fields.participants.length === 0) {
    errors.participants = NO_PARTICIPANTS_MESSAGE;
  } else if (fields.mode === "equal") {
    split = { mode: "equal", participants: fields.participants };
  } else {
    const result = parseShares(fields, amountCents);
    split = result.split;
    if (result.shares) {
      errors.shares = result.shares;
    }
    if (result.splitError) {
      errors.split = result.splitError;
    }
  }

  if (Object.keys(errors).length > 0 || amountCents === null || paidBy === null || !split) {
    return { args: null, errors };
  }
  return {
    args: { concept: fields.concept.trim(), amountCents, paidBy, split },
    errors,
  };
}

const FIELD_BY_ERROR_CODE: Record<string, Exclude<keyof GroupExpenseFieldErrors, "shares">> = {
  INVALID_CONCEPT: "concept",
  INVALID_AMOUNT: "amount",
  INVALID_PAYER: "paidBy",
  INVALID_PARTICIPANTS: "participants",
  INVALID_SPLIT: "split",
};

/** Turns an error from `api.groups.createExpense` into messages for the form. */
export function getGroupExpenseErrors(error: unknown): GroupExpenseErrors {
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
 * Form state and submit logic of the new group expense screen (US4.2).
 * `members` come from `api.groups.get`, in the order the list shows them.
 */
export function useGroupExpenseForm(
  groupId: Id<"groups">,
  members: readonly GroupMember[],
  currentUserId: Id<"users"> | undefined,
) {
  const createExpense = useMutation(api.groups.createExpense);
  const navigate = useNavigate();
  const [fields, setFields] = useState<GroupExpenseFields>(() =>
    initialGroupExpenseFields(members, currentUserId),
  );
  const [errors, setErrors] = useState<GroupExpenseErrors>({ fieldErrors: {} });
  const [isSubmitting, setIsSubmitting] = useState(false);

  function clearErrors(...names: (keyof GroupExpenseFieldErrors)[]) {
    setErrors((current) => {
      const fieldErrors = { ...current.fieldErrors };
      for (const name of names) {
        delete fieldErrors[name];
      }
      return { ...current, fieldErrors };
    });
  }

  function setText(name: "concept" | "amount", value: string) {
    setFields((current) => ({ ...current, [name]: value }));
    clearErrors(name);
  }

  function setPaidBy(userId: Id<"users"> | "") {
    setFields((current) => ({ ...current, paidBy: userId }));
    clearErrors("paidBy");
  }

  /** Changing who takes part or how it is split recalculates the suggested shares. */
  function setMode(mode: SplitMode) {
    setFields((current) => ({ ...current, mode, ...suggestedShares(current) }));
    clearErrors("split", "shares");
  }

  function toggleParticipant(userId: Id<"users">) {
    setFields((current) => {
      const checked = new Set(current.participants);
      if (checked.has(userId)) {
        checked.delete(userId);
      } else {
        checked.add(userId);
      }
      // Keep the order of the member list.
      const participants = members
        .map((member) => member.userId)
        .filter((memberId) => checked.has(memberId));
      return { ...current, participants, ...suggestedShares({ ...current, participants }) };
    });
    clearErrors("participants", "split", "shares");
  }

  function setShare(userId: Id<"users">, value: string) {
    setFields((current) =>
      current.mode === "amounts"
        ? { ...current, amounts: { ...current.amounts, [userId]: value } }
        : { ...current, percentages: { ...current.percentages, [userId]: value } },
    );
    setErrors((current) => {
      const shares = { ...current.fieldErrors.shares };
      delete shares[userId];
      return { ...current, fieldErrors: { ...current.fieldErrors, shares, split: undefined } };
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const { args, errors: fieldErrors } = parseGroupExpenseFields(fields);
    setErrors({ fieldErrors });
    if (!args) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createExpense({ groupId, ...args });
      navigate(groupPath(groupId), { replace: true });
    } catch (error) {
      setErrors(getGroupExpenseErrors(error));
      setIsSubmitting(false);
    }
  }

  return {
    fields,
    errors,
    isSubmitting,
    setText,
    setPaidBy,
    setMode,
    toggleParticipant,
    setShare,
    handleSubmit,
  };
}
