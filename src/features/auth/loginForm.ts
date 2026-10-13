export type LoginValues = {
  email: string;
  password: string;
};

export type LoginField = keyof LoginValues;

export type LoginFieldErrors = Partial<Record<LoginField, string>>;

/** Router state set by RequireAuth when it sends a guest to /login. */
export type AuthRedirectState = { from: string };

export const LOGIN_MESSAGES = {
  required: "Aquest camp és obligatori",
  /** Generic on purpose: never reveal whether the email is registered. */
  invalidCredentials: {
    title: "Correu o contrasenya incorrectes",
    description: "Revisa les teves dades i torna-ho a provar.",
  },
  sessionRequired: {
    title: "Inicia sessió per continuar",
    description: "Necessites una sessió activa per veure aquesta secció.",
  },
} as const;

const AUTH_PATHS = ["/login", "/register"];

export function validateLoginForm(values: LoginValues): LoginFieldErrors {
  const errors: LoginFieldErrors = {};
  if (!values.email.trim()) {
    errors.email = LOGIN_MESSAGES.required;
  }
  if (!values.password) {
    errors.password = LOGIN_MESSAGES.required;
  }
  return errors;
}

/** Path the guest wanted to visit before being sent to /login, if any. */
export function getRedirectFrom(state: unknown): string | null {
  if (typeof state !== "object" || state === null || !("from" in state)) {
    return null;
  }
  const from = (state as { from: unknown }).from;
  if (typeof from !== "string" || !from.startsWith("/") || from.startsWith("//")) {
    return null;
  }
  if (AUTH_PATHS.some((path) => from === path || from.startsWith(`${path}?`))) {
    return null;
  }
  return from;
}

export function getPostLoginPath(state: unknown): string {
  return getRedirectFrom(state) ?? "/";
}
