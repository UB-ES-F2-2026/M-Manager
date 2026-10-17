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

export function assertValidPassword(password: unknown): void {
  if (typeof password !== "string" || password.length < 8) {
    throw new ConvexError({
      code: "INVALID_PASSWORD" satisfies AuthErrorCode,
      message: "La contrasenya ha de tenir almenys 8 caràcters.",
    });
  }
}
