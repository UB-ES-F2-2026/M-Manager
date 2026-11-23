// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConvexError } from "convex/values";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Id } from "../../../../convex/_generated/dataModel";
import { GROUP_NOT_FOUND_MESSAGE, TRANSFER_NOT_PENDING_MESSAGE } from "../../../../convex/groups";
import { SETTLE_DEBT_ERROR_MESSAGE } from "../hooks/useSettleDebt";
import GroupSettleUp from "./GroupSettleUp";

// US4.3 · AC3: the «Per saldar» list and the «Saldar deute» dialog, clicked like a user.
// Only the Convex mutation is replaced; the hook, the dialog and the texts are the real ones.

const settleDebt = vi.fn();
vi.mock("convex/react", () => ({ useMutation: () => settleDebt }));

const ANNA = "user-anna" as Id<"users">;
const PAU = "user-pau" as Id<"users">;
const MARC = "user-marc" as Id<"users">;

const SUMMARY = {
  balances: [],
  transfers: [
    { fromUserId: ANNA, toUserId: PAU, amountCents: 2550, fromName: "Anna", toName: "Pau" },
    { fromUserId: MARC, toUserId: PAU, amountCents: 1000, fromName: "Marc", toName: "Pau" },
  ],
};

/** Normalises the non-breaking spaces that `Intl` puts in currency amounts. */
function text(element: HTMLElement): string {
  return (element.textContent ?? "").replace(/\s/g, " ");
}

