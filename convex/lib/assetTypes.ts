import { v } from "convex/values";

/**
 * Fixed asset type list (US3.2).
 * Values are stored in English; the UI shows Catalan labels later.
 */
export const ASSET_TYPES = [
  "bankAccount",
  "cash",
  "investment",
  "realEstate",
  "vehicle",
  "other",
] as const;

export type AssetType = (typeof ASSET_TYPES)[number];

/**
 * Asset types that count as available liquidity (US3.3): money in accounts
 * and cash. Investments, real estate, vehicles and other assets do not.
 */
export const LIQUID_ASSET_TYPES: readonly AssetType[] = ["bankAccount", "cash"];

/** Convex validator for `assets.type`. Keep in sync with ASSET_TYPES. */
export const assetTypeValidator = v.union(
  v.literal("bankAccount"),
  v.literal("cash"),
  v.literal("investment"),
  v.literal("realEstate"),
  v.literal("vehicle"),
  v.literal("other"),
);
