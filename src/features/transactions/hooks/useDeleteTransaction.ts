import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export const DELETE_ERROR_MESSAGE = "No s'ha pogut eliminar el moviment. Torna-ho a provar.";

type RemoveTransaction = (args: { transactionId: Id<"transactions"> }) => Promise<unknown>;

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

/** Deletes the transaction. Returns null on success or the message to show. */
export async function attemptDeleteTransaction(
  removeTransaction: RemoveTransaction,
  transactionId: Id<"transactions">,
): Promise<string | null> {
  try {
    await removeTransaction({ transactionId });
    return null;
  } catch (error) {
    if (isNotFoundError(error)) {
      return error.data.message;
    }
    return DELETE_ERROR_MESSAGE;
  }
}

/** Confirmation state and delete action for one transaction (US2.2). */
export function useDeleteTransaction(transactionId: Id<"transactions">, onDeleted: () => void) {
  const removeTransaction = useMutation(api.transactions.remove);
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
    const message = await attemptDeleteTransaction(removeTransaction, transactionId);
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
