export const MIN_PASSWORD_LENGTH = 8;

/** 0 = empty, 1 = weak, 2 = fair, 3 = good, 4 = strong. */
export type PasswordStrength = 0 | 1 | 2 | 3 | 4;

/**
 * Scores a password by how many rules it meets: minimum length,
 * an uppercase letter, a number and a symbol. Passwords shorter than
 * MIN_PASSWORD_LENGTH are always weak, because the backend rejects them.
 */
export function getPasswordStrength(password: string): PasswordStrength {
  if (password.length === 0) {
    return 0;
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return 1;
  }

  const rules = [/[A-Z]/, /\d/, /[^A-Za-z0-9]/];
  const extraRulesMet = rules.filter((rule) => rule.test(password)).length;

  // Length alone counts as weak; each extra rule adds one level.
  return (extraRulesMet + 1) as PasswordStrength;
}
