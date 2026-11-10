import type { ComponentType } from "react";
import { HomeIcon, TransferIcon } from "../ui/icons";

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
  { label: "Moviments", icon: TransferIcon, to: "/transactions" },
];
