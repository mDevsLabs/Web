/**
 * ============================================================================
 * VIBE — LECTURE RÉGLAGES (lib/vibe/server/queries/settings.ts)
 * ============================================================================
 *
 * Réplique du `handleSettings` de `GET /v1/settings` (`vibe-settings.ts:173-199`)
 * SANS son `ensurePersonalizationColumns()` : le backend ajoute ses colonnes à
 * la volée, la politique de l'hôte est lecture seule (`docs/1-web/AGENTS.md`
 * § 6.2). Le SELECT est donc construit depuis les colonnes réellement
 * présentes (sonde `information_schema`), et les clés attendues par le client
 * complétées par les mêmes défauts que le handler
 * (`vibe-settings.ts:36-46`) pour un résultat identique.
 *
 * Point sensible : un nouvel utilisateur n'a AUCUNE ligne `user_settings`.
 * L'API répond alors `{ settings: {} }` et c'est précisément ce qui cassait
 * l'onboarding (comparaison `=== false`). Ici on renvoie `{}` de même, et
 * c'est le consommateur qui interprète `onboarding_completed !== true`.
 */
import "server-only";
import { vibeSql } from "../db";
import type { VibeIdentity } from "../identity";
import { columnExists, tableExists } from "../schema";

/** Clés optionnelles ajoutées paresseusement par le backend — défauts du handler. */
const OPTIONAL_DEFAULTS: Record<string, unknown> = {
  ai_generated_badge: false,
  comment_privacy: "everyone",
  dm_auto_translate: false,
  hide_verified_badge: false,
  mai_daily_reminder: true,
  mai_enabled_tools: null,
  mai_weekly_report: true,
  onboarding_completed: false,
  personalization_enabled: true,
  repost_privacy: "everyone",
};

export async function readSettings(
  identity: VibeIdentity
): Promise<Record<string, unknown> | null> {
  const sql = vibeSql();
  if (!sql) {
    return null;
  }
  const userId = Number(identity.userId);
  if (!Number.isFinite(userId)) {
    return null;
  }

  if (!(await tableExists("user_settings"))) {
    return null;
  }

  const rows = await sql`
    SELECT * FROM user_settings WHERE user_id = ${userId} LIMIT 1
  `;
  // Pas de ligne = nouvel utilisateur. L'API répondait alors `{ settings: {} }`
  // — ce qui rendait l'onboarding invisible. On émet les défauts des colonnes
  // (ce que la première INSERT obtiendrait grâce à leurs DEFAULT), y compris
  // `onboarding_completed: false`, pour que le client lise un état complet.
  const settings: Record<string, unknown> = rows.length
    ? { ...rows[0] }
    : { ...OPTIONAL_DEFAULTS };

  if (rows.length) {
    for (const [key, fallback] of Object.entries(OPTIONAL_DEFAULTS)) {
      if (
        settings[key] === undefined &&
        (await columnExists("user_settings", key))
      ) {
        // Colonne présente, valeur null : le handler l'aurait renvoyée telle quelle.
        settings[key] = fallback;
      }
    }
  }

  if (!settings.default_vibe_audience) {
    let audience: unknown = null;
    if (await tableExists("vibe_audience_preferences")) {
      const prefRows = await sql`
        SELECT default_audience FROM vibe_audience_preferences
        WHERE user_id = ${userId} LIMIT 1
      `.catch(() => []);
      audience = prefRows[0]?.default_audience || null;
    }
    settings.default_vibe_audience = audience || "public";
  }

  return settings;
}
