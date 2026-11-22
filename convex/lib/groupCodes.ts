/**
 * Invite codes of groups (US4.1).
 * 6 uppercase characters from A–Z and 2–9, without the look-alikes 0, O, 1
 * and I, so a code read aloud or copied by hand is not ambiguous.
 * Shared with the frontend (join form and share link).
 */
export const GROUP_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const GROUP_CODE_LENGTH = 6;

const GROUP_CODE_PATTERN = new RegExp(`^[${GROUP_CODE_ALPHABET}]{${GROUP_CODE_LENGTH}}$`);

/** Message for a code that is badly formed or does not belong to any group. */
export const INVALID_GROUP_CODE_MESSAGE = "Aquest codi no és vàlid.";

/** Message the join screen shows before opening a group the user already belongs to. */
export const ALREADY_MEMBER_MESSAGE = "Ja formes part d'aquest grup.";

/**
 * Builds a random code. `random` returns a number in [0, 1), like Math.random,
 * which Convex makes deterministic inside mutations.
 */
export function generateGroupCode(random: () => number = Math.random): string {
  let code = "";
  for (let index = 0; index < GROUP_CODE_LENGTH; index += 1) {
    code += GROUP_CODE_ALPHABET[Math.floor(random() * GROUP_CODE_ALPHABET.length)];
  }
  return code;
}

/** What the user typed or pasted, without surrounding spaces and in uppercase. */
export function normalizeGroupCode(input: string): string {
  return input.trim().toUpperCase();
}

/** True when the (already normalized) code has the right length and characters. */
export function isValidGroupCode(code: string): boolean {
  return GROUP_CODE_PATTERN.test(code);
}
