/**
 * Sample bank accounts for the account list. The home screen no longer uses
 * them: the balance card was replaced by real net worth and liquidity (US3.3).
 */

export type SampleAccount = {
  id: string;
  bankName: string;
  initials: string;
  kind: string;
  lastDigits: string;
  balanceCents: number;
};

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
