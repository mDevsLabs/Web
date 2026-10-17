import { tool as createTool, type ToolSet } from "ai";
import { z } from "zod";
import { pageSettings } from "@/lib/wakies/pages";
import {
  deletePage,
  findPage,
  setPageSettings,
  togglePagePin,
  updatePage,
} from "@/lib/wakies/queries";

/**
 * OUTILS WAKIES — les pages du fil.
 *
 * C'est par eux qu'un Wakie ÉDIT la page plutôt que de dicter un texte à
 * recoller. La cible n'est jamais choisie par le modèle : ce sont les outils de
 * LA page liée à la conversation (`pageForConversation`), donc un Wakie ne peut
 * pas toucher une page que l'utilisateur ne lui a pas montrée.
 *
 * DEUX RÉGIMES, selon ce que l'erreur coûte :
 *   - écriture directe : contenu, réglages, épingle. Réversibles, sans perte ;
 *   - APPROBATION : renommer et supprimer. `deletePage` entraîne les
 *     sous-pages, et un titre n'est pas restorable — l'humain valide avant.
 *
 * Le numéro de révision n'est JAMAIS demandé au modèle : il ne peut pas le
 * connaître. Chaque écriture relit la page puis écrit sous la révision lue, et
 * un conflit est répondu au modèle plutôt qu'enfoncé.
 *
 * Ces outils ne sont PAS dans `lib/chat/tools` ni dans `WAKIE_TOOL_CATALOG` :
 * un Wakie ne les « active » pas, ils n'existent que quand une page est ouverte.
 * Déplacer une page se fait par le menu de la page, où l'interface propose les
 * cibles : un modèle appelé sans identifiant valide ne peut pas le faire bien.
 */

const OUTILS = {
  contenu: "updatePageContent",
  epingle: "pinPage",
  regler: "setPageSettings",
  renommer: "renamePage",
  supprimer: "deletePageFromConversation",
} as const;

const sortie = z.object({
  ok: z.boolean(),
  raison: z.string().optional(),
  revision: z.number().int().optional(),
});

export function createWakiePageTools(params: {
  pageId: string;
  userId: string;
}): ToolSet {
  const { pageId, userId } = params;

  /** Relit la page, écrit sous SA révision, rend le conflit au modèle. */
  const ecrire = async (patch: {
    content?: string;
    title?: string;
  }): Promise<z.infer<typeof sortie>> => {
    const page = await findPage(userId, pageId);
    if (!page) return { ok: false, raison: "Page introuvable." };
    const maj = await updatePage(userId, pageId, {
      ...patch,
      expectedRevision: page.revision,
    });
    return maj
      ? { ok: true, revision: maj.revision }
      : {
          ok: false,
          raison:
            "La page a changé pendant ce tour. Relis-la, puis reprends ta modification.",
        };
  };

  return {
    [OUTILS.contenu]: createTool({
      description:
        "Remplace tout le contenu de la page ouverte dans cette conversation, " +
        "en Markdown. Lis d'abord le contenu fourni dans ton contexte et " +
        "réécris-le entier : cet outil ne fait pas de retouche locale, il " +
        "substitue le texte. Ne l'utilise pas pour une page que tu n'as pas " +
        "sous les yeux.",
      execute: async ({ content }) => ecrire({ content }),
      inputSchema: z.object({
        content: z
          .string()
          .max(100_000)
          .describe("Le contenu complet de la page, en Markdown."),
      }),
      needsApproval: false,
      outputSchema: sortie,
    }),

    [OUTILS.regler]: createTool({
      description:
        "Règle la lecture de la page ouverte : colonne élargie, signe affiché " +
        "dans la bibliothèque. Ce sont des réglages d'affichage, pas du " +
        "contenu. Une clé absente garde sa valeur actuelle.",
      execute: async (reglages) => {
        const page = await findPage(userId, pageId);
        if (!page) return { ok: false, raison: "Page introuvable." };
        const actuel = pageSettings.parse(page.settings ?? {});
        const ecrit = await setPageSettings(userId, pageId, {
          icon: reglages.icon === undefined ? actuel.icon : reglages.icon,
          large: reglages.large === undefined ? actuel.large : reglages.large,
        });
        return ecrit
          ? { ok: true }
          : { ok: false, raison: "Page introuvable." };
      },
      inputSchema: z.object({
        icon: z.string().trim().max(16).nullable().optional(),
        large: z.boolean().optional(),
      }),
      needsApproval: false,
      outputSchema: sortie,
    }),

    [OUTILS.epingle]: createTool({
      description:
        "Épingle ou désépingle la page ouverte : les pages épinglées passent en " +
        "tête de la bibliothèque de l'Espace. Ne change ni le contenu ni le " +
        "titre.",
      execute: async ({ pinned }) => {
        const reussi = await togglePagePin(userId, pageId, pinned);
        return reussi
          ? { ok: true }
          : { ok: false, raison: "Page introuvable." };
      },
      inputSchema: z.object({
        pinned: z.boolean().describe("Vrai pour épingler, faux pour libérer."),
      }),
      needsApproval: false,
      outputSchema: sortie,
    }),

    [OUTILS.renommer]: createTool({
      description:
        "Renomme la page ouverte. Le titre de la page est son identifiant dans " +
        "les listes : l'utilisateur valide ce changement avant qu'il soit écrit.",
      execute: async ({ title }) => ecrire({ title }),
      inputSchema: z.object({
        title: z.string().trim().min(1).max(160),
      }),
      needsApproval: true,
      outputSchema: sortie,
    }),

    [OUTILS.supprimer]: createTool({
      description:
        "Supprime la page ouverte. SES SOUS-PAGES SONT SUPPRIMÉES AVEC ELLE et " +
        "rien n'est restaurable : l'utilisateur doit approuver cet appel.",
      execute: async () => {
        const supprimee = await deletePage(userId, pageId);
        return supprimee
          ? { ok: true }
          : { ok: false, raison: "Page introuvable." };
      },
      inputSchema: z.object({}),
      needsApproval: true,
      outputSchema: sortie,
    }),
  };
}
