/**
 * Sample data for the static main screen (US1.2).
 * Replace it with Convex queries once accounts and transactions exist (US2.x);
 * the total balance must then come from the backend, not from summing here.
 */

export type SampleAccount = {
  id: string;
  bankName: string;
  initials: string;
  kind: string;
  lastDigits: string;
  balanceCents: number;
};

export type SampleTransaction = {
  id: string;
  title: string;
  bankName: string;
  /** Timestamp in ms. */
  date: number;
  amountCents: number;
  type: "expense" | "income";
};

const DAY_MS = 24 * 60 * 60 * 1000;
const now = Date.now();

export const SAMPLE_TOTAL_BALANCE_CENTS = 1248032;

export const SAMPLE_ACCOUNTS: SampleAccount[] = [
  {
    id: "banc-nord",
    bankName: "Banc Nord",
    initials: "BN",
    kind: "Compte corrent",
    lastDigits: "4821",
    balanceCents: 824010,
  },
  {
    id: "caixa-sud",
    bankName: "Caixa Sud",
    initials: "CS",
    kind: "Compte nòmina",
    lastDigits: "1093",
    balanceCents: 391252,
  },
  {
    id: "neobank",
    bankName: "NeoBank",
    initials: "NB",
    kind: "Compte d'estalvi",
    lastDigits: "7730",
    balanceCents: 32770,
  },
];

export const SAMPLE_TRANSACTIONS: SampleTransaction[] = [
  {
    id: "supermercat",
    title: "Supermercat",
    bankName: "Banc Nord",
    date: now,
    amountCents: 4290,
    type: "expense",
  },
  {
    id: "nomina",
    title: "Nòmina",
    bankName: "Caixa Sud",
    date: now - 2 * DAY_MS,
    amountCents: 185000,
    type: "income",
  },
  {
    id: "streaming",
    title: "Subscripció streaming",
    bankName: "NeoBank",
    date: now - 3 * DAY_MS,
    amountCents: 1299,
    type: "expense",
  },
];
