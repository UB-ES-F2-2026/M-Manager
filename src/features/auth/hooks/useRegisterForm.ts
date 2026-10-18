import { useAuthActions } from "@convex-dev/auth/react";
import { ConvexError } from "convex/values";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  assertValidEmail,
  assertValidName,
  assertValidPassword,
} from "../../../../convex/lib/validation";

export const REQUIRED_FIELD_MESSAGE = "Aquest camp és obligatori";
export const EMAIL_TAKEN_MESSAGE = "Aquest correu ja està registrat";
/** Same limit as MAX_NAME_LENGTH in convex/lib/validation.ts. */
export const MAX_NAME_LENGTH = 20;

export type RegisterFields = {
  name: string;
  email: string;
  password: string;
};

export type RegisterFieldErrors = Partial<Record<keyof RegisterFields, string>>;

export type FormAlertMessage = {
  title: string;
  description: string;
};

export type RegisterErrors = {
  fieldErrors: RegisterFieldErrors;
  alert?: FormAlertMessage;
};

const VALIDATOR_BY_FIELD: Record<keyof RegisterFields, (value: string) => unknown> = {
  name: assertValidName,
  email: assertValidEmail,
  password: assertValidPassword,
};

/**
 * Checks every field before sending (AC3): required first, then the same
 * validators the backend runs, so the rules live in one place.
 */
export function validateRegisterFields(fields: RegisterFields): RegisterFieldErrors {
  const errors: RegisterFieldErrors = {};
  for (const field of Object.keys(VALIDATOR_BY_FIELD) as (keyof RegisterFields)[]) {
    const value = fields[field];
    if (value.trim() === "") {
      errors[field] = REQUIRED_FIELD_MESSAGE;
      continue;
    }
    try {
      VALIDATOR_BY_FIELD[field](value);
    } catch (error) {
      if (error instanceof ConvexError && isCodedError(error.data)) {
        errors[field] = error.data.message;
      }
    }
  }
  return errors;
}

const FIELD_BY_ERROR_CODE: Record<string, keyof RegisterFields> = {
  INVALID_NAME: "name",
  INVALID_EMAIL: "email",
  INVALID_PASSWORD: "password",
};

/** Turns a sign-up error from the backend into messages for the form (AC2, AC3). */
export function getRegisterErrors(error: unknown): RegisterErrors {
  if (error instanceof ConvexError && isCodedError(error.data)) {
    const field = FIELD_BY_ERROR_CODE[error.data.code];
    if (field) {
      return { fieldErrors: { [field]: error.data.message } };
    }
  }

  // Convex Auth throws a plain Error when the account exists. Its text only
  // reaches the client in development; production gets the generic alert.
  if (error instanceof Error && error.message.includes("already exists")) {
    return {
      fieldErrors: { email: EMAIL_TAKEN_MESSAGE },
      alert: {
        title: EMAIL_TAKEN_MESSAGE,
        description: "Inicia la sessió o fes servir un altre correu.",
      },
    };
  }

  return {
    fieldErrors: {},
    alert: {
      title: "No s'ha pogut crear el compte",
      description: "Torna-ho a provar d'aquí a una estona.",
    },
  };
}

function isCodedError(data: unknown): data is { code: string; message: string } {
  return (
    typeof data === "object" &&
    data !== null &&
    "code" in data &&
    typeof data.code === "string" &&
    "message" in data &&
    typeof data.message === "string"
  );
}

/** Form state, submit logic and redirect for the registration screen (US1.1). */
export function useRegisterForm() {
  const { signIn } = useAuthActions();
  const navigate = useNavigate();
  const [fields, setFields] = useState<RegisterFields>({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<RegisterErrors>({ fieldErrors: {} });
  const [isSubmitting, setIsSubmitting] = useState(false);

  function setField(name: keyof RegisterFields, value: string) {
    setFields((current) => ({ ...current, [name]: value }));
    // Clear the field's error as soon as the user starts fixing it.
    setErrors((current) => ({
      ...current,
      fieldErrors: { ...current.fieldErrors, [name]: undefined },
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const fieldErrors = validateRegisterFields(fields);
    setErrors({ fieldErrors });
    if (Object.keys(fieldErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await signIn("password", {
        name: fields.name.trim(),
        email: fields.email.trim(),
        password: fields.password,
        flow: "signUp",
      });
      // Sign-up also signs the user in, so they go straight to the main screen.
      navigate("/", { replace: true });
    } catch (error) {
      setErrors(getRegisterErrors(error));
      setIsSubmitting(false);
    }
  }

  return { fields, errors, isSubmitting, setField, handleSubmit };
}
