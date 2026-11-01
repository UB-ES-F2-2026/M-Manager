import { ConvexError } from "convex/values";
import type { Doc, Id, TableNames } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type DbCtx = QueryCtx | MutationCtx;

/** Tables whose documents store the owning user. */
type OwnedTableName = {
  [Name in TableNames]: Doc<Name> extends { userId: Id<"users"> } ? Name : never;
}[TableNames];

/**
 * Loads a document and checks it belongs to `userId`.
 * A missing row and another user's row both fail as not found,
 * so callers do not reveal whether the id exists.
 * Shared by assets, debts and, later, transactions (README §7).
 */
export async function requireOwnedDocument<TableName extends OwnedTableName>(
  ctx: DbCtx,
  userId: Id<"users">,
  documentId: Id<TableName>,
  notFoundMessage: string,
): Promise<Doc<TableName>> {
  const document = await ctx.db.get(documentId);
  if (document === null || document.userId !== userId) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: notFoundMessage,
    });
  }
  return document;
}
