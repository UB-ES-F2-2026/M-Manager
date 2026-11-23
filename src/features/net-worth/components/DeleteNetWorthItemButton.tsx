import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { useDeleteNetWorthItem, type NetWorthDeleteTarget } from "../hooks/useDeleteNetWorthItem";

const TEXTS = {
  asset: { button: "Eliminar actiu", question: "Vols eliminar aquest actiu?" },
  debt: { button: "Eliminar deute", question: "Vols eliminar aquest deute?" },
} as const;

type DeleteNetWorthItemButtonProps = {
  target: NetWorthDeleteTarget;
  onDeleted: () => void;
};

/** "Eliminar" button that asks for confirmation before deleting an asset or debt (US3.2 AC3). */
export default function DeleteNetWorthItemButton({
  target,
  onDeleted,
}: DeleteNetWorthItemButtonProps) {
  const { isConfirming, isDeleting, error, requestDelete, cancelDelete, confirmDelete } =
    useDeleteNetWorthItem(target, onDeleted);

  return (
    <>
      <button
        type="button"
        onClick={requestDelete}
        className="w-full rounded-lg border border-danger px-4 py-3 text-sm font-semibold text-danger"
      >
        {TEXTS[target.kind].button}
      </button>
      <ConfirmDialog
        open={isConfirming}
        title={TEXTS[target.kind].question}
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
