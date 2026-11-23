// Turns coverage/coverage-summary.json (Vitest, json-summary reporter) into a
// Markdown table for the GitHub Actions job summary.
// Usage: node .github/scripts/coverage-summary.mjs >> "$GITHUB_STEP_SUMMARY"
import { readFileSync } from "node:fs";

const summary = JSON.parse(readFileSync("coverage/coverage-summary.json", "utf8"));
const METRICS = ["lines", "branches", "functions"];

/** Area of the codebase a file belongs to, so the table shows where tests are missing. */
function areaOf(file) {
  const path = file.split("\\").join("/");
  if (path.includes("/convex/lib/")) return "Backend · lògica pura (convex/lib)";
  if (path.includes("/convex/")) return "Backend · queries i mutations (convex)";
  if (path.endsWith(".tsx")) return "Frontend · components i pàgines (.tsx)";
  if (path.includes("/hooks/")) return "Frontend · hooks";
  return "Frontend · lògica (.ts)";
}

const areas = new Map();
for (const [file, metrics] of Object.entries(summary)) {
  if (file === "total") continue;
  const area = areas.get(areaOf(file)) ?? { files: 0, lines: [0, 0], branches: [0, 0], functions: [0, 0] };
  area.files += 1;
  for (const metric of METRICS) {
    area[metric][0] += metrics[metric].covered;
    area[metric][1] += metrics[metric].total;
  }
  areas.set(areaOf(file), area);
}

const percent = ([covered, total]) => (total === 0 ? "—" : `${((100 * covered) / total).toFixed(1)} %`);
const total = summary.total;
const totalFiles = [...areas.values()].reduce((sum, area) => sum + area.files, 0);

const rows = [
  "## Cobertura de tests",
  "",
  "| Àrea | Fitxers | Línies | Branques | Funcions |",
  "| --- | ---: | ---: | ---: | ---: |",
  ...[...areas.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, area]) => `| ${name} | ${area.files} | ${percent(area.lines)} | ${percent(area.branches)} | ${percent(area.functions)} |`),
  `| **Total** | **${totalFiles}** | **${total.lines.pct} %** | **${total.branches.pct} %** | **${total.functions.pct} %** |`,
  "",
  "L'informe HTML complet és a l'artefacte `coverage-report` d'aquesta execució.",
];

console.log(rows.join("\n"));
