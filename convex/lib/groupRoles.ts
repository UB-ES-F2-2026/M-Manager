import { v } from "convex/values";

/**
 * Role of a user inside a group (US4.1).
 * The creator is the "owner" (shown as «Admin» in the UI); everyone who joins
 * with the code is a "member".
 */
export const GROUP_ROLES = ["owner", "member"] as const;

export type GroupRole = (typeof GROUP_ROLES)[number];

/** Convex validator for `groupMembers.role`. Keep in sync with GROUP_ROLES. */
export const groupRoleValidator = v.union(v.literal("owner"), v.literal("member"));
