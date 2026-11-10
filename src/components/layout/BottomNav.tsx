import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "./navItems";

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
            <NavLink
              to={to}
              end
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-1 py-2.5 text-xs ${
                  isActive ? "text-primary" : "text-slate-500"
                }`
              }
            >
              <ItemIcon />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
