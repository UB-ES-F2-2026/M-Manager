import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";

/** Returns the signed-in user's public profile, or null if logged out. */
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }

    const user = await ctx.db.get(userId);
    if (user === null) {
      return null;
    }

    return {
      _id: user._id,
      name: user.name ?? "",
      email: user.email ?? "",
    };
  },
});
