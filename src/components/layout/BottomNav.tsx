import type { ComponentType } from "react";
import { NavLink } from "react-router-dom";
import { CardIcon, HomeIcon, TransferIcon, UserIcon } from "../ui/icons";

type NavItem = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  /** Items without a route are shown disabled until their screen exists. */
  to?: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Inici", icon: HomeIcon, to: "/" },
  { label: "Comptes", icon: CardIcon },
  { label: "Moviments", icon: TransferIcon },
  { label: "Perfil", icon: UserIcon },
];

const ITEM_CLASSES = "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs";

/** Bottom tab bar of the app screens. */
export default function BottomNav() {
  return (
    <nav
      aria-label="Navegació principal"
      className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white"
    >
      <ul className="mx-auto flex max-w-md">
        {NAV_ITEMS.map(({ label, icon: ItemIcon, to }) => (
          <li key={label} className="flex flex-1">
            {to ? (
              <NavLink
                to={to}
                end
                className={({ isActive }) =>
                  `${ITEM_CLASSES} ${isActive ? "text-primary" : "text-slate-500"}`
                }
              >
                <ItemIcon />
                {label}
              </NavLink>
            ) : (
              <span
                aria-disabled="true"
                title="Properament"
                className={`${ITEM_CLASSES} cursor-not-allowed text-slate-400`}
              >
                <ItemIcon />
                {label}
              </span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
