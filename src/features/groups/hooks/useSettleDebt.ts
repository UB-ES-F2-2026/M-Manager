import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export const SETTLE_DEBT_ERROR_MESSAGE = "No s'ha pogut saldar el deute. Torna-ho a provar.";

/** Backend errors whose message is already meant for the user. */
const USER_FACING_CODES = ["NOT_FOUND", "TRANSFER_NOT_PENDING"];

/** One of the «Per saldar» transfers returned by `groups.getBalances`. */
export type SettleTransfer = {
  fromUserId: Id<"users">;
  toUserId: Id<"users">;
  amountCents: number;
  fromName: string;
  toName: string;
};

export type SettleDebtMutation = (args: {
  groupId: string;
  fromUserId: Id<"users">;
  toUserId: Id<"users">;
  amountCents: number;
}) => Promise<unknown>;

function isUserFacingError(
  error: unknown,
): error is ConvexError<{ code: string; message: string }> {
  return (
    error instanceof ConvexError &&
    typeof error.data === "object" &&
    error.data !== null &&
    USER_FACING_CODES.includes(error.data.code) &&
    typeof error.data.message === "string"
  );
}

/** Records the payment. Returns null on success or the message to show. */
export async function attemptSettleDebt(
  settleDebt: SettleDebtMutation,
  groupId: string,
  transfer: SettleTransfer,
): Promise<string | null> {
  try {
    await settleDebt({
      groupId,
      fromUserId: transfer.fromUserId,
      toUserId: transfer.toUserId,
      amountCents: transfer.amountCents,
    });
    return null;
  } catch (error) {
    if (isUserFacingError(error)) {
      return error.data.message;
    }
    return SETTLE_DEBT_ERROR_MESSAGE;
  }
}

/** Confirmation state and «Saldar deute» action of the «Per saldar» list (US4.3). */
export function useSettleDebt(groupId: string) {
  const settleDebt = useMutation(api.groups.settleDebt);
  const [selected, setSelected] = useState<SettleTransfer | null>(null);
  const [isSettling, setIsSettling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function requestSettle(transfer: SettleTransfer) {
    setError(null);
    setSelected(transfer);
  }

  function cancelSettle() {
    setSelected(null);
  }

  async function confirmSettle() {
    if (selected === null) {
      return;
    }
    setIsSettling(true);
    setError(null);
    const message = await attemptSettleDebt(settleDebt, groupId, selected);
    setIsSettling(false);
    if (message === null) {
      setSelected(null);
      return;
    }
    setError(message);
  }

  return { selected, isSettling, error, requestSettle, cancelSettle, confirmSettle };
}
