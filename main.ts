/**
 * mAI — Backend & API Routes
 * Base URL : https://mai.val.run
 */

import { cors } from "npm:hono/cors";
import { Hono } from "npm:hono@4";
import { registerAuthRoutes } from "./auth.ts";
import { registerAudioRoutes } from "./audio.ts";
import { initSQLite } from "./config.ts";
import { registerDeviceRoutes } from "./devices.ts";
import { registerImageRoutes } from "./images.ts";
import { registerMaiTranslateRoutes } from "./mai-translate.ts";
import { registerMiddleware } from "./api-middleware.ts";
import { registerModelRoutes } from "./models.ts";
import { registerProjectRoutes } from "./projects.ts";
import { registerRealtimeRoutes } from "./realtime.ts";
import { registerStorageRoutes } from "./storage.ts";
import { registerTranslateRoutes } from "./translate.ts";
import { registerVibeAIRoutes } from "./vibe-ai.ts";
import { registerVibeRoutes } from "./vibe.ts";
import { registerWebRoutes } from "./web.ts";

// ─────────────────────────────────────────────
// Init DB SQLite en background
// ─────────────────────────────────────────────
initSQLite().catch(console.error);

// ─────────────────────────────────────────────
// App Hono
// ─────────────────────────────────────────────
const app = new Hono();

// ─────────────────────────────────────────────
// CORS ouvert : toutes les origines acceptées (tests local / preview / prod temporaire)
// ─────────────────────────────────────────────

app.use(
  "*",
  cors({
    origin: "*",
    // "*" impose credentials: false (spec navigateur). Le frontend
    // utilise Authorization Bearer (src/services/api.ts), pas de cookies.
    credentials: false,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
    allowHeaders: [
      // Standards fetch / navigateur
      "Accept",
      "Accept-Language",
      "Content-Language",
      "Content-Type",
      "Content-Length",
      "Content-Disposition",
      "Range",
      "Origin",
      "Referer",
      "X-Requested-With",
      "DNT",
      "Cache-Control",
      "Pragma",
      "Expires",
      "If-Modified-Since",
      "If-None-Match",
      "If-Match",
      // Auth / API maison (api-middleware.ts, audio.ts, images.ts)
      "Authorization",
      "x-user-id",
      "X-User-Id",
      "x-api-key",
      "X-API-Key",
      "x-goog-api-key",
      "X-Goog-Api-Key",
      // Custom app (web.ts)
      "x-web-search",
      "X-Web-Search",
      "x-disable-web-search",
      "X-Disable-Web-Search",
      // SDK Anthropic / OpenAI / OpenRouter compatibles
      "anthropic-version",
      "anthropic-beta",
      "anthropic-dangerous-direct-browser-access",
      "OpenAI-Organization",
      "OpenAI-Project",
      "X-Title",
      "HTTP-Referer",
      "X-Request-Id",
      "X-Client-Info",
      "apikey",
      "x-client-version",
      "x-app-version",
      "X-Stripe-Signature",
    ],
    exposeHeaders: [
      "Content-Type",
      "Authorization",
      "x-user-id",
      "x-audio-id",
      "x-speech-limit",
      "x-speech-used",
      "x-tokens-used",
      "Content-Length",
      "Content-Range",
      "ETag",
    ],
    maxAge: 86_400,
  })
);

// Filet preflight explicite : répond 204 avant l'auth (local / preview / SDK).
app.options("*", (c) => c.text("", 204));

app.use("*", async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("X-Frame-Options", "DENY");
  c.header("Permissions-Policy", "camera=(), geolocation=(), microphone=(self)");
});

// ─────────────────────────────────────────────
// ROUTE RACINE : mAI UNIQUEMENT (URL de base de l'API)
// ─────────────────────────────────────────────
app.get("/", (c) => c.text("mAI"));
app.get("/api", (c) => c.text("mAI"));
app.get("/api/", (c) => c.text("mAI"));
app.get("/v1", (c) => c.text("mAI"));
app.get("/v1/", (c) => c.text("mAI"));
app.get("/vibe", (c) => c.text("mAI"));
app.get("/vibe/", (c) => c.text("mAI"));
app.get("/api/vibe", (c) => c.text("mAI"));
app.get("/api/vibe/", (c) => c.text("mAI"));

// ─────────────────────────────────────────────
// Middleware & Routes modulaires
// ─────────────────────────────────────────────
registerMiddleware(app);
registerAuthRoutes(app);
registerStorageRoutes(app);
registerModelRoutes(app);
registerImageRoutes(app);
registerAudioRoutes(app);
registerWebRoutes(app);
registerProjectRoutes(app);
registerDeviceRoutes(app);
registerRealtimeRoutes(app);
registerVibeAIRoutes(app);
registerTranslateRoutes(app);
registerMaiTranslateRoutes(app);
registerVibeRoutes(app);

export default app.fetch;
