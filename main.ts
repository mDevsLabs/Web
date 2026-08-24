/**
 * mAI — Val Town HTTP Proxy & Auth Backend
 * URL : https://mai.val.run/
 */

import { cors } from "npm:hono/cors";
import { Hono } from "npm:hono@4";
import { registerAuthRoutes } from "./auth.ts";
import { initSQLite } from "./config.ts";
import { registerDeviceRoutes } from "./devices.ts";
import { registerMiddleware } from "./api-middleware.ts";
import { registerModelRoutes } from "./models.ts";
import { registerProjectRoutes } from "./projects.ts";
import { registerStorageRoutes } from "./storage.ts";

// ─────────────────────────────────────────────
// Init DB SQLite en background
// ─────────────────────────────────────────────
initSQLite().catch(console.error);

// ─────────────────────────────────────────────
// App Hono
// ─────────────────────────────────────────────
const app = new Hono();

const ALLOWED_ORIGINS = [
  "https://mai-officiel.vercel.app",
  "https://mai-devs.vercel.app",
  "https://mai.val.run",
  "https://mdevslabs.github.io",
  "https://m-ai.fr",
  "https://www.m-ai.fr",
  "http://localhost:3000",
  "http://localhost:3001",
];

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
    ],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    exposeHeaders: ["Content-Type", "Authorization", "x-user-id"],
    maxAge: 86_400,
    origin: (origin) => {
      if (!origin) return "*"; // allow curl / mobile
      if (ALLOWED_ORIGINS.includes(origin)) return origin;
      // Allow vercel preview deployments
      if (origin.endsWith(".vercel.app")) return origin;
      return ALLOWED_ORIGINS[0];
    },
    credentials: true,
  })
);

// ─────────────────────────────────────────────
// ROUTE PAR DÉFAUT (Pour éviter le 404 en preview)
// ─────────────────────────────────────────────
app.get("/", (c) => c.text("mAI"));

// ─────────────────────────────────────────────
// Middleware & Routes modulaires
// ─────────────────────────────────────────────
registerMiddleware(app);
registerAuthRoutes(app);
registerStorageRoutes(app);
registerModelRoutes(app);
registerProjectRoutes(app);
registerDeviceRoutes(app);

export default app.fetch;
