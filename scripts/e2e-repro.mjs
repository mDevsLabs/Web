/**
 * Reproduction e2e des modes Chat et Agent contre un serveur local (dev ou prod).
 * Usage : node scripts/e2e-repro.mjs [port]   (défaut 3000)
 *
 * - Forge un cookie de session signé avec MAI_JWT_SECRET (le même mécanisme
 *   que la connexion réelle, uniquement pour un test local).
 * - GET  /api/models  : vérifie la chaîne clé API + tier + catalogue.
 * - POST /api/chat    : vérifie la chaîne contexte DB + flux modèle.
 * - POST /api/agent   : vérifie la chaîne run agent + réponse modèle.
 */
import postgres from "postgres";
import "dotenv/config";

const PORT = process.argv[2] || "3000";
const BASE = `http://localhost:${PORT}`;

const rawDbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
const dbUrl = rawDbUrl.replace(/[?&]sslmode=[^&]*/g, "");

// 1. Session de test (utilisateur réel id=1, tier free, quota large)
const secret = process.env.MAI_JWT_SECRET;
if (!secret) {
  console.error(
    "MAI_JWT_SECRET absent du .env — impossible de forger la session de test"
  );
  process.exit(1);
}

const header = Buffer.from(
  JSON.stringify({ alg: "HS256", typ: "JWT" })
).toString("base64url");
const now = Math.floor(Date.now() / 1000);
const payload = Buffer.from(
  JSON.stringify({
    email: "test@mai.local",
    exp: now + 3600,
    iat: now,
    id: "1",
    limit: 1_000_000,
    resetAt: new Date(Date.now() + 7 * 864e5).toISOString(),
    sub: "1",
    tier: "free",
    tokensUsed: 0,
  })
).toString("base64url");
const { createHmac } = await import("node:crypto");
const hmac = createHmac("sha256", secret)
  .update(`${header}.${payload}`)
  .digest("base64url");
const token = `${header}.${payload}.${hmac}`;
const cookie = `mai_session_token=${token}`;

async function call(path, init = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      cookie,
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  return { status: res.status, text: text.slice(0, 900) };
}

// 2. /api/models — chaîne clé API/tier/catalogue
const models = await call("/api/models");
console.log(`[/api/models] ${models.status} :: ${models.text.slice(0, 220)}`);

// 3. POST /api/chat — contexte DB + flux modèle
const chatId = crypto.randomUUID();
const chatBody = {
  id: chatId,
  message: {
    id: crypto.randomUUID(),
    parts: [{ text: "Réponds juste OK", type: "text" }],
    role: "user",
  },
  selectedChatMode: "chat",
  selectedChatModel: process.env.E2E_MODEL || "",
  selectedVisibilityType: "private",
};
const chat = await call("/api/chat", {
  body: JSON.stringify(chatBody),
  method: "POST",
});
console.log(`[/api/chat] ${chat.status} :: ${chat.text.slice(0, 300)}`);

// 4. POST /api/agent — run agent
const agentBody = {
  id: crypto.randomUUID(),
  message: {
    id: crypto.randomUUID(),
    parts: [{ text: "Réponds juste OK", type: "text" }],
    role: "user",
  },
  modelId: process.env.E2E_MODEL || "google/gemini-2.5-flash",
  visibility: "private",
};
const agent = await call("/api/agent", {
  body: JSON.stringify(agentBody),
  method: "POST",
});
console.log(`[/api/agent] ${agent.status} :: ${agent.text.slice(0, 300)}`);

// 5. Nettoyage des données de diagnostic (chat de test)
try {
  const sql = postgres(dbUrl, { max: 1, prepare: false });
  await sql`DELETE FROM "Chat" WHERE id = ${chatId}`;
  await sql.end();
} catch (e) {
  console.warn(`[cleanup] ${e.message}`);
}
