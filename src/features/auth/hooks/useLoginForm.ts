import { useAuthActions } from "@convex-dev/auth/react";
import { useState, type FormEvent } from "react";

export const REQUIRED_FIELD_MESSAGE = "Aquest camp és obligatori";

export type LoginFields = {
  email: string;
  password: string;
};

export type LoginFieldErrors = Partial<Record<keyof LoginFields, string>>;

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

/** Form state and submit logic for the login screen (US1.2). */
export function useLoginForm() {
  const { signIn } = useAuthActions();
  const [fields, setFields] = useState<LoginFields>({ email: "", password: "" });
  const [errors, setErrors] = useState<LoginFieldErrors>({});
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
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await signIn("password", {
        email: fields.email.trim(),
        password: fields.password,
        flow: "signIn",
      });
    } catch {
      // The generic credentials error and the redirect are handled in #25.
    } finally {
      setIsSubmitting(false);
    }
  }

  return { fields, errors, isSubmitting, setField, handleSubmit };
}
