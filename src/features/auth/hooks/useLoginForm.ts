import { useAuthActions } from "@convex-dev/auth/react";
import { ConvexError } from "convex/values";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { INVALID_CREDENTIALS_MESSAGE } from "../../../../convex/lib/validation";

export const REQUIRED_FIELD_MESSAGE = "Aquest camp és obligatori";

/** Generic credentials error (AC2): it never says which field is wrong. */
export const LOGIN_ERROR_ALERT = {
  title: INVALID_CREDENTIALS_MESSAGE,
  description: "Revisa les teves dades i torna-ho a provar.",
};

export type LoginFields = {
  email: string;
  password: string;
};

export type LoginFieldErrors = Partial<Record<keyof LoginFields, string>>;

type PasswordSignIn = (
  provider: "password",
  params: { email: string; password: string; flow: "signIn" },
) => Promise<unknown>;

/** Returns an error per empty field (AC3). An empty object means the form is valid. */
export function validateLoginFields(fields: LoginFields): LoginFieldErrors {
  const errors: LoginFieldErrors = {};
  if (fields.email.trim() === "") {
    errors.email = REQUIRED_FIELD_MESSAGE;
  }
  if (fields.password === "") {
    errors.password = REQUIRED_FIELD_MESSAGE;
  }
  return errors;
}

/** True when the backend rejected the login with INVALID_CREDENTIALS (or a legacy Auth error). */
export function isInvalidCredentialsError(error: unknown): boolean {
  if (
    error instanceof ConvexError &&
    typeof error.data === "object" &&
    error.data !== null &&
    "code" in error.data &&
    error.data.code === "INVALID_CREDENTIALS"
  ) {
    return true;
  }
  if (!(error instanceof Error)) {
    return false;
  }
  return (
    error.message === "InvalidSecret" ||
    error.message === "InvalidAccountId" ||
    error.message === "TooManyFailedAttempts"
  );
}

/** Tries to sign in with Convex Auth. Returns false when the credentials are rejected. */
export async function attemptLogin(signIn: PasswordSignIn, fields: LoginFields): Promise<boolean> {
  try {
    await signIn("password", {
      email: fields.email.trim(),
      password: fields.password,
      flow: "signIn",
    });
    return true;
  } catch (error) {
    if (isInvalidCredentialsError(error)) {
      return false;
    }
    // Unexpected failures still surface as the generic credentials alert (AC2).
    return false;
  }
}

/** Form state, submit logic and redirect for the login screen (US1.2). */
export function useLoginForm() {
  const { signIn } = useAuthActions();
  const navigate = useNavigate();
  const [fields, setFields] = useState<LoginFields>({ email: "", password: "" });
  const [errors, setErrors] = useState<LoginFieldErrors>({});
  const [hasCredentialsError, setHasCredentialsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function setField(name: keyof LoginFields, value: string) {
    setFields((current) => ({ ...current, [name]: value }));
    // Clear the field's error as soon as the user starts fixing it.
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateLoginFields(fields);
    setErrors(validationErrors);
    setHasCredentialsError(false);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    if (await attemptLogin(signIn, fields)) {
      // Successful login goes to the main screen (AC1).
      navigate("/", { replace: true });
      return;
    }
    setHasCredentialsError(true);
    setIsSubmitting(false);
  }

  return { fields, errors, hasCredentialsError, isSubmitting, setField, handleSubmit };
}
