import type { Id } from "../../../convex/_generated/dataModel";

/** Name of a group member as the expense form shows it: "Ana (tu)" for the current user. */
export function memberLabel(
  member: { userId: Id<"users">; name: string },
  currentUserId: Id<"users"> | undefined,
): string {
  const name = member.name.trim() === "" ? "Membre sense nom" : member.name.trim();
  return member.userId === currentUserId ? `${name} (tu)` : name;
}
