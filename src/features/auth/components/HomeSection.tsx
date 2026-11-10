import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type HomeSectionProps = {
  title: string;
  /**
   * "See all" link of the section. Only pass it when its screen exists:
   * a control without functionality must not be shown.
   */
  action?: { label: string; to: string };
  children: ReactNode;
};

/** Titled block of the main screen ("Actius i deutes", "Últims moviments"). */
export default function HomeSection({ title, action, children }: HomeSectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {action && (
          <Link to={action.to} className="text-sm font-medium text-primary">
            {action.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