/** A promise the test resolves or rejects by hand, to see the «loading» state. */
function deferred() {
  let resolve!: (value: unknown) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function openDialogFor(user: ReturnType<typeof userEvent.setup>, cardIndex: number) {
  const card = screen.getAllByRole("listitem")[cardIndex];
  await user.click(within(card).getByRole("button", { name: "Saldar deute" }));
  return screen.getByRole("alertdialog", { name: "Saldar deute" });
}

beforeEach(() => {
  settleDebt.mockReset();
});

afterEach(cleanup);

describe("GroupSettleUp · list", () => {
  it("shows «Carregant…» while the balances load", () => {
    render(<GroupSettleUp groupId="group-1" summary={undefined} />);

    expect(screen.getByText("Carregant…")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Saldar deute" })).toBeNull();
  });

  it("says there is nothing to settle when every member is even", () => {
    render(<GroupSettleUp groupId="group-1" summary={{ balances: [], transfers: [] }} />);

    expect(screen.getByText("No hi ha deutes pendents.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Saldar deute" })).toBeNull();
  });

  it("shows one card per suggested payment with «X paga a Y», the amount and a button", () => {
    render(<GroupSettleUp groupId="group-1" summary={SUMMARY} />);

    const cards = screen.getAllByRole("listitem");
    expect(cards.map(text)).toEqual([
      "Anna paga a Pau25,50 €Saldar deute",
      "Marc paga a Pau10,00 €Saldar deute",
    ]);
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });
});

describe("GroupSettleUp · «Saldar deute» dialog", () => {
  it("asks for confirmation before recording anything", async () => {
    const user = userEvent.setup();
    render(<GroupSettleUp groupId="group-1" summary={SUMMARY} />);

    const dialog = await openDialogFor(user, 0);

    expect(text(dialog)).toContain(
      "Es registrarà que Anna ha pagat 25,50 € a Pau. Aquesta acció no es pot desfer.",
    );
    expect(within(dialog).getByRole("button", { name: "Cancel·lar" })).toBeTruthy();
    expect(within(dialog).getByRole("button", { name: "Confirmar pagament" })).toBeTruthy();
    expect(settleDebt).not.toHaveBeenCalled();
  });

  it("closes without recording when the user cancels", async () => {
    const user = userEvent.setup();
    render(<GroupSettleUp groupId="group-1" summary={SUMMARY} />);

    const dialog = await openDialogFor(user, 0);
    await user.click(within(dialog).getByRole("button", { name: "Cancel·lar" }));

    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(settleDebt).not.toHaveBeenCalled();
  });

  it("records the payment of the chosen card and closes the dialog", async () => {
    const user = userEvent.setup();
    settleDebt.mockResolvedValue("settlement-1");
    render(<GroupSettleUp groupId="group-1" summary={SUMMARY} />);

    const dialog = await openDialogFor(user, 1);
    await user.click(within(dialog).getByRole("button", { name: "Confirmar pagament" }));

    expect(settleDebt).toHaveBeenCalledTimes(1);
    expect(settleDebt).toHaveBeenCalledWith({
      groupId: "group-1",
      fromUserId: MARC,
      toUserId: PAU,
      amountCents: 1000,
    });
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("disables both buttons while recording, so the payment cannot be sent twice", async () => {
    const user = userEvent.setup();
    const pending = deferred();
    settleDebt.mockReturnValue(pending.promise);
    render(<GroupSettleUp groupId="group-1" summary={SUMMARY} />);

    const dialog = await openDialogFor(user, 0);
    const confirm = within(dialog).getByRole("button", { name: "Confirmar pagament" });
    await user.click(confirm);

    expect((confirm as HTMLButtonElement).disabled).toBe(true);
    expect(confirm.getAttribute("aria-busy")).toBe("true");
    expect((within(dialog).getByRole("button", { name: "Cancel·lar" }) as HTMLButtonElement).disabled).toBe(true);
    await user.click(confirm);
    expect(settleDebt).toHaveBeenCalledTimes(1);

    pending.resolve("settlement-1");
    await vi.waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
  });

  it.each([
    ["the debt was already settled by someone else", "TRANSFER_NOT_PENDING", TRANSFER_NOT_PENDING_MESSAGE],
    ["the user left the group", "NOT_FOUND", GROUP_NOT_FOUND_MESSAGE],
  ])("keeps the dialog open with the backend message when %s", async (_case, code, message) => {
    const user = userEvent.setup();
    settleDebt.mockRejectedValue(new ConvexError({ code, message }));
    render(<GroupSettleUp groupId="group-1" summary={SUMMARY} />);

    const dialog = await openDialogFor(user, 0);
    await user.click(within(dialog).getByRole("button", { name: "Confirmar pagament" }));

    expect(within(dialog).getByRole("alert").textContent).toBe(message);
    expect(
      (within(dialog).getByRole("button", { name: "Confirmar pagament" }) as HTMLButtonElement).disabled,
    ).toBe(false);
  });

  it("shows a generic message when the request fails for another reason", async () => {
    const user = userEvent.setup();
    settleDebt.mockRejectedValue(new Error("Network error"));
    render(<GroupSettleUp groupId="group-1" summary={SUMMARY} />);

    const dialog = await openDialogFor(user, 0);
    await user.click(within(dialog).getByRole("button", { name: "Confirmar pagament" }));

    expect(within(dialog).getByRole("alert").textContent).toBe(SETTLE_DEBT_ERROR_MESSAGE);
  });

  it("forgets the previous error when another card is opened", async () => {
    const user = userEvent.setup();
    settleDebt.mockRejectedValueOnce(new Error("Network error"));
    render(<GroupSettleUp groupId="group-1" summary={SUMMARY} />);

    let dialog = await openDialogFor(user, 0);
    await user.click(within(dialog).getByRole("button", { name: "Confirmar pagament" }));
    await user.click(within(dialog).getByRole("button", { name: "Cancel·lar" }));
    dialog = await openDialogFor(user, 1);

    expect(within(dialog).queryByRole("alert")).toBeNull();
    expect(text(dialog)).toContain("Es registrarà que Marc ha pagat 10,00 € a Pau.");
  });

  it("links the dialog title and description for screen readers", async () => {
    const user = userEvent.setup();
    render(<GroupSettleUp groupId="group-1" summary={SUMMARY} />);

    const dialog = await openDialogFor(user, 0);

    expect(dialog.getAttribute("aria-modal")).toBe("true");
    const description = document.getElementById(dialog.getAttribute("aria-describedby") ?? "");
    expect(description?.textContent).toContain("Aquesta acció no es pot desfer.");
  });
});
