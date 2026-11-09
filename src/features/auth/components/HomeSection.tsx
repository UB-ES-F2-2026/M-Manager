import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type HomeSectionProps = {
  title: string;
  /** Text of the "see all" control. */
  actionLabel: string;
  /** When set, the action navigates here; otherwise it stays disabled. */
  actionTo?: string;
  children: ReactNode;
};

/** Titled block of the main screen ("Els meus comptes", "Últims moviments"). */
export default function HomeSection({
  title,
  actionLabel,
  actionTo,
  children,
}: HomeSectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {actionTo ? (
          <Link to={actionTo} className="text-sm font-medium text-primary">
            {actionLabel}
          </Link>
        ) : (
          <button
            type="button"
            disabled
            title="Properament"
            className="text-sm font-medium text-primary disabled:cursor-not-allowed"
          >
            {actionLabel}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}
