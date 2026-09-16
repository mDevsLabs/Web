/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — mAI : QUOTAS, MODULATION & OUTILS
 * (vibe-mai-settings.ts)
 * Quotas hebdomadaires, modulation de texte, catalogue des outils mAI et
 * mise à jour des outils activés (Paramètres → Outils mAI).
 * Scindé de vibe-mai.ts (limite de taille Val Town).
 * ============================================================================
 */

import type { Hono } from "npm:hono@4";
import { extractToken, getDb, verifyToken } from "./config.ts";
import type { RegisterMultiFn } from "./vibe-common.ts";
import { MAIAgentFleet } from "./vibe-mai-fleet.ts";
import {
  getToolDeclarations,
  invalidateUserToolsCache,
  loadUserEnabledTools,
  MAI_CATALOG_VERSION,
  MAI_TOOLS_CATALOG,
} from "./vibe-tools.ts";

export function registerVibeMAISettingsRoutes(
  app: Hono,
  registerMulti: RegisterMultiFn
) {
  // 2. mAI QUOTAS
  const handleMAIQuotas = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);

      const res = await MAIAgentFleet.executeTool("check_quotas", {}, userId);
      return c.json(res.result);
    } catch {
      return c.json({ error: "Erreur quotas." }, 500);
    }
  };

  registerMulti(
    "get",
    ["/api/vibe/mai/quotas", "/vibe/mai/quotas", "/v1/mai/quotas"],
    handleMAIQuotas
  );

  // 3. mAI MODULATE
  const handleMAIModulate = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      await verifyToken(token);

      const { text, tone = "executive" } = await c.req.json();
      const modulated = await MAIAgentFleet.modulateText({ text, tone });
      return c.json({ modulated, success: true });
    } catch {
      return c.json({ error: "Erreur modulation." }, 500);
    }
  };

  registerMulti(
    "post",
    ["/api/vibe/mai/modulate", "/vibe/mai/modulate", "/v1/mai/modulate"],
    handleMAIModulate
  );

  // 4. CATALOGUE DES OUTILS mAI (vibe-tools.ts, filtré par réglages)
  const handleMAITools = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      let enabledIds: string[] | undefined;
      if (token) {
        try {
          const payload = await verifyToken(token);
          enabledIds = await loadUserEnabledTools(
            Number(payload.sub || (payload as any).id)
          );
        } catch {}
      }
      const tools = getToolDeclarations(enabledIds);
      return c.json({
        catalog_version: MAI_CATALOG_VERSION,
        tools,
        version: (MAI_TOOLS_CATALOG as any[]).length,
      });
    } catch {
      return c.json({ error: "Erreur catalogue outils." }, 500);
    }
  };
  registerMulti(
    "get",
    ["/api/vibe/mai/tools", "/vibe/mai/tools", "/v1/mai/tools"],
    handleMAITools
  );

  // 5. MISE À JOUR DES OUTILS ACTIVÉS (Paramètres → Outils mAI)
  const handleUpdateMAITools = async (c: any) => {
    try {
      const token = extractToken(c.req.raw);
      if (!token) return c.json({ error: "Non authentifié." }, 401);
      const payload = await verifyToken(token);
      const userId = Number(payload.sub || (payload as any).id);
      const body = await c.req.json().catch(() => ({}));
      const ids = Array.isArray(body?.enabled_tool_ids)
        ? Array.from(new Set(body.enabled_tool_ids.map(String)))
        : [];
      const validIds = new Set(
        MAI_TOOLS_CATALOG.filter((t) => t.enabled).map((t) => t.id)
      );
      const filtered = ids.filter((id) => validIds.has(id));
      const sql = getDb();
      await sql`ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS mai_enabled_tools JSONB DEFAULT NULL`.catch(
        () => {}
      );
      await sql`
        INSERT INTO user_settings (user_id, mai_enabled_tools) VALUES (${userId}, ${JSON.stringify(filtered)}::jsonb)
        ON CONFLICT (user_id) DO UPDATE SET mai_enabled_tools = ${JSON.stringify(filtered)}::jsonb, updated_at = NOW()
      `;
      invalidateUserToolsCache(userId);
      return c.json({
        count: filtered.length,
        enabled_tool_ids: filtered,
        success: true,
      });
    } catch {
      return c.json({ error: "Erreur sauvegarde outils mAI." }, 500);
    }
  };
  registerMulti(
    "post",
    ["/api/vibe/mai/tools", "/vibe/mai/tools", "/v1/mai/tools"],
    handleUpdateMAITools
  );
}
