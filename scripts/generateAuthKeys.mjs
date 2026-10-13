/**
 * Generates JWT_PRIVATE_KEY and JWKS for Convex Auth.
 * After `npx convex login` and `npx convex dev`, run:
 *   node scripts/generateAuthKeys.mjs
 * Then set both values with:
 *   npx convex env set JWT_PRIVATE_KEY "<value>"
 *   npx convex env set JWKS "<value>"
 *
 * Or simply run: npx @convex-dev/auth
 */
import { exportJWK, exportPKCS8, generateKeyPair } from "jose";

const keys = await generateKeyPair("RS256", { extractable: true });
const privateKey = await exportPKCS8(keys.privateKey);
const publicKey = await exportJWK(keys.publicKey);
const jwks = JSON.stringify({ keys: [{ use: "sig", ...publicKey }] });

process.stdout.write(
  `JWT_PRIVATE_KEY="${privateKey.trimEnd().replace(/\n/g, " ")}"\n`,
);
process.stdout.write(`JWKS=${jwks}\n`);
