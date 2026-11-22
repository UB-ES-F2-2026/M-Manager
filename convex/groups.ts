import { ConvexError, v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, type MutationCtx } from "./_generated/server";
import { requireAuthUserId } from "./lib/auth";
import {
  generateGroupCode,
  INVALID_GROUP_CODE_MESSAGE,
  isValidGroupCode,
  normalizeGroupCode,
} from "./lib/groupCodes";

type GroupErrorCode =
  | "INVALID_NAME"
  | "INVALID_DESCRIPTION"
  | "INVALID_CODE"
  | "CODE_GENERATION_FAILED";

export const MAX_GROUP_NAME_LENGTH = 80;
export const MAX_GROUP_DESCRIPTION_LENGTH = 200;

/** With 32^6 possible codes a clash is very unlikely; this only bounds the loop. */
const MAX_CODE_ATTEMPTS = 10;

function throwGroupError(code: GroupErrorCode, message: string): never {
  throw new ConvexError({ code, message });
}

/** Trimmed name, 1–80 characters. */
function assertGroupName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length < 1) {
    throwGroupError("INVALID_NAME", "El nom del grup és obligatori.");
  }
  if (trimmed.length > MAX_GROUP_NAME_LENGTH) {
    throwGroupError("INVALID_NAME", "El nom del grup és massa llarg.");
  }
  return trimmed;
}

/** Trimmed description, at most 200 characters. A missing one is stored as "". */
function assertGroupDescription(description: string | undefined): string {
  const trimmed = (description ?? "").trim();
  if (trimmed.length > MAX_GROUP_DESCRIPTION_LENGTH) {
    throwGroupError("INVALID_DESCRIPTION", "La descripció és massa llarga.");
  }
  return trimmed;
}

/** Generates codes until one is not used by any group yet. */
async function generateUnusedCode(ctx: MutationCtx): Promise<string> {
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
    const code = generateGroupCode();
    const existing = await ctx.db
      .query("groups")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();
    if (existing === null) {
      return code;
    }
  }
  return throwGroupError(
    "CODE_GENERATION_FAILED",
    "No s'ha pogut crear el grup. Torna-ho a provar.",
  );
}

/**
 * Creates a group with a unique invite code (US4.1).
 * The signed-in user becomes its only member, with the "owner" role.
 * Returns the new group id so the UI can open its detail.
 */
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Id<"groups">> => {
    const userId = await requireAuthUserId(ctx);
    const name = assertGroupName(args.name);
    const description = assertGroupDescription(args.description);
    const code = await generateUnusedCode(ctx);

    const groupId = await ctx.db.insert("groups", { name, description, code });
    await ctx.db.insert("groupMembers", { groupId, userId, role: "owner" });
    return groupId;
  },
});

/**
 * Adds the signed-in user to the group with this invite code (US4.1).
 * The code is trimmed and uppercased first, so "k7m2qx " also works.
 * A badly formed code and an unknown code fail the same way.
 * Joining a group twice is not an error: `alreadyMember` tells the UI to show
 * «Ja formes part d'aquest grup.» and open the group detail.
 */
export const join = mutation({
  args: { code: v.string() },
  handler: async (
    ctx,
    args,
  ): Promise<{ groupId: Id<"groups">; alreadyMember: boolean }> => {
    const userId = await requireAuthUserId(ctx);
    const code = normalizeGroupCode(args.code);
    if (!isValidGroupCode(code)) {
      throwGroupError("INVALID_CODE", INVALID_GROUP_CODE_MESSAGE);
    }

    const group = await ctx.db
      .query("groups")
      .withIndex("by_code", (q) => q.eq("code", code))
      .unique();
    if (group === null) {
      return throwGroupError("INVALID_CODE", INVALID_GROUP_CODE_MESSAGE);
    }

    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) =>
        q.eq("groupId", group._id).eq("userId", userId),
      )
      .unique();
    if (membership !== null) {
      return { groupId: group._id, alreadyMember: true };
    }

    await ctx.db.insert("groupMembers", {
      groupId: group._id,
      userId,
      role: "member",
    });
    return { groupId: group._id, alreadyMember: false };
  },
});
