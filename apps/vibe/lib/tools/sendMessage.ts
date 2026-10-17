/**
 * Outil mAI — Envoyer un DM (SENSIBLE, approbation requise).
 * Délègue à MAIAgentFleet.executeTool. Catalogue : id "send_message".
 */
import { MAIAgentFleet } from "../../vibe-mai-fleet.ts";

export interface SendMessageArgs {
  username: string;
  content: string;
}

export async function execute(userId: number | string, args: SendMessageArgs) {
  return MAIAgentFleet.executeTool("send_message", args, userId);
}

export const declaration = {
  name: "send_message",
  description: "Envoie un message privé (DM) à un utilisateur Vibe par son @username.",
  parameters: {
    type: "object",
    properties: {
      username: { type: "string", description: "Destinataire, sans le @" },
      content: { type: "string", description: "Contenu du message (1-2000 caractères)" },
    },
    required: ["username", "content"],
  },
};
