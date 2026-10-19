import { z } from "zod";
import { errorResponse, zodIssuesMessage } from "@/lib/api/error-response";
import { getTierStorageBytes, getWakiesQuota } from "@/lib/plans/tier-limits";
import {
  json,
  rejectCrossOriginMutation,
  requireWakiesUser,
} from "@/lib/wakies/http";
import {
  ensureSettings,
  listWakies,
  updateSettings,
} from "@/lib/wakies/queries";
import { wakiesSetupStatus } from "@/lib/wakies/setup";

/**
 * GET   /api/wakies/settings — réglages du compte, ses Wakies et ses plafonds.
 * PATCH /api/wakies/settings — réglages du compte (pause, recherche, mémoire).
 *
 * Le gabarit exposait la même chose en JSON libre sur une ligne SQLite
 * globale. Ici la ligne est PORTE PAR COMPTE (`WakiesSettings.userId`), donc
 * mettre en pause n'arrête que les Wakies de son propriétaire.
 *
 * LE GET N'EXISTAIT PAS : la page de réglages ouvrait `/state` puis
 * `/workspace`, deux charges complètes (conversations, appels, tâches) pour
 * afficher une ligne de réglages. Une page qui se recharge à chaque fois que
 * l'utilisateur change une case paie ce qu'elle n'a pas à payer.
 * Les quotas viennent du SERVEUR : le client n'a jamais à recalculer un plafond.
 */

const schema = z
  .object({
    memoryAllowed: z.boolean().optional(),
    name: z.string().trim().min(1).max(40).optional(),
    // Repère de PARCOURS, jamais d'autorisation : il dit « l'assistant de
    // configuration a été terminé ». Il ne déverrouille rien, et le retirer ne
    // retirerait aucun droit.
    onboardingCompleted: z.boolean().optional(),
    paused: z.boolean().optional(),
    researchAllowed: z.boolean().optional(),
  })
  .strict();

export async function GET() {
  const identite = await requireWakiesUser();
  if (identite instanceof Response) {
    return identite;
  }
  const [settings, wakies, setup] = await Promise.all([
    ensureSettings(identite.userId),
    listWakies(identite.userId),
    wakiesSetupStatus(),
  ]);
  // Les plafonds sont SERVIS, pas déduits : la page affiche le même nombre que
  // celui qu'une création opposera un refus.
  const quotas = Object.fromEntries(
    (
      [
        "conversations",
        "memories",
        "pages",
        "spaces",
        "tasks",
        "wakies",
        "wakieProfileImages",
      ] as const
    ).map((cle) => [cle, getWakiesQuota(identite.tier, cle)])
  );
  return json(
    {
      quotas,
      settings,
      // Le modèle et les capacités se règlent PAR Wakie : c'est la hiérarchie
      // que le serveur applique (conversation → Wakie → défaut), et il n'existe
      // aucune colonne de compte pour ces réglages.
      // Ce qui n'est PAS branché (voix, Slack, ordinateurs) : la page de
      // réglages est le seul endroit où le dire, depuis la suppression du
      // dialogue.
      setup,
      storageBytes: getTierStorageBytes(identite.tier),
      tier: identite.tier,
      wakies,
    },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}

export async function PATCH(request: Request) {
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;
  const identite = await requireWakiesUser();
  if (identite instanceof Response) {
    return identite;
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("invalid_request", {
      message: zodIssuesMessage(parsed.error),
    });
  }
  const settings = await updateSettings(identite.userId, parsed.data);
  return json(settings);
}
