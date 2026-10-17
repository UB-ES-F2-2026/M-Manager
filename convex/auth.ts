import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import type { DataModel } from "./_generated/dataModel";
import {
  assertValidEmail,
  assertValidName,
  assertValidPassword,
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
        const email = assertValidEmail(params.email);
        // Name is only collected on registration; login must not require it.
        if (params.flow === "signUp") {
          const name = assertValidName(params.name);
          return { email, name };
        }
        return { email };
      },
      validatePasswordRequirements(password) {
        assertValidPassword(password);
      },
    }),
  ],
});
