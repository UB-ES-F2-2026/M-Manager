// Runs `vitest run --coverage` with the Windows drive letter in upper case.
// A terminal opened as "c:\..." makes V8 report every file twice ("c:" and "C:"),
// which halves the percentages and breaks the thresholds. Linux/macOS: no change.
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const cwd = process.cwd().replace(/^[a-z]:/, (drive) => drive.toUpperCase());
const vitest = join(cwd, "node_modules", "vitest", "vitest.mjs");

const result = spawnSync(process.execPath, [vitest, "run", "--coverage", ...process.argv.slice(2)], {
  cwd,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
