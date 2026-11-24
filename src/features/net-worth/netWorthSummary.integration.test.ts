/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { ConvexError, type Value } from "convex/values";
import { describe, expect, it } from "vitest";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { ASSET_TYPES, LIQUID_ASSET_TYPES, type AssetType } from "../../../convex/lib/assetTypes";
import schema from "../../../convex/schema";
import {
  EMPTY_NET_WORTH_FIELDS,
  getNetWorthErrors,
  itemToFields,
  parseNetWorthFields,
  ZERO_AMOUNT_MESSAGE,
  type NetWorthFields,
} from "./hooks/useNetWorthForm";
import { netWorthSummaryText } from "./netWorthSummaryText";

// US3.3 · Patrimoni net i liquiditat — integration / acceptance tests.
//
// The unit tests check each piece alone: the backend query
// (convex/netWorth.summary.test.ts), the card text (netWorthSummaryText.test.ts)
// and the form (useNetWorthForm.test.ts). These tests follow the user instead:
// they add, edit and delete assets and debts with the real form helpers of
// US3.2 and read the home card as it is shown, with `netWorth.summary`
// turned into text by `netWorthSummaryText`.

const modules = import.meta.glob("../../../convex/**/!(*.*.*)*.*s");

function setup() {
  return convexTest(schema, modules);
}

type TestConvex = ReturnType<typeof setup>;
type Client = Awaited<ReturnType<typeof signedInAs>>["client"];

async function signedInAs(t: TestConvex, name: string) {
  const userId = await t.run((ctx) => ctx.db.insert("users", { name }));
  return { userId, client: t.withIdentity({ subject: `${userId}|session` }) };
}

/** Intl puts a non-breaking space before «€»; compare with a plain space. */
function plainSpaces(text: string): string {
  return text.replace(/\s/g, " ");
}

/** The home card «Patrimoni net» + «Liquiditat», as the user reads it. */
async function homeCard(client: Client) {
  const text = netWorthSummaryText(await client.query(api.netWorth.summary, {}));
  return { netWorth: plainSpaces(text.netWorth), liquidity: plainSpaces(text.liquidity) };
}

function parsedOrThrow(fields: NetWorthFields) {
  const { request, errors } = parseNetWorthFields(fields);
  if (request === null) {
    throw new Error(`The form should accept these fields: ${JSON.stringify(errors)}`);
  }
  return request;
}

/** Does what /net-worth/new does on submit with «Actiu» selected. */
async function addAsset(client: Client, name: string, assetType: AssetType, amount: string) {
  const request = parsedOrThrow({ ...EMPTY_NET_WORTH_FIELDS, kind: "asset", label: name, assetType, amount });
  if (request.kind !== "asset") {
    throw new Error("Expected an asset");
  }
  return client.mutation(api.netWorth.createAsset, request.args);
}

/** Does what /net-worth/new does on submit with «Deute» selected. */
async function addDebt(client: Client, concept: string, amount: string, dueDate = "2027-06-30") {
  const request = parsedOrThrow({ ...EMPTY_NET_WORTH_FIELDS, kind: "debt", label: concept, amount, dueDate });
  if (request.kind !== "debt") {
    throw new Error("Expected a debt");
  }
  return client.mutation(api.netWorth.createDebt, request.args);
}

/** Does what the edit screen of an asset does: start from the stored values and change some. */
async function editAsset(client: Client, assetId: Id<"assets">, changes: Partial<NetWorthFields>) {
  const asset = await client.query(api.netWorth.getAsset, { assetId });
  if (asset === null) {
    throw new Error("The edit screen should find the asset");
  }
  const request = parsedOrThrow({ ...itemToFields({ kind: "asset", asset }), ...changes });
  if (request.kind !== "asset") {
    throw new Error("Expected an asset");
  }
  return client.mutation(api.netWorth.updateAsset, { assetId, ...request.args });
}

/** Does what the edit screen of a debt does. */
async function editDebt(client: Client, debtId: Id<"debts">, changes: Partial<NetWorthFields>) {
  const debt = await client.query(api.netWorth.getDebt, { debtId });
  if (debt === null) {
    throw new Error("The edit screen should find the debt");
  }
  const request = parsedOrThrow({ ...itemToFields({ kind: "debt", debt }), ...changes });
  if (request.kind !== "debt") {
    throw new Error("Expected a debt");
  }
  return client.mutation(api.netWorth.updateDebt, { debtId, ...request.args });
}

/**
 * The error a failing call gives the form. convex-test hands ConvexError data
 * back as a JSON string, while the browser client (convex/react) parses it, so
 * this parses it too.
 */
