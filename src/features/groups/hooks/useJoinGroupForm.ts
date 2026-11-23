import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../../../convex/_generated/api";
import {
  ALREADY_MEMBER_MESSAGE,
  INVALID_GROUP_CODE_MESSAGE,
  isValidGroupCode,
  normalizeGroupCode,
} from "../../../../convex/lib/groupCodes";

/** Time to read «Ja formes part d'aquest grup.» before the group detail opens. */
export const ALREADY_MEMBER_REDIRECT_MS = 1500;

export type FormAlertMessage = {
  title: string;
  description: string;
};

/** Shown when the backend fails for a reason that is not a bad code. */
export const JOIN_ERROR_ALERT: FormAlertMessage = {
  title: "No t'has pogut unir al grup",
  description: "Torna-ho a provar d'aquí a una estona.",
};

export type JoinGroupErrors = {
  codeError?: string;
  alert?: FormAlertMessage;
};

/** The code to send to `groups.join`, or an error if it cannot be a group code. */
export function parseJoinCode(input: string): { code: string | null; error?: string } {
  const code = normalizeGroupCode(input);
  if (!isValidGroupCode(code)) {
    return { code: null, error: INVALID_GROUP_CODE_MESSAGE };
  }
  return { code };
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

/** Turns an error from `groups.join` into messages for the form. */
export function getJoinGroupErrors(error: unknown): JoinGroupErrors {
  if (error instanceof ConvexError && isCodedError(error.data)) {
    if (error.data.code === "INVALID_CODE") {
      return { codeError: error.data.message };
    }
  }
  return { alert: JOIN_ERROR_ALERT };
}

/**
 * Form state and submit logic for /groups/join (US4.1 AC3).
 * `?code=` from an invite link fills the field in.
 */
export function useJoinGroupForm() {
  const joinGroup = useMutation(api.groups.join);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(() => normalizeGroupCode(searchParams.get("code") ?? ""));
  const [errors, setErrors] = useState<JoinGroupErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const timeoutId = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timeoutId.current), []);

  function changeCode(value: string) {
    setCode(value.toUpperCase());
    setErrors({});
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = parseJoinCode(code);
    if (parsed.code === null) {
      setErrors({ codeError: parsed.error });
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      const { groupId, alreadyMember } = await joinGroup({ code: parsed.code });
      if (alreadyMember) {
        setNotice(ALREADY_MEMBER_MESSAGE);
        timeoutId.current = window.setTimeout(
          () => navigate(`/groups/${groupId}`, { replace: true }),
          ALREADY_MEMBER_REDIRECT_MS,
        );
        return;
      }
      navigate(`/groups/${groupId}`, { replace: true });
    } catch (error) {
      setErrors(getJoinGroupErrors(error));
      setIsSubmitting(false);
    }
  }

  return { code, errors, isSubmitting, notice, changeCode, handleSubmit };
}
