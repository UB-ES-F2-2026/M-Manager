import type { AssetType } from "../../../convex/lib/assetTypes";

/** Catalan label shown in the UI for each stored asset type. */
export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  bankAccount: "Compte bancari",
  cash: "Efectiu",
  investment: "Inversions",
  realEstate: "Immoble",
  vehicle: "Vehicle",
  other: "Altres",
};
