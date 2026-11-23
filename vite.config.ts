import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: "edge-runtime",
    // Component tests (.test.tsx) opt into jsdom with `// @vitest-environment jsdom`.
    include: ["src/**/*.test.{ts,tsx}", "convex/**/*.test.ts"],
    server: { deps: { inline: ["convex-test"] } },
    // Convex Auth hashes passwords; with coverage on, a sign-in test can take 10+ s.
    testTimeout: 30_000,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}", "convex/**/*.ts"],
      exclude: [
        "convex/_generated/**",
        "**/*.test.{ts,tsx}",
        "**/*.d.ts",
        "src/main.tsx",
      ],
      // text: console, json-summary: CI job summary, html: report to browse.
      reporter: ["text", "json-summary", "html"],
      reportsDirectory: "coverage",
      // Floor just under today's numbers: the CI fails if coverage drops.
      thresholds: {
        lines: 50,
        branches: 85,
        functions: 75,
        "convex/**/*.ts": { lines: 90, branches: 85, functions: 90 },
      },
    },
  },
});
