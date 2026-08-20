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
      "*",
    ],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    exposeHeaders: ["Content-Type", "Authorization", "x-user-id"],
    maxAge: 86_400,
    origin: "*",
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
