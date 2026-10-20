import { ConvexCredentials } from "@convex-dev/auth/providers/ConvexCredentials";
import {
  createAccount,
  convexAuth,
  retrieveAccount,
} from "@convex-dev/auth/server";
import type { GenericActionCtx } from "convex/server";
import { Scrypt } from "lucia";
import type { DataModel } from "./_generated/dataModel";
import {
  assertValidEmail,
  assertValidPassword,
  throwEmailTaken,
  throwInvalidCredentials,
  validateSignUpProfile,
} from "./lib/validation";

const PASSWORD_PROVIDER = "password";

/**
 * Email + password auth via Convex Auth.
 *
 * Same behaviour as the built-in Password provider for sign-up / sign-in,
 * plus structured app errors:
 * - EMAIL_TAKEN on sign-up when the email already has an account (US1.1 AC2)
 * - INVALID_CREDENTIALS on sign-in when email/password do not match (US1.2 AC2)
 *
 * We use ConvexCredentials so we can await DB checks — Password's profile()
 * is not awaited by the library.
 *
 * Sign-up:  signIn("password", { name, email, password, flow: "signUp" })
 * Sign-in:  signIn("password", { email, password, flow: "signIn" })
 */
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    ConvexCredentials<DataModel>({
      id: PASSWORD_PROVIDER,
      authorize: async (params, ctx) => {
        const flow = params.flow;
        if (flow !== "signUp" && flow !== "signIn") {
          throw new Error(
            'Missing `flow` param, it must be "signUp" or "signIn"',
          );
        }

        if (typeof params.password !== "string") {
          throw new Error(`Missing \`password\` param for \`${flow}\` flow`);
        }
        const secret = params.password;

        if (flow === "signUp") {
          assertValidPassword(secret);
        }

        const profile =
          flow === "signUp"
            ? validateSignUpProfile({
                name: params.name,
                email: params.email,
              })
            : { email: assertValidEmail(params.email) };
        const { email } = profile;

        if (flow === "signUp") {
          // Without a secret, retrieveAccount only checks that the account id exists.
          if (await passwordAccountExists(ctx, email)) {
            throwEmailTaken();
          }

          const created = await createAccount(ctx, {
            provider: PASSWORD_PROVIDER,
            account: { id: email, secret },
            profile,
            shouldLinkViaEmail: false,
            shouldLinkViaPhone: false,
          });
          return { userId: created.user._id };
        }

        try {
          const retrieved = await retrieveAccount(ctx, {
            provider: PASSWORD_PROVIDER,
            account: { id: email, secret },
          });
          return { userId: retrieved.user._id };
        } catch (error) {
          // Never reveal whether the email or the password was wrong.
          if (isAuthCredentialFailure(error)) {
            throwInvalidCredentials();
          }
          throw error;
        }
      },
      crypto: {
        async hashSecret(password: string) {
          return await new Scrypt().hash(password);
        },
        async verifySecret(password: string, hash: string) {
          return await new Scrypt().verify(hash, password);
        },
      },
    }),
  ],
});

/** True when a password account already exists for this email. */
async function passwordAccountExists(
  ctx: GenericActionCtx<DataModel>,
  email: string,
): Promise<boolean> {
  try {
    await retrieveAccount(ctx, {
      provider: PASSWORD_PROVIDER,
      account: { id: email },
    });
    return true;
  } catch (error) {
    if (error instanceof Error && error.message === "InvalidAccountId") {
      return false;
    }
    throw error;
  }
}

/** Auth library failures that mean “wrong email or password” (or rate limit). */
function isAuthCredentialFailure(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  return (
    error.message === "InvalidAccountId" ||
    error.message === "InvalidSecret" ||
    error.message === "TooManyFailedAttempts"
  );
}
