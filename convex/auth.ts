import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import type { DataModel } from "./_generated/dataModel";
import {
  assertValidEmail,
  assertValidPassword,
  validateSignUpProfile,
} from "./lib/validation";

/**
 * Email + password auth via Convex Auth.
 *
 * Sign-up:  signIn("password", { name, email, password, flow: "signUp" })
 * Sign-in:  signIn("password", { email, password, flow: "signIn" })
 */
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password<DataModel>({
      profile(params) {
        // Name is only collected on registration; login must not require it.
        if (params.flow === "signUp") {
          return validateSignUpProfile({
            name: params.name,
            email: params.email,
          });
        }
        return { email: assertValidEmail(params.email) };
      },
      validatePasswordRequirements(password) {
        assertValidPassword(password);
      },
    }),
  ],
});
