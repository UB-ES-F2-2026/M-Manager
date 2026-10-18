import { ConvexError } from "convex/values";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 20;
const MIN_PASSWORD_LENGTH = 8;

export type AuthErrorCode =
  | "INVALID_NAME"
  | "INVALID_EMAIL"
  | "INVALID_PASSWORD"
  | "EMAIL_TAKEN"
  | "INVALID_CREDENTIALS";

/** Message shown when sign-up uses an email that already has an account (US1.1 AC2). */
export const EMAIL_TAKEN_MESSAGE = "Aquest correu ja està registrat";

/**
 * Generic login failure message (US1.2 AC2).
 * Deliberately does not say whether the email or the password was wrong.
 */
export const INVALID_CREDENTIALS_MESSAGE =
  "Correu electrònic o contrasenya incorrectes";

/** Throws the structured error the registration form expects for a taken email. */
export function throwEmailTaken(): never {
  throw new ConvexError({
    code: "EMAIL_TAKEN" satisfies AuthErrorCode,
    message: EMAIL_TAKEN_MESSAGE,
  });
}

/** Throws the structured error the login form expects for bad credentials. */
export function throwInvalidCredentials(): never {
  throw new ConvexError({
    code: "INVALID_CREDENTIALS" satisfies AuthErrorCode,
    message: INVALID_CREDENTIALS_MESSAGE,
  });
}

/** Rejects missing/blank names and names longer than MAX_NAME_LENGTH. */
export function assertValidName(name: unknown): string {
  if (typeof name !== "string") {
    throw new ConvexError({
      code: "INVALID_NAME" satisfies AuthErrorCode,
      message: "El nom és obligatori.",
    });
  }

  const trimmed = name.trim();
  if (trimmed.length < 1) {
    throw new ConvexError({
      code: "INVALID_NAME" satisfies AuthErrorCode,
      message: "El nom és obligatori.",
    });
  }

  if (trimmed.length > MAX_NAME_LENGTH) {
    throw new ConvexError({
      code: "INVALID_NAME" satisfies AuthErrorCode,
      message: "El nom és massa llarg.",
    });
  }

  return trimmed;
}

/** Trims and lowercases the email, then checks basic format. */
export function assertValidEmail(email: unknown): string {
  if (typeof email !== "string") {
    throw new ConvexError({
      code: "INVALID_EMAIL" satisfies AuthErrorCode,
      message: "El format del correu electrònic no és vàlid.",
    });
  }

  const normalized = email.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(normalized)) {
    throw new ConvexError({
      code: "INVALID_EMAIL" satisfies AuthErrorCode,
      message: "El format del correu electrònic no és vàlid.",
    });
  }

  return normalized;
}

/** Requires a string password with at least MIN_PASSWORD_LENGTH characters. */
export function assertValidPassword(password: unknown): void {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    throw new ConvexError({
      code: "INVALID_PASSWORD" satisfies AuthErrorCode,
      message: "La contrasenya ha de tenir almenys 8 caràcters.",
    });
  }
}

/** Validates name and email together for sign-up (password is checked separately). */
export function validateSignUpProfile(params: {
  name: unknown;
  email: unknown;
}): { name: string; email: string } {
  return {
    email: assertValidEmail(params.email),
    name: assertValidName(params.name),
  };
}