async function rejectionOf(promise: Promise<unknown>): Promise<unknown> {
  const error: unknown = await promise.then(
    () => expect.fail("Expected the call to fail"),
    (rejection: unknown) => rejection,
  );
  if (error instanceof ConvexError && typeof error.data === "string") {
    return new ConvexError(JSON.parse(error.data) as Value);
  }
  return error;
}

describe("US3.3 · patrimoni net = actius − deutes", () => {
  it("a new user sees the card with 0,00 € in both amounts, not an empty card", async () => {
    const t = setup();
    const ana = await signedInAs(t, "Ana");

    expect(await homeCard(ana.client)).toEqual({ netWorth: "0,00 €", liquidity: "0,00 €" });
  });

  it("adds every asset and subtracts every debt the user saved with the form", async () => {
    const t = setup();
    const ana = await signedInAs(t, "Ana");
    await addAsset(ana.client, "Compte nòmina", "bankAccount", "2500,00");
    await addAsset(ana.client, "Cartera", "cash", "120,50");
    await addAsset(ana.client, "Fons indexat", "investment", "8000,00");
    await addAsset(ana.client, "Pis", "realEstate", "150000,00");
    await addAsset(ana.client, "Cotxe", "vehicle", "9000,00");
    await addAsset(ana.client, "Rellotge", "other", "350,00");
    await addDebt(ana.client, "Hipoteca", "120000,00");
    await addDebt(ana.client, "Préstec del cotxe", "4500,25");

    // 169.970,50 € of assets − 124.500,25 € of debts.
    expect(await homeCard(ana.client)).toEqual({
      netWorth: "45.470,25 €",
      liquidity: "2.620,50 €",
    });
    expect(await ana.client.query(api.netWorth.summary, {})).toEqual({
      netWorthCents: 4_547_025,
      liquidityCents: 262_050,
    });
  });

  it("shows the minus sign when the debts are bigger than the assets", async () => {
    const t = setup();
    const ana = await signedInAs(t, "Ana");
    await addAsset(ana.client, "Compte", "bankAccount", "1000,00");
    await addDebt(ana.client, "Préstec d'estudis", "6000,00");

    expect(await homeCard(ana.client)).toEqual({ netWorth: "-5.000,00 €", liquidity: "1.000,00 €" });
  });

  it("keeps every cent: ten assets of 0,10 € are exactly 1,00 €", async () => {
    const t = setup();
    const ana = await signedInAs(t, "Ana");
    for (let index = 1; index <= 10; index += 1) {
      await addAsset(ana.client, `Guardiola ${index}`, "cash", "0,10");
    }

    expect(await ana.client.query(api.netWorth.summary, {})).toEqual({
      netWorthCents: 100,
      liquidityCents: 100,
    });
    expect(await homeCard(ana.client)).toEqual({ netWorth: "1,00 €", liquidity: "1,00 €" });
  });

  it("returns whole cents even with amounts that are not exact in binary (0,03 € − 0,01 €)", async () => {
    const t = setup();
    const ana = await signedInAs(t, "Ana");
    await addAsset(ana.client, "Monedes", "cash", "0,03");
    await addDebt(ana.client, "Xiclet", "0,01");

    // With euros as decimals, (0.03 − 0.01) × 100 would be 1.9999999999999998.
    const summary = await ana.client.query(api.netWorth.summary, {});
    expect(summary).toEqual({ netWorthCents: 2, liquidityCents: 3 });
    expect(Number.isInteger(summary.netWorthCents)).toBe(true);
    expect(await homeCard(ana.client)).toEqual({ netWorth: "0,02 €", liquidity: "0,03 €" });
  });

  it("only counts the signed-in user's assets and debts", async () => {
    const t = setup();
    const ana = await signedInAs(t, "Ana");
    const bert = await signedInAs(t, "Bert");
    await addAsset(ana.client, "Compte", "bankAccount", "300,00");
    await addAsset(bert.client, "Compte", "bankAccount", "9999,00");
    await addDebt(bert.client, "Préstec", "50,00");

    expect(await homeCard(ana.client)).toEqual({ netWorth: "300,00 €", liquidity: "300,00 €" });
    expect(await homeCard(bert.client)).toEqual({ netWorth: "9.949,00 €", liquidity: "9.999,00 €" });
  });
});

