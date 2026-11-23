import type { ComponentType } from "react";
import { CardIcon, HomeIcon, TransferIcon } from "../ui/icons";

export type NavItem = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  to: string;
};

/**
 * Tabs of the bottom bar. Only screens that already exist are listed:
 * a tab without functionality must not be shown.
 */
export const NAV_ITEMS: NavItem[] = [
  { label: "Inici", icon: HomeIcon, to: "/" },
  { label: "Grups", icon: CardIcon, to: "/groups" },
  { label: "Moviments", icon: TransferIcon, to: "/transactions" },
];

/**
 * Whether the tab only lights up on its exact path. Home must, or it would be
 * active everywhere; the rest stay active on their sub-screens (/groups/:id).
 */
export function isExactNavMatch(to: string): boolean {
  return to === "/";
}
