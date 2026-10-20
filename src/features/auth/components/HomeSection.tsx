import type { ReactNode } from "react";

type HomeSectionProps = {
  title: string;
  /** Text of the "see all" link; disabled until its screen exists. */
  actionLabel: string;
  children: ReactNode;
};

/** Titled block of the main screen ("Els meus comptes", "Últims moviments"). */
export default function HomeSection({ title, actionLabel, children }: HomeSectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <button
          type="button"
          disabled
          title="Properament"
          className="text-sm font-medium text-primary disabled:cursor-not-allowed"
        >
          {actionLabel}
        </button>
      </div>
      {children}
    </section>
  );
}
