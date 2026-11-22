import { ConvexError, v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { requireAuthUserId } from "./lib/auth";
import type { GroupRole } from "./lib/groupRoles";
import {
  generateGroupCode,
  INVALID_GROUP_CODE_MESSAGE,
  isValidGroupCode,
  normalizeGroupCode,
} from "./lib/groupCodes";
import { computeBalances, simplifyDebts } from "./lib/balances";
import { splitByAmounts, splitByPercentages, splitEqually } from "./lib/splitExpense";
import { assertValidAmountCents, assertValidConcept } from "./lib/validation";

type GroupErrorCode =
  | "INVALID_NAME"
  | "INVALID_DESCRIPTION"
  | "INVALID_CODE"
  | "CODE_GENERATION_FAILED"
  | "NOT_FOUND"
  | "INVALID_PAYER"
  | "INVALID_PARTICIPANTS";

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

/**
 * The group and the user's membership, or null when the id is malformed, the
 * group does not exist or the user is not a member. Queries return that null
 * as is, so they never reveal whether a group exists (README §7).
 */
async function getMemberAccess(ctx: QueryCtx, rawGroupId: string, userId: Id<"users">) {
  const groupId = ctx.db.normalizeId("groups", rawGroupId);
  if (groupId === null) {
    return null;
  }
  const myMembership = await ctx.db
    .query("groupMembers")
    .withIndex("by_group_and_user", (q) => q.eq("groupId", groupId).eq("userId", userId))
    .unique();
  if (myMembership === null) {
    return null;
  }
  const group = await ctx.db.get(groupId);
  return group === null ? null : { group, myMembership };
}

/** Members with their display name and role: owner first, then by name. */
async function loadMembers(ctx: QueryCtx, groupId: Id<"groups">) {
  const memberships = await ctx.db
    .query("groupMembers")
    .withIndex("by_group_and_user", (q) => q.eq("groupId", groupId))
    .collect();
  const members = await Promise.all(
    memberships.map(async (membership) => {
      const user = await ctx.db.get(membership.userId);
      return { userId: membership.userId, name: user?.name ?? "", role: membership.role };
    }),
  );
  return members.sort(compareMembers);
}

/** Owner first, then by name, so the creator («Admin») heads the list. */
function compareMembers(
  a: { name: string; role: GroupRole },
  b: { name: string; role: GroupRole },
): number {
  if (a.role !== b.role) {
    return a.role === "owner" ? -1 : 1;
  }
  return a.name.localeCompare(b.name, "ca");
}

/**
 * Groups the signed-in user belongs to, for the /groups list (US4.1).
 * Sorted by name; `role` lets the UI tell the groups the user created.
 */
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuthUserId(ctx);

    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const groups = await Promise.all(
      memberships.map(async (membership) => {
        const group = await ctx.db.get(membership.groupId);
        return group === null
          ? null
          : {
              _id: group._id,
              name: group.name,
              description: group.description,
              role: membership.role,
            };
      }),
    );

    return groups
      .filter((group) => group !== null)
      .sort((a, b) => a.name.localeCompare(b.name, "ca"));
  },
});

/**
 * Detail of a group for /groups/:groupId (US4.1): name, description, invite
 * code and members with their display name and role.
 * Only members can see it. A malformed id, a missing group and a group the
 * user does not belong to all return null, so the UI shows "not found" without
 * revealing whether the group exists (README §7).
 */
export const get = query({
  args: { groupId: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const access = await getMemberAccess(ctx, args.groupId, userId);
    if (access === null) {
      return null;
    }
    const { group, myMembership } = access;

    return {
      _id: group._id,
      name: group.name,
      description: group.description,
      code: group.code,
      myRole: myMembership.role,
      members: await loadMembers(ctx, group._id),
    };
  },
});

/** Same message for a missing group and a group the user is not in (README §7). */
export const GROUP_NOT_FOUND_MESSAGE = "No s'ha trobat el grup.";

/**
 * How the expense is divided, as the «Com es divideix» toggle sends it:
 * the participants for «Igual», their cents for «Imports», or their
 * percentages for «Percentatges».
 */
const splitValidator = v.union(
  v.object({
    mode: v.literal("equal"),
    participants: v.array(v.id("users")),
  }),
  v.object({
    mode: v.literal("amounts"),
    shares: v.array(v.object({ userId: v.id("users"), amountCents: v.number() })),
  }),
  v.object({
    mode: v.literal("percentages"),
    shares: v.array(v.object({ userId: v.id("users"), percentage: v.number() })),
  }),
);

/**
 * Adds a shared expense to a group (US4.2).
 * Only members can add one: a malformed id, a missing group and a group the
 * user is not in all fail with the same NOT_FOUND.
 * The concept and amount follow the same rules as transactions. The payer and
 * every participant must be members; the payer does not need to participate.
 * The shares are computed here, in cents, and always add up to `amountCents`.
 * Nothing is saved when any check fails. Returns the new expense id.
 */
