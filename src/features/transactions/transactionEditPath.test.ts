import { describe, expect, it } from "vitest";
import { transactionEditPath } from "./transactionEditPath";

describe("transactionEditPath", () => {
  it("points a transaction to its edit screen", () => {
    expect(transactionEditPath("k17abc")).toBe("/transactions/k17abc/edit");
  });

  it("gives each transaction its own screen", () => {
    expect(transactionEditPath("k17abc")).not.toBe(transactionEditPath("k57xyz"));
  });
});
