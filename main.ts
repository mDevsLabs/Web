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
import { registerMiddleware } from "./api-middleware.ts";
import { registerModelRoutes } from "./models.ts";
import { registerProjectRoutes } from "./projects.ts";
import { registerStorageRoutes } from "./storage.ts";
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
// CORS strict par allowlist + headers de sécurité
// ─────────────────────────────────────────────
const ALLOWED_ORIGINS = new Set([
  "https://mai-vibe.vercel.app",
  "https://mai-vibe-git-main-mcompany.vercel.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "capacitor://localhost",
  "https://localhost",
]);

app.use(
  "*",
  cors({
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "x-user-id",
      "x-api-key",
      "X-User-Id",
      "X-API-Key",
      "x-web-search",
      "X-Web-Search",
      "x-disable-web-search",
      "X-Disable-Web-Search",
      "x-goog-api-key",
      "X-Goog-Api-Key",
      "anthropic-version",
      "anthropic-beta",
    ],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    exposeHeaders: ["Content-Type", "Authorization", "x-user-id"],
    maxAge: 86_400,
    // Rejette toute origine non autorisée (au lieu de la refléter avec credentials)
    origin: (origin) => {
      if (!origin) return null;
      if (ALLOWED_ORIGINS.has(origin)) return origin;
      if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return origin;
      if (/^https:\/\/mai-vibe[a-z0-9-]*\.vercel\.app$/.test(origin)) return origin;
      return null;
    },
    credentials: true,
  })
);

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
registerVibeRoutes(app);

export default app.fetch;