export const createExpense = mutation({
  args: {
    groupId: v.string(),
    concept: v.string(),
    amountCents: v.number(),
    paidBy: v.id("users"),
    split: splitValidator,
  },
  handler: async (ctx, args): Promise<Id<"groupExpenses">> => {
    const userId = await requireAuthUserId(ctx);
    const groupId = ctx.db.normalizeId("groups", args.groupId);
    const group = groupId === null ? null : await ctx.db.get(groupId);
    if (group === null) {
      return throwGroupError("NOT_FOUND", GROUP_NOT_FOUND_MESSAGE);
    }

    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) => q.eq("groupId", group._id))
      .collect();
    const memberIds = new Set<string>(memberships.map((membership) => membership.userId));
    if (!memberIds.has(userId)) {
      throwGroupError("NOT_FOUND", GROUP_NOT_FOUND_MESSAGE);
    }

    const concept = assertValidConcept(args.concept);
    assertValidAmountCents(args.amountCents);

    if (!memberIds.has(args.paidBy)) {
      throwGroupError("INVALID_PAYER", "Qui ha pagat ha de ser membre del grup.");
    }

    const { split } = args;
    const participants =
      split.mode === "equal" ? split.participants : split.shares.map((share) => share.userId);
    assertParticipants(participants, memberIds);

    const shares =
      split.mode === "equal"
        ? splitEqually(args.amountCents, split.participants)
        : split.mode === "amounts"
          ? splitByAmounts(args.amountCents, split.shares)
          : splitByPercentages(args.amountCents, split.shares);

    return await ctx.db.insert("groupExpenses", {
      groupId: group._id,
      concept,
      amountCents: args.amountCents,
      paidBy: args.paidBy,
      splitMode: split.mode,
      shares,
    });
  },
});

/** At least one participant, none repeated, and all of them members. */
function assertParticipants(participants: Id<"users">[], memberIds: Set<string>): void {
  if (participants.length === 0) {
    throwGroupError("INVALID_PARTICIPANTS", "Cal almenys un participant.");
  }
  if (new Set(participants).size !== participants.length) {
    throwGroupError("INVALID_PARTICIPANTS", "Hi ha participants repetits.");
  }
  if (participants.some((participant) => !memberIds.has(participant))) {
    throwGroupError(
      "INVALID_PARTICIPANTS",
      "Tots els participants han de ser membres del grup.",
    );
  }
}

/**
 * History of a group's expenses for /groups/:groupId (US4.2), most recent
 * first. Each row has what the list shows: concept, amount, who paid, how
 * many people take part and the date (`_creationTime`, in ms).
 * Only for members: otherwise null, like `get`.
 */
export const listExpenses = query({
  args: { groupId: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const access = await getMemberAccess(ctx, args.groupId, userId);
    if (access === null) {
      return null;
    }

    const expenses = await ctx.db
      .query("groupExpenses")
      .withIndex("by_group", (q) => q.eq("groupId", access.group._id))
      .order("desc")
      .collect();

    const payerNames = new Map<Id<"users">, string>();
    for (const payerId of new Set(expenses.map((expense) => expense.paidBy))) {
      const payer = await ctx.db.get(payerId);
      payerNames.set(payerId, payer?.name ?? "");
    }

    return expenses.map((expense) => ({
      _id: expense._id,
      _creationTime: expense._creationTime,
      concept: expense.concept,
      amountCents: expense.amountCents,
      paidBy: expense.paidBy,
      paidByName: payerNames.get(expense.paidBy) ?? "",
      participantCount: expense.shares.length,
    }));
  },
});

/**
 * «Balanços» and «Per saldar» of /groups/:groupId (US4.3), computed here and
 * not in the frontend (README §6).
 * - `balances`: one row per member, in the order of the members list, with
 *   balanceCents = paid as payer − shares as participant + settlements
 *   received − settlements made (> 0 «Li deuen», < 0 «Deu», 0 «En pau»).
 * - `transfers`: the suggested payments of the deterministic greedy algorithm,
 *   with the names the cards show.
 * Reactive: a new expense or settlement recomputes both.
 * Only for members: otherwise null, like `get`.
 */
export const getBalances = query({
  args: { groupId: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const access = await getMemberAccess(ctx, args.groupId, userId);
    if (access === null) {
      return null;
    }
    const groupId = access.group._id;

    const members = await loadMembers(ctx, groupId);
    const expenses = await ctx.db
      .query("groupExpenses")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect();
    const settlements = await ctx.db
      .query("groupSettlements")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect();

    const balances = computeBalances(
      members.map((member) => member.userId),
      expenses,
      settlements,
    );
    const names = new Map(members.map((member) => [member.userId, member.name]));
    const nameOf = (memberId: Id<"users">) => names.get(memberId) ?? "";

    return {
      balances: balances.map((balance) => ({ ...balance, name: nameOf(balance.userId) })),
      transfers: simplifyDebts(balances).map((transfer) => ({
        ...transfer,
        fromName: nameOf(transfer.fromUserId),
        toName: nameOf(transfer.toUserId),
      })),
    };
  },
});
