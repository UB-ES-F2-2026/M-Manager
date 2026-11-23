import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export const DELETE_ERROR_MESSAGES = {
  asset: "No s'ha pogut eliminar l'actiu. Torna-ho a provar.",
  debt: "No s'ha pogut eliminar el deute. Torna-ho a provar.",
} as const;

/** The asset or debt to delete. */
export type NetWorthDeleteTarget =
  | { kind: "asset"; id: Id<"assets"> }
  | { kind: "debt"; id: Id<"debts"> };

export type NetWorthRemovers = {
  removeAsset: (args: { assetId: Id<"assets"> }) => Promise<unknown>;
  removeDebt: (args: { debtId: Id<"debts"> }) => Promise<unknown>;
};

function isNotFoundError(
  error: unknown,
): error is ConvexError<{ code: "NOT_FOUND"; message: string }> {
  return (
    error instanceof ConvexError &&
    typeof error.data === "object" &&
    error.data !== null &&
    error.data.code === "NOT_FOUND" &&
    typeof error.data.message === "string"
  );
}

/** Deletes the asset or debt. Returns null on success or the message to show. */
export async function attemptDeleteNetWorthItem(
  removers: NetWorthRemovers,
  target: NetWorthDeleteTarget,
): Promise<string | null> {
  try {
    if (target.kind === "asset") {
      await removers.removeAsset({ assetId: target.id });
    } else {
      await removers.removeDebt({ debtId: target.id });
    }
    return null;
  } catch (error) {
    if (isNotFoundError(error)) {
      return error.data.message;
    }
    return DELETE_ERROR_MESSAGES[target.kind];
  }
}

/** Confirmation state and delete action for one asset or debt (US3.2 AC3). */
export function useDeleteNetWorthItem(target: NetWorthDeleteTarget, onDeleted: () => void) {
  const removeAsset = useMutation(api.netWorth.removeAsset);
  const removeDebt = useMutation(api.netWorth.removeDebt);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function requestDelete() {
    setError(null);
    setIsConfirming(true);
  }

  function cancelDelete() {
    setIsConfirming(false);
  }

  async function confirmDelete() {
    setIsDeleting(true);
    setError(null);
    const message = await attemptDeleteNetWorthItem({ removeAsset, removeDebt }, target);
    setIsDeleting(false);
    if (message === null) {
      setIsConfirming(false);
      onDeleted();
      return;
    }
    setError(message);
  }

  return { isConfirming, isDeleting, error, requestDelete, cancelDelete, confirmDelete };
}
