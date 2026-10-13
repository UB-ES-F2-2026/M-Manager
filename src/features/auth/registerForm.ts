import { ConvexError } from "convex/values";
import {
  getPasswordChecks,
  isValidEmail,
  type AuthErrorCode,
} from "../../../convex/lib/validation";

export type RegisterValues = {
  name: string;
  email: string;
  password: string;
};

export type RegisterField = keyof RegisterValues;

export type RegisterFieldErrors = Partial<Record<RegisterField, string>>;

export type RegisterAlert = {
  title: string;
  description: string;
};

export type RegisterErrorResult = {
  alert: RegisterAlert | null;
  fieldErrors: RegisterFieldErrors;
};

export type PasswordStrengthLevel = "weak" | "fair" | "good" | "strong";

export type PasswordStrength = {
  /** Number of requirements met, from 0 to 4. */
  score: number;
  level: PasswordStrengthLevel;
};

export const REGISTER_MESSAGES = {
  required: "Aquest camp és obligatori",
  invalidEmail: "Introdueix un correu vàlid (ex. nom@domini.com)",
  weakPassword: "La contrasenya és massa feble",
  nameTooLong: "El nom és massa llarg",
  emailInUse: "Aquest correu ja està en ús",
  passwordHint: "Mínim 8 caràcters, amb majúscula, número i símbol",
  emailTakenAlert: {
    title: "Aquest correu ja està registrat",
    description: "Inicia sessió o utilitza un altre correu.",
  },
  genericAlert: {
    title: "No s'ha pogut crear el compte",
    description: "Torna-ho a provar d'aquí a uns moments.",
  },
} as const;

export const PASSWORD_STRENGTH_LABELS: Record<PasswordStrengthLevel, string> = {
  weak: "Feble",
  fair: "Millorable",
  good: "Bona",
  strong: "Forta",
};

const MAX_NAME_LENGTH = 100;

export function getPasswordStrength(password: string): PasswordStrength {
  const score = Object.values(getPasswordChecks(password)).filter(Boolean).length;
  const level: PasswordStrengthLevel =
    score >= 4 ? "strong" : score === 3 ? "good" : score === 2 ? "fair" : "weak";
  return { score, level };
}

export function validateRegisterForm(values: RegisterValues): RegisterFieldErrors {
  const errors: RegisterFieldErrors = {};

  const name = values.name.trim();
  if (!name) {
    errors.name = REGISTER_MESSAGES.required;
  } else if (name.length > MAX_NAME_LENGTH) {
    errors.name = REGISTER_MESSAGES.nameTooLong;
  }

  if (!values.email.trim()) {
    errors.email = REGISTER_MESSAGES.required;
  } else if (!isValidEmail(values.email)) {
    errors.email = REGISTER_MESSAGES.invalidEmail;
  }

  if (!values.password) {
    errors.password = REGISTER_MESSAGES.required;
  } else if (getPasswordStrength(values.password).level !== "strong") {
    errors.password = REGISTER_MESSAGES.weakPassword;
  }

  return errors;
}

/** Translates a sign-up failure from Convex Auth into UI messages. */
export function mapRegisterError(error: unknown): RegisterErrorResult {
  if (error instanceof ConvexError) {
    const data: unknown = error.data;
    const code =
      typeof data === "object" && data !== null && "code" in data
        ? (data as { code: unknown }).code
        : undefined;

    const fieldByCode: Record<AuthErrorCode, RegisterFieldErrors> = {
      INVALID_NAME: { name: REGISTER_MESSAGES.required },
      INVALID_EMAIL: { email: REGISTER_MESSAGES.invalidEmail },
      INVALID_PASSWORD: { password: REGISTER_MESSAGES.weakPassword },
    };
    if (typeof code === "string" && code in fieldByCode) {
      return { alert: null, fieldErrors: fieldByCode[code as AuthErrorCode] };
    }
  }

  const message = error instanceof Error ? error.message : String(error);
  if (/already exists/i.test(message)) {
    return {
      alert: REGISTER_MESSAGES.emailTakenAlert,
      fieldErrors: { email: REGISTER_MESSAGES.emailInUse },
    };
  }

  return { alert: REGISTER_MESSAGES.genericAlert, fieldErrors: {} };
}
