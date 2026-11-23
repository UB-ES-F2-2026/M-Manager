import { ConvexError } from "convex/values";
import { describe, expect, it, vi } from "vitest";
import type { Id } from "../../../../convex/_generated/dataModel";
import { TRANSFER_NOT_PENDING_MESSAGE } from "../../../../convex/groups";
import { attemptSettleDebt, SETTLE_DEBT_ERROR_MESSAGE } from "./useSettleDebt";

const transfer = {
  fromUserId: "user-anna" as Id<"users">,
  toUserId: "user-pau" as Id<"users">,
  amountCents: 2550,
  fromName: "Anna",
  toName: "Pau",
};

describe("attemptSettleDebt", () => {
  it("sends the transfer to settleDebt and returns null", async () => {
    const settleDebt = vi.fn().mockResolvedValue("settlement-1");

    await expect(attemptSettleDebt(settleDebt, "group-1", transfer)).resolves.toBeNull();
    expect(settleDebt).toHaveBeenCalledWith({
      groupId: "group-1",
      fromUserId: "user-anna",
      toUserId: "user-pau",
      amountCents: 2550,
    });
  });

  it("returns the backend message when the debt is no longer pending", async () => {
    const settleDebt = vi
      .fn()
      .mockRejectedValue(
        new ConvexError({ code: "TRANSFER_NOT_PENDING", message: TRANSFER_NOT_PENDING_MESSAGE }),
      );

    await expect(attemptSettleDebt(settleDebt, "group-1", transfer)).resolves.toBe(
      TRANSFER_NOT_PENDING_MESSAGE,
    );
  });

  it("returns the backend message when the group is not found", async () => {
    const settleDebt = vi
      .fn()
      .mockRejectedValue(new ConvexError({ code: "NOT_FOUND", message: "No s'ha trobat el grup." }));

    await expect(attemptSettleDebt(settleDebt, "group-1", transfer)).resolves.toBe(
      "No s'ha trobat el grup.",
    );
  });

  it("returns a generic message for other backend errors", async () => {
    const settleDebt = vi
      .fn()
      .mockRejectedValue(new ConvexError({ code: "INVALID_AMOUNT", message: "Import invàlid." }));

    await expect(attemptSettleDebt(settleDebt, "group-1", transfer)).resolves.toBe(
      SETTLE_DEBT_ERROR_MESSAGE,
    );
  });

  it("returns a generic message when the request fails", async () => {
    const settleDebt = vi.fn().mockRejectedValue(new Error("Network error"));

    await expect(attemptSettleDebt(settleDebt, "group-1", transfer)).resolves.toBe(
      SETTLE_DEBT_ERROR_MESSAGE,
    );
  });
});
