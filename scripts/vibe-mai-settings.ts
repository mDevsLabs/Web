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
}
