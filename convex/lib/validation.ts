import { ConvexError } from "convex/values";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type AuthErrorCode =
  | "INVALID_NAME"
  | "INVALID_EMAIL"
  | "INVALID_PASSWORD";

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

  if (trimmed.length > 100) {
    throw new ConvexError({
      code: "INVALID_NAME" satisfies AuthErrorCode,
      message: "El nom és massa llarg.",
    });
  }

  return trimmed;
}

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim().toLowerCase());
}

export function assertValidEmail(email: unknown): string {
  if (typeof email !== "string") {
    throw new ConvexError({
      code: "INVALID_EMAIL" satisfies AuthErrorCode,
      message: "El format del correu electrònic no és vàlid.",
    });
  }

  const normalized = email.trim().toLowerCase();
  if (!isValidEmail(normalized)) {
    throw new ConvexError({
      code: "INVALID_EMAIL" satisfies AuthErrorCode,
      message: "El format del correu electrònic no és vàlid.",
    });
  }

  return normalized;
}

export const MIN_PASSWORD_LENGTH = 8;

export type PasswordChecks = {
  minLength: boolean;
  uppercase: boolean;
  number: boolean;
  symbol: boolean;
};

/** Shared with the frontend so the strength meter and the backend agree. */
export function getPasswordChecks(password: string): PasswordChecks {
  return {
    minLength: password.length >= MIN_PASSWORD_LENGTH,
    uppercase: /\p{Lu}/u.test(password),
    number: /\d/.test(password),
    symbol: /[^\p{L}\d\s]/u.test(password),
  };
}

export function isStrongPassword(password: string): boolean {
  return Object.values(getPasswordChecks(password)).every(Boolean);
}

export function assertValidPassword(password: unknown): void {
  if (typeof password !== "string" || !isStrongPassword(password)) {
    throw new ConvexError({
      code: "INVALID_PASSWORD" satisfies AuthErrorCode,
      message:
        "La contrasenya ha de tenir almenys 8 caràcters, amb majúscula, número i símbol.",
    });
  }
}
