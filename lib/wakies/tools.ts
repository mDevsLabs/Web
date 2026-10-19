import { tool as createTool, type ToolSet } from "ai";
import { z } from "zod";
import { poserReaction } from "./queries";
import { PALETTE_REACTIONS } from "./shared/reactions";

/**
 * OUTIL WAKIES — `reactToMessage`
 *
 * C'est par lui que l'IA choisit de RÉAGIR plutôt que de répondre : le modèle
 * peut, à chaque tour, envoyer du texte, invoquer cet outil, ou faire les deux
 * dans le même tour (le SDK exécute l'outil puis laisse le texte suivre).
 *
 * La palette est FIXE côté serveur : une invocation hors palette est refusée,
 * sans rien écrire. L'outil n'arrive dans le plateau que pour une conversation
 * du compte, avec `messageId` fourni : la convention est que le Wakie réagit
 * au dernier message utilisateur du fil — le prompt système fixe cette règle,
 * et le modèle ne choisit JAMAIS la cible d'une réaction, donc il ne peut pas
 * réagir ailleurs.
 *
 * L'outil n'est PAS dans `lib/chat/tools` : il est Wakies-spécifique — ni le
 * chat principal ni le catalogue de sélection d'un Wakie ne le connaissent.
 * L'utilisateur n'a rien à cocher : c'est la mécanique du produit.
 */

export const WAKIE_REACTION_TOOL_ID = "reactToMessage";

export function createWakieReactionTool(params: {
  /** Message visé par CE tour : le dernier message utilisateur. */
  messageId: string;
  userId: string;
  /** Le Wakie qui parle ; ses réactions portent son identifiant. */
  wakieId: string;
}): ToolSet {
  return {
    [WAKIE_REACTION_TOOL_ID]: createTool({
      description:
        "Ajoute une réaction émoji au message de l'utilisateur auquel tu " +
        "réponds. À utiliser quand le contenu appelle une réaction " +
        "(approbation, célébration, humour, désaccord bref) ; ton texte reste " +
        "libre de suivre ou non. Une seule émoji par appel.",
      execute: async ({ emoji }) => {
        const ok = await poserReaction(
          params.userId,
          params.messageId,
          emoji,
          params.wakieId
        );
        return ok ? { ok: true } : { ok: false, raison: "Message inconnu." };
      },
      inputSchema: z.object({
        emoji: z
          .string()
          .describe(
            `Une seule émoji, choisie DANS cette liste : ${PALETTE_REACTIONS.join(
              " "
            )}`
          ),
      }),
      needsApproval: false,
      outputSchema: z.object({
        ok: z.boolean(),
        raison: z.string().optional(),
      }),
    }),
  };
}
