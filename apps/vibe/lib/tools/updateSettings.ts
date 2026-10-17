/**
 * Outil mAI — Modifier les paramètres (SENSIBLE, approbation requise).
 * Délègue à MAIAgentFleet.executeTool. Catalogue : id "update_settings".
 */
import { MAIAgentFleet } from "../../vibe-mai-fleet.ts";

export interface UpdateSettingsArgs {
  [key: string]: unknown;
}

export async function execute(userId: number | string, args: UpdateSettingsArgs) {
  return MAIAgentFleet.executeTool("update_settings", args, userId);
}

export const declaration = {
  name: "update_settings",
  description: "Modifie les paramètres autorisés de l'utilisateur (thème, langue, fil, mAI).",
  parameters: {
    type: "object",
    properties: {
      theme_preference: { type: "string", enum: ["light", "dark", "auto"] },
      ui_language: { type: "string" },
      feed_default_mode: { type: "string", enum: ["for_you", "following", "trending"] },
      mai_default_model: { type: "string" },
      mai_auto_approve_tools: { type: "boolean" },
    },
  },
};
