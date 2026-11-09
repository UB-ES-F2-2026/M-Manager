import type { Id } from "../../../../convex/_generated/dataModel";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { useDeleteTransaction } from "../hooks/useDeleteTransaction";

type DeleteTransactionButtonProps = {
  transactionId: Id<"transactions">;
  onDeleted: () => void;
};

/** "Eliminar" button that asks for confirmation before deleting (US2.2). */
export default function DeleteTransactionButton({
  transactionId,
  onDeleted,
}: DeleteTransactionButtonProps) {
  const { isConfirming, isDeleting, error, requestDelete, cancelDelete, confirmDelete } =
    useDeleteTransaction(transactionId, onDeleted);

  return (
    <>
      <button
        type="button"
        onClick={requestDelete}
        className="w-full rounded-lg border border-danger px-4 py-3 text-sm font-semibold text-danger"
      >
        Eliminar moviment
      </button>
      <ConfirmDialog
        open={isConfirming}
        title="Vols eliminar aquest moviment?"
        description="Aquesta acció no es pot desfer."
        confirmLabel={isDeleting ? "Eliminant…" : "Eliminar"}
        loading={isDeleting}
        error={error}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </>
  );
}
