import { describe, expect, it } from "vitest";
import { getGreeting } from "./greeting";

describe("getGreeting", () => {
  it("greets by first name", () => {
    expect(getGreeting("Ana")).toBe("Hola, Ana");
    expect(getGreeting("  Martí Barco Puig ")).toBe("Hola, Martí");
  });

  it("falls back when there is no name", () => {
    expect(getGreeting("")).toBe("Hola!");
    expect(getGreeting("   ")).toBe("Hola!");
  });
});
