import type { TransactionCategory } from "../../../convex/lib/transactionCategories";

/** Catalan label shown in the UI for each stored category value. */
export const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  groceries: "Supermercat",
  transport: "Transport",
  housing: "Habitatge",
  leisure: "Oci",
  health: "Salut",
  education: "Educació",
  restaurants: "Restaurants",
  shopping: "Compres",
  subscriptions: "Subscripcions",
  salary: "Nòmina",
  freelance: "Feines per compte propi",
  gifts: "Regals",
  refunds: "Devolucions",
  other: "Altres",
};
