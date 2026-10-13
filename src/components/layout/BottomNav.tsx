import type { ComponentType } from "react";
import { NavLink } from "react-router-dom";
import {
  HomeIcon,
  PieChartIcon,
  TransferIcon,
  UserIcon,
  UsersIcon,
} from "../ui/icons";

type NavItem = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  /** Items without a route are shown disabled until their story is built. */
  to?: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Inici", icon: HomeIcon, to: "/" },
  { label: "Moviments", icon: TransferIcon },
  { label: "Pressupostos", icon: PieChartIcon },
  { label: "Grups", icon: UsersIcon },
  { label: "Perfil", icon: UserIcon },
];

const ITEM_CLASSES = "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs";

export function BottomNav() {
  return (
    <nav
      aria-label="Navegació principal"
      className="fixed inset-x-0 bottom-0 border-t border-line bg-white"
    >
      <ul className="mx-auto flex max-w-md px-2">
        {NAV_ITEMS.map(({ label, icon: ItemIcon, to }) => (
          <li key={label} className="flex flex-1">
            {to ? (
              <NavLink
                to={to}
                end
                className={({ isActive }) =>
                  `${ITEM_CLASSES} ${isActive ? "text-brand" : "text-muted hover:text-ink"}`
                }
              >
                <ItemIcon className="size-6" />
                {label}
              </NavLink>
            ) : (
              <span
                aria-disabled="true"
                title="Properament"
                className={`${ITEM_CLASSES} cursor-not-allowed text-subtle`}
              >
                <ItemIcon className="size-6" />
                {label}
              </span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
