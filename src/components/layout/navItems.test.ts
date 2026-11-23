import { describe, expect, it } from "vitest";
import { isExactNavMatch, NAV_ITEMS } from "./navItems";

describe("NAV_ITEMS", () => {
  it("only shows the tabs that have a screen, Grups between Inici and Moviments", () => {
    expect(NAV_ITEMS.map((item) => item.label)).toEqual(["Inici", "Grups", "Moviments"]);
  });

  it("does not show the old Comptes tab nor the unimplemented Perfil tab", () => {
    const labels = NAV_ITEMS.map((item) => item.label);
    expect(labels).not.toContain("Comptes");
    expect(labels).not.toContain("Perfil");
  });

  it("links every tab to an app route", () => {
    expect(NAV_ITEMS.map((item) => item.to)).toEqual(["/", "/groups", "/transactions"]);
  });
});

describe("isExactNavMatch", () => {
  it("only matches Inici exactly, so it is not active on every screen", () => {
    expect(isExactNavMatch("/")).toBe(true);
  });

  it("keeps Grups active on the group sub-screens", () => {
    expect(isExactNavMatch("/groups")).toBe(false);
  });
});