describe("US3.3 · liquiditat = només comptes i efectiu", () => {
  it("the liquid types of the story are bankAccount and cash", () => {
    expect([...LIQUID_ASSET_TYPES].sort()).toEqual(["bankAccount", "cash"]);
  });

  it.each(ASSET_TYPES.map((type) => ({ type, liquid: LIQUID_ASSET_TYPES.includes(type) })))(
    "an asset of type $type counts in the net worth and, if liquid ($liquid), in the liquidity",
    async ({ type, liquid }) => {
      const t = setup();
      const ana = await signedInAs(t, "Ana");

      await addAsset(ana.client, "Actiu", type, "100,00");

      expect(await homeCard(ana.client)).toEqual({
        netWorth: "100,00 €",
        liquidity: liquid ? "100,00 €" : "0,00 €",
      });
    },
  );

  it("debts lower the net worth but never the liquidity", async () => {
    const t = setup();
    const ana = await signedInAs(t, "Ana");
    await addAsset(ana.client, "Compte", "bankAccount", "800,00");

    await addDebt(ana.client, "Targeta de crèdit", "1200,00");

    expect(await homeCard(ana.client)).toEqual({ netWorth: "-400,00 €", liquidity: "800,00 €" });
  });

  it("changing an asset's type in the edit screen moves it in or out of the liquidity", async () => {
    const t = setup();
    const ana = await signedInAs(t, "Ana");
    const savings = await addAsset(ana.client, "Estalvis", "investment", "5000,00");
    expect(await homeCard(ana.client)).toEqual({ netWorth: "5.000,00 €", liquidity: "0,00 €" });

    await editAsset(ana.client, savings, { assetType: "bankAccount" });
    expect(await homeCard(ana.client)).toEqual({ netWorth: "5.000,00 €", liquidity: "5.000,00 €" });

    await editAsset(ana.client, savings, { assetType: "other" });
    expect(await homeCard(ana.client)).toEqual({ netWorth: "5.000,00 €", liquidity: "0,00 €" });
  });
});

describe("US3.3 · la targeta s'actualitza sola", () => {
  it("every add, edit and delete changes the card straight away", async () => {
    const t = setup();
    const ana = await signedInAs(t, "Ana");
    const steps: string[] = [];
    const snapshot = async (step: string) => {
      const card = await homeCard(ana.client);
      steps.push(`${step}: ${card.netWorth} | ${card.liquidity}`);
    };

    await snapshot("inici");
    const account = await addAsset(ana.client, "Compte", "bankAccount", "1500,00");
    await snapshot("compte");
    const car = await addAsset(ana.client, "Cotxe", "vehicle", "7000,00");
    await snapshot("cotxe");
    const loan = await addDebt(ana.client, "Préstec del cotxe", "6000,00");
    await snapshot("préstec");
    await editDebt(ana.client, loan, { amount: "5500,00" });
    await snapshot("quota pagada");
    await editAsset(ana.client, account, { amount: "1000,00" });
    await snapshot("compte baixa");
    await ana.client.mutation(api.netWorth.removeAsset, { assetId: car });
    await snapshot("cotxe venut");
    await ana.client.mutation(api.netWorth.removeDebt, { debtId: loan });
    await snapshot("préstec tornat");

    expect(steps).toEqual([
      "inici: 0,00 € | 0,00 €",
      "compte: 1.500,00 € | 1.500,00 €",
      "cotxe: 8.500,00 € | 1.500,00 €",
      "préstec: 2.500,00 € | 1.500,00 €",
      "quota pagada: 3.000,00 € | 1.500,00 €",
      "compte baixa: 2.500,00 € | 1.000,00 €",
      "cotxe venut: -4.500,00 € | 1.000,00 €",
      "préstec tornat: 1.000,00 € | 1.000,00 €",
    ]);
  });

  it("an amount the form rejects is rejected by the backend with the same message, and the card does not change", async () => {
    const t = setup();
    const ana = await signedInAs(t, "Ana");
    await addAsset(ana.client, "Compte", "bankAccount", "200,00");
    const before = await homeCard(ana.client);

    const inTheBrowser = parseNetWorthFields({
      ...EMPTY_NET_WORTH_FIELDS,
      kind: "asset",
      label: "Compte buit",
      assetType: "cash",
      amount: "0,00",
    });
    const fromTheBackend = getNetWorthErrors(
      await rejectionOf(
        ana.client.mutation(api.netWorth.createAsset, { name: "Compte buit", type: "cash", amountCents: 0 }),
      ),
    );

    expect(inTheBrowser.request).toBeNull();
    expect(inTheBrowser.errors.amount).toBe(ZERO_AMOUNT_MESSAGE);
    expect(fromTheBackend).toEqual({ fieldErrors: { amount: ZERO_AMOUNT_MESSAGE } });
    expect(await homeCard(ana.client)).toEqual(before);
  });
});
