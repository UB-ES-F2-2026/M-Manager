import { groupInviteLink } from "../groupInviteLink";
import { useCopyFeedback } from "../hooks/useCopyFeedback";

type GroupInviteCardProps = {
  code: string;
};

const SECONDARY_BUTTON_CLASSES =
  "flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-50";

/** «Convidar» block of the group detail: the invite code and the copy buttons (US4.1 AC2). */
export default function GroupInviteCard({ code }: GroupInviteCardProps) {
  const { result, visible, copy } = useCopyFeedback();

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-slate-900">Convidar</h2>
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs text-slate-500">Codi del grup</p>
          <p className="text-2xl font-bold tracking-widest text-slate-900">{code}</p>
        </div>
        <div className="flex gap-3">
          <button type="button" className={SECONDARY_BUTTON_CLASSES} onClick={() => copy(code)}>
            Copiar codi
          </button>
          <button
            type="button"
            className={SECONDARY_BUTTON_CLASSES}
            onClick={() => copy(groupInviteLink(window.location.origin, code))}
          >
            Copiar enllaç
          </button>
        </div>
        <p
          role="status"
          className={`text-sm transition-opacity duration-200 ease-out ${
            visible ? "opacity-100" : "opacity-0"
          } ${result === "failed" ? "text-danger" : "text-success"}`}
        >
          {result === "failed" ? "No s'ha pogut copiar." : "Copiat!"}
        </p>
      </div>
    </section>
  );
}
