import type { ReactNode } from "react";
import { Link } from "react-router-dom";

/**
 * "See all" control of a section: a link when its screen exists, or a
 * disabled control with the «Properament» tooltip when the product asks to
 * show it before the screen exists (e.g. «Pròxims pagaments», US2.5).
 */
export type HomeSectionAction = { label: string; to: string } | { label: string; disabled: true };

type HomeSectionProps = {
  title: string;
  /** Leave it out when the section has no "see all" control at all. */
  action?: HomeSectionAction;
  children: ReactNode;
};

/** Titled block of the main screen ("Actius i deutes", "Últims moviments"). */
export default function HomeSection({ title, action, children }: HomeSectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {action &&
          ("to" in action ? (
            <Link to={action.to} className="text-sm font-medium text-primary">
              {action.label}
            </Link>
          ) : (
            <button
              type="button"
              disabled
              title="Properament"
              className="text-sm font-medium text-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {action.label}
            </button>
          ))}
      </div>
      {children}
    </section>
  );
}
