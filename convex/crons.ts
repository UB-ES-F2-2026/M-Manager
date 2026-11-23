import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

/**
 * Scheduled jobs (US2.5).
 * Runs once per day in UTC; materializeDue matches rules by UTC civil day.
 */
const crons = cronJobs();

crons.daily(
  "materialize recurring transactions",
  { hourUTC: 4, minuteUTC: 0 },
  internal.recurring.materializeDue,
  {},
);

export default crons;
