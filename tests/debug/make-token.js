// Utilitaire de debug local : forge un JWT HS256 signé avec MAI_JWT_SECRET /
// JWT_SECRET du .env, avec les claims attendus par lib/auth/session.ts.
// Usage : node tests/debug/make-token.js
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function loadDotEnv(path) {
  try {
    const raw = readFileSync(path, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {}
}

loadDotEnv(".env");
loadDotEnv(".env.local");

const secret = process.env.MAI_JWT_SECRET || process.env.JWT_SECRET || "";
if (!secret) {
  console.error("NO_SECRET");
  process.exit(1);
}

const claims = {
  email: "debug-user@example.com",
  exp: Math.floor(Date.now() / 1000) + 3600,
  id: "debug-user-1234",
  limit: 100_000,
  tier: "Free",
  tokensUsed: 0,
  username: "debug-user",
};

const b64url = (buf) =>
  Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/[=]+$/, "");
const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
const payload = b64url(JSON.stringify(claims));
const data = `${header}.${payload}`;
const signature = b64url(
  require("crypto").createHmac("sha256", secret).update(data).digest()
);
console.log(`${data}.${signature}`);
