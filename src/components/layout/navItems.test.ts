import { describe, expect, it } from "vitest";
import { NAV_ITEMS } from "./navItems";

describe("NAV_ITEMS", () => {
  it("only shows the tabs that have a screen", () => {
    expect(NAV_ITEMS.map((item) => item.label)).toEqual(["Inici", "Moviments"]);
  });

  it("does not show the unimplemented Comptes and Perfil tabs", () => {
    const labels = NAV_ITEMS.map((item) => item.label);
    expect(labels).not.toContain("Comptes");
    expect(labels).not.toContain("Perfil");
  });

  it("links every tab to an app route", () => {
    expect(NAV_ITEMS.map((item) => item.to)).toEqual(["/", "/transactions"]);
  });
});
