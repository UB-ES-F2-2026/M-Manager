import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import type { DataModel } from "./_generated/dataModel";
import {
  assertValidEmail,
  assertValidName,
  assertValidPassword,
} from "./lib/validation";

/**
 * US1.1 — email + password registration via Convex Auth.
 * Frontend calls: signIn("password", { name, email, password, flow: "signUp" })
 */
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password<DataModel>({
      profile(params) {
        const email = assertValidEmail(params.email);
        const name = assertValidName(params.name);
        return { email, name };
      },
      validatePasswordRequirements(password) {
        assertValidPassword(password);
      },
    }),
  ],
});
