/** Link that opens /groups/join with the code already filled in (US4.1 AC2). */
export function groupInviteLink(origin: string, code: string): string {
  return `${origin}/groups/join?code=${encodeURIComponent(code)}`;
}
