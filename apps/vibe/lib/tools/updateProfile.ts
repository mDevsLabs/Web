/**
 * Outil mAI — Modifier le profil (SENSIBLE, approbation requise).
 * Délègue à MAIAgentFleet.executeTool. Catalogue : id "update_profile".
 */
import { MAIAgentFleet } from "../../vibe-mai-fleet.ts";

export interface UpdateProfileArgs {
  display_name?: string;
  bio?: string;
}

export async function execute(userId: number | string, args: UpdateProfileArgs) {
  return MAIAgentFleet.executeTool("update_profile", args, userId);
}

export const declaration = {
  name: "update_profile",
  description: "Met à jour le profil Vibe (nom affiché et/ou bio).",
  parameters: {
    type: "object",
    properties: {
      display_name: { type: "string", description: "Nouveau nom affiché (2-40 caractères)" },
      bio: { type: "string", description: "Nouvelle bio (max 200 caractères)" },
    },
  },
};
