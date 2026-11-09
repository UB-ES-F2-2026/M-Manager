import { ConvexError } from "convex/values";
import { describe, expect, it, vi } from "vitest";
import type { Id } from "../../../../convex/_generated/dataModel";
import { attemptDeleteTransaction, DELETE_ERROR_MESSAGE } from "./useDeleteTransaction";

const transactionId = "transaction-1" as Id<"transactions">;

describe("attemptDeleteTransaction", () => {
  it("deletes the transaction and returns null", async () => {
    const removeTransaction = vi.fn().mockResolvedValue(null);

    await expect(attemptDeleteTransaction(removeTransaction, transactionId)).resolves.toBeNull();
    expect(removeTransaction).toHaveBeenCalledWith({ transactionId });
  });

  it("returns the backend message when the transaction is not found", async () => {
    const removeTransaction = vi.fn().mockRejectedValue(
      new ConvexError({ code: "NOT_FOUND", message: "No s'ha trobat aquest moviment." }),
    );

    await expect(attemptDeleteTransaction(removeTransaction, transactionId)).resolves.toBe(
      "No s'ha trobat aquest moviment.",
    );
  });

  it("returns a generic message for other backend errors", async () => {
    const removeTransaction = vi.fn().mockRejectedValue(
      new ConvexError({ code: "UNAUTHENTICATED", message: "Has d'iniciar sessió." }),
    );

    await expect(attemptDeleteTransaction(removeTransaction, transactionId)).resolves.toBe(
      DELETE_ERROR_MESSAGE,
    );
  });

  it("returns a generic message when the request fails", async () => {
    const removeTransaction = vi.fn().mockRejectedValue(new Error("Network error"));

    await expect(attemptDeleteTransaction(removeTransaction, transactionId)).resolves.toBe(
      DELETE_ERROR_MESSAGE,
    );
  });
});
