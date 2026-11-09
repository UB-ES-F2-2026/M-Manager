/**
 * Sample data still used by the balance card and account list on the home
 * screen. Recent movements already come from Convex (US2.3).
 */

export type SampleAccount = {
  id: string;
  bankName: string;
  initials: string;
  kind: string;
  lastDigits: string;
  balanceCents: number;
};

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
