import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../../convex/_generated/api";

/** Same limits as MAX_GROUP_NAME_LENGTH and MAX_GROUP_DESCRIPTION_LENGTH in convex/groups.ts. */
export const MAX_GROUP_NAME_LENGTH = 80;
export const MAX_GROUP_DESCRIPTION_LENGTH = 200;

/** Same texts as the backend validators in convex/groups.ts. */
export const NAME_REQUIRED_MESSAGE = "El nom del grup és obligatori.";
export const NAME_TOO_LONG_MESSAGE = "El nom del grup és massa llarg.";
export const DESCRIPTION_TOO_LONG_MESSAGE = "La descripció és massa llarga.";

export type FormAlertMessage = {
  title: string;
  description: string;
};

/** Shown when the backend fails for a reason that is not tied to one field. */
export const CREATE_ERROR_ALERT: FormAlertMessage = {
  title: "No s'ha pogut crear el grup",
  description: "Torna-ho a provar d'aquí a una estona.",
};

/** Raw form values, as the user types them. */
export type NewGroupFields = {
  name: string;
  description: string;
};

export type NewGroupFieldErrors = Partial<Record<keyof NewGroupFields, string>>;

export type NewGroupErrors = {
  fieldErrors: NewGroupFieldErrors;
  alert?: FormAlertMessage;
};

export const EMPTY_NEW_GROUP_FIELDS: NewGroupFields = { name: "", description: "" };

/**
 * Checks the fields with the same rules as the backend and builds the
 * arguments of `groups.create`. `args` is null while there is any error.
 */
export function parseNewGroupFields(fields: NewGroupFields): {
  args: { name: string; description: string } | null;
  errors: NewGroupFieldErrors;
} {
  const errors: NewGroupFieldErrors = {};

  const name = fields.name.trim();
  if (name === "") {
    errors.name = NAME_REQUIRED_MESSAGE;
  } else if (name.length > MAX_GROUP_NAME_LENGTH) {
    errors.name = NAME_TOO_LONG_MESSAGE;
  }

  const description = fields.description.trim();
  if (description.length > MAX_GROUP_DESCRIPTION_LENGTH) {
    errors.description = DESCRIPTION_TOO_LONG_MESSAGE;
  }

  if (Object.keys(errors).length > 0) {
    return { args: null, errors };
  }
  return { args: { name, description }, errors };
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

const FIELD_BY_ERROR_CODE: Record<string, keyof NewGroupFields> = {
  INVALID_NAME: "name",
  INVALID_DESCRIPTION: "description",
};

/** Turns an error from `groups.create` into messages for the form. */
export function getNewGroupErrors(error: unknown): NewGroupErrors {
  if (error instanceof ConvexError && isCodedError(error.data)) {
    const field = FIELD_BY_ERROR_CODE[error.data.code];
    if (field) {
      return { fieldErrors: { [field]: error.data.message } };
    }
  }
  return { fieldErrors: {}, alert: CREATE_ERROR_ALERT };
}

/**
 * Form state and submit logic for /groups/new (US4.1).
 * On success the creator is already the owner and the group detail opens.
 */
export function useNewGroupForm() {
  const createGroup = useMutation(api.groups.create);
  const navigate = useNavigate();
  const [fields, setFields] = useState<NewGroupFields>(EMPTY_NEW_GROUP_FIELDS);
  const [errors, setErrors] = useState<NewGroupErrors>({ fieldErrors: {} });
  const [isSubmitting, setIsSubmitting] = useState(false);

  function setField(name: keyof NewGroupFields, value: string) {
    setFields((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({
      ...current,
      fieldErrors: { ...current.fieldErrors, [name]: undefined },
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const { args, errors: fieldErrors } = parseNewGroupFields(fields);
    setErrors({ fieldErrors });
    if (!args) {
      return;
    }

    setIsSubmitting(true);
    try {
      const groupId = await createGroup(args);
      navigate(`/groups/${groupId}`, { replace: true });
    } catch (error) {
      setErrors(getNewGroupErrors(error));
      setIsSubmitting(false);
    }
  }

  return { fields, errors, isSubmitting, setField, handleSubmit };
}
