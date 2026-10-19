import "server-only";

/**
 * Commandes `/slash` et mentions `@Wakie` dans les conversations Wakies.
 *
 * Les `/slash` réutilisent les commandes personnalisées du chat principal
 * (`CustomCommand`, `kind = slash`) : même table, même contrat. Seules les
 * actions sûres en conversation sont appliquées ici — navigation et activation
 * d'outils. `agent`/`skill`/`prompt` deviennent du contexte, jamais un
 * changement d'état silencieux.
 * Les `@mentions` invoquent un autre Wakie (possédé ou ami) en lecture seule :
 * ses instructions sont injectées, il ne répond pas à la place du Wakie du fil.
 */

import { and, eq, ilike, or } from "drizzle-orm";
import { dbReady, getDb } from "@/lib/db/queries";
import { customCommand } from "@/lib/db/schema";
import { estOutilConnu } from "@/lib/wakies/tool-catalog";

export type SlashResolution = {
  /** Outils à activer pour ce seul tour (identifiants validés). */
  outilsSupplementaires: string[];
  /** Texte de prompt à préfixer (action `prompt`). */
  promptPrefixe: string | null;
  /** Raison affichable quand la commande est inconnue ou vide. */
  notice: string | null;
};

/** Extrait `/commande reste du message`. Null si le texte n'est pas une commande. */
export function parseSlashCommand(
  texte: string
): { commande: string; reste: string } | null {
  const ligne = texte.trimStart();
  if (!ligne.startsWith("/")) return null;
  const match = ligne.match(/^\/([a-zA-Z0-9_-]{1,40})(?:\s+(.*))?$/s);
  if (!match) return null;
  return { commande: match[1].toLowerCase(), reste: (match[2] ?? "").trim() };
}

/** Mentions `@pseudo` ou `@"Nom avec espaces"` dans le texte. */
export function parseMentions(texte: string): string[] {
  const trouves = new Set<string>();
  const simple = texte.matchAll(/(?:^|\s)@([a-zA-Z0-9_.-]{3,30})/g);
  for (const m of simple) trouves.add(m[1].toLowerCase());
  const cites = texte.matchAll(/@"([^"]{1,40})"/g);
  for (const m of cites) trouves.add(m[1].trim().toLowerCase());
  return [...trouves].slice(0, 5);
}

export async function resolveSlashCommand(
  userId: string,
  commande: string
): Promise<SlashResolution> {
  await dbReady();
  const [ligne] = await getDb()
    .select()
    .from(customCommand)
    .where(
      and(
        eq(customCommand.userId, userId),
        eq(customCommand.kind, "slash"),
        ilike(customCommand.trigger, commande)
      )
    )
    .limit(1);
  if (!ligne)
    return {
      notice: `Commande /${commande} inconnue.`,
      outilsSupplementaires: [],
      promptPrefixe: null,
    };
  const payload = (ligne.payload ?? {}) as {
    promptText?: string;
    serverIds?: string[];
    toolIds?: string[];
  };
  if (ligne.actionType === "tools") {
    const valides = (payload.toolIds ?? []).filter(estOutilConnu);
    return {
      notice: valides.length ? null : "Cette commande n'a aucun outil valide.",
      outilsSupplementaires: valides,
      promptPrefixe: null,
    };
  }
  if (ligne.actionType === "mcp") {
    return {
      notice:
        "Les serveurs MCP se règlent dans la fiche du Wakie, pas par /slash.",
      outilsSupplementaires: [],
      promptPrefixe: null,
    };
  }
  if (ligne.actionType === "prompt" && payload.promptText) {
    return {
      notice: null,
      outilsSupplementaires: [],
      promptPrefixe: payload.promptText.slice(0, 2000),
    };
  }
  if (ligne.actionType === "navigation") {
    return {
      notice: "La navigation n'est pas disponible dans une conversation Wakie.",
      outilsSupplementaires: [],
      promptPrefixe: null,
    };
  }
  return {
    notice: `La commande /${commande} ne s'applique pas ici.`,
    outilsSupplementaires: [],
    promptPrefixe: null,
  };
}

/** Cherche les commandes du compte qui commencent par le préfixe (autocomplétion). */
export async function suggestSlashCommands(userId: string, prefixe: string) {
  await dbReady();
  const nettoye = prefixe.toLowerCase().slice(0, 40);
  if (!nettoye) return [];
  const lignes = await getDb()
    .select({
      actionType: customCommand.actionType,
      description: customCommand.description,
      trigger: customCommand.trigger,
    })
    .from(customCommand)
    .where(
      and(
        eq(customCommand.userId, userId),
        eq(customCommand.kind, "slash"),
        or(
          ilike(customCommand.trigger, `${nettoye}%`),
          ilike(customCommand.trigger, `%${nettoye}%`)
        )
      )
    )
    .limit(8);
  return lignes;
}
