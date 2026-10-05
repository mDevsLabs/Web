import type { Hono } from "npm:hono@4";
import {
  blacklistToken,
  clientIp,
  extractToken,
  getDb,
  parseUserAgent,
} from "./config.ts";

export function registerDeviceRoutes(app: Hono) {
  async function revokeDeviceTokens(tokens: unknown[]): Promise<void> {
    for (const row of tokens) {
      const token = String((row as any)?.token || "").trim();
      if (token && !(await blacklistToken(token))) {
        throw new Error("token blacklist unavailable");
      }
    }
  }

  // GET /v1/devices
  app.get("/v1/devices", async (c) => {
    const userId = (c as any).get("userId") as string | null;
    const token = extractToken(c.req.raw);
    if (!userId || !token) {
      return c.json({ error: "Non authentifié." }, 401);
    }
    const sql = getDb();

    const existing =
      await sql`SELECT id FROM connected_devices WHERE token = ${token} AND user_id::text = ${userId}::text`;
    if (existing.length === 0) {
      const userAgent = c.req.header("user-agent") || "";
      const ip = clientIp(c);
      const { os, device_model, device_version, device_name } =
        parseUserAgent(userAgent);
      try {
        await sql`
          INSERT INTO connected_devices (user_id, token, os, device_model, device_version, ip_address, device_name)
          VALUES (${userId}::text, ${token}, ${os}, ${device_model}, ${device_version}, ${ip}, ${device_name})
        `;
      } catch {
        console.error("[Devices] auto-insert failed");
      }
    } else {
      try {
        await sql`UPDATE connected_devices SET last_active = NOW() WHERE token = ${token} AND user_id::text = ${userId}::text`;
      } catch {
        // La mise à jour d'activité est best-effort.
      }
    }

    const rawDevices = await sql`
      SELECT id, token, os, device_model, device_version, ip_address, device_name, last_active, created_at 
      FROM connected_devices 
      WHERE user_id = ${userId}::text 
      ORDER BY last_active DESC
    `;

    const devices = rawDevices.map((d: any) => ({
      created_at: d.created_at,
      device_model: d.device_model,
      device_name: d.device_name,
      device_version: d.device_version || "",
      id: d.id,
      ip_address: d.ip_address,
      is_current: d.token === token,
      last_active: d.last_active,
      os: d.os,
    }));

    return c.json({ devices, success: true });
  });

  // DELETE /v1/devices/others
  app.delete("/v1/devices/others", async (c) => {
    const userId = (c as any).get("userId") as string | null;
    const token = extractToken(c.req.raw);
    if (!userId || !token) {
      return c.json({ error: "Non authentifié." }, 401);
    }

    try {
      const sql = getDb();
      const otherDevices = await sql`
        SELECT token FROM connected_devices
        WHERE user_id = ${userId}::text AND token != ${token}
      `;

      await revokeDeviceTokens(otherDevices);
      await sql`
        DELETE FROM connected_devices
        WHERE user_id = ${userId}::text AND token != ${token}
      `;

      return c.json({
        message: "Tous les autres appareils ont été déconnectés.",
        success: true,
      });
    } catch {
      console.error("[Devices] unable to revoke other devices");
      return c.json({ error: "Impossible de déconnecter les appareils." }, 503);
    }
  });

  // DELETE /v1/devices/all
  app.delete("/v1/devices/all", async (c) => {
    const userId = (c as any).get("userId") as string | null;
    const token = extractToken(c.req.raw);
    if (!userId || !token) {
      return c.json({ error: "Non authentifié." }, 401);
    }

    try {
      const sql = getDb();
      const allDevices = await sql`
        SELECT token FROM connected_devices
        WHERE user_id = ${userId}::text
      `;

      await revokeDeviceTokens(allDevices);
      await sql`
        DELETE FROM connected_devices
        WHERE user_id = ${userId}::text
      `;

      return c.json({
        message: "Tous les appareils ont été déconnectés.",
        success: true,
      });
    } catch {
      console.error("[Devices] unable to revoke devices");
      return c.json({ error: "Impossible de déconnecter les appareils." }, 503);
    }
  });

  // PUT /v1/devices/:id
  app.put("/v1/devices/:id", async (c) => {
    const userId = (c as any).get("userId") as string | null;
    const token = extractToken(c.req.raw);
    if (!userId || !token) {
      return c.json({ error: "Non authentifié." }, 401);
    }

    const body = await c.req.json().catch(() => ({} as any));
    const deviceName = String(body?.device_name || "").trim();
    if (!deviceName || deviceName.length > 120) {
      return c.json({ error: "Nom d'appareil invalide." }, 400);
    }

    const deviceId = c.req.param("id");
    const sql = getDb();
    await sql`UPDATE connected_devices SET device_name = ${deviceName} WHERE id = ${deviceId} AND user_id = ${userId}::text`;
    return c.json({ success: true });
  });

  // DELETE /v1/devices/:id
  app.delete("/v1/devices/:id", async (c) => {
    const userId = (c as any).get("userId") as string | null;
    const currentToken = extractToken(c.req.raw);
    if (!userId || !currentToken) {
      return c.json({ error: "Non authentifié." }, 401);
    }

    try {
      const deviceId = c.req.param("id");
      const sql = getDb();
      const devices =
        await sql`SELECT token FROM connected_devices WHERE id = ${deviceId} AND user_id = ${userId}::text LIMIT 1`;
      if (devices.length > 0) {
        await revokeDeviceTokens(devices);
        await sql`DELETE FROM connected_devices WHERE id = ${deviceId} AND user_id = ${userId}::text`;
      }
      return c.json({ success: true });
    } catch {
      console.error("[Devices] unable to revoke device");
      return c.json({ error: "Impossible de déconnecter l'appareil." }, 503);
    }
  });
}
