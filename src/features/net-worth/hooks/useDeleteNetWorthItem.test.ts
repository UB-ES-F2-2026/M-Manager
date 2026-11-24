import { ConvexError } from "convex/values";
import { describe, expect, it, vi } from "vitest";
import type { Id } from "../../../../convex/_generated/dataModel";
import { attemptDeleteNetWorthItem, DELETE_ERROR_MESSAGES } from "./useDeleteNetWorthItem";

const assetId = "asset-1" as Id<"assets">;
const debtId = "debt-1" as Id<"debts">;

function makeRemovers() {
  return {
    removeAsset: vi.fn().mockResolvedValue(null),
    removeDebt: vi.fn().mockResolvedValue(null),
  };
}

describe("attemptDeleteNetWorthItem", () => {
  it("deletes an asset with removeAsset and returns null", async () => {
    const removers = makeRemovers();

    await expect(
      attemptDeleteNetWorthItem(removers, { kind: "asset", id: assetId }),
    ).resolves.toBeNull();
    expect(removers.removeAsset).toHaveBeenCalledWith({ assetId });
    expect(removers.removeDebt).not.toHaveBeenCalled();
  });

  it("deletes a debt with removeDebt and returns null", async () => {
    const removers = makeRemovers();

    await expect(
      attemptDeleteNetWorthItem(removers, { kind: "debt", id: debtId }),
    ).resolves.toBeNull();
    expect(removers.removeDebt).toHaveBeenCalledWith({ debtId });
    expect(removers.removeAsset).not.toHaveBeenCalled();
  });

  it("returns the backend message when the item is not found", async () => {
    const removers = makeRemovers();
    removers.removeDebt.mockRejectedValue(
      new ConvexError({ code: "NOT_FOUND", message: "No s'ha trobat aquest deute." }),
    );

    await expect(
      attemptDeleteNetWorthItem(removers, { kind: "debt", id: debtId }),
    ).resolves.toBe("No s'ha trobat aquest deute.");
  });

  it("returns a generic message for other backend errors", async () => {
    const removers = makeRemovers();
    removers.removeAsset.mockRejectedValue(
      new ConvexError({ code: "UNAUTHENTICATED", message: "Has d'iniciar sessió." }),
    );

    await expect(
      attemptDeleteNetWorthItem(removers, { kind: "asset", id: assetId }),
    ).resolves.toBe(DELETE_ERROR_MESSAGES.asset);
  });

  it("returns a generic message when the request fails", async () => {
    const removers = makeRemovers();
    removers.removeDebt.mockRejectedValue(new Error("Network error"));

    await expect(
      attemptDeleteNetWorthItem(removers, { kind: "debt", id: debtId }),
    ).resolves.toBe(DELETE_ERROR_MESSAGES.debt);
  });
});
