/** Adaptateur de présentation AG-UI → AI SDK. Il ne donne aucune autorisation d'outil et n'est jamais une source d'historique serveur. */
import type { UIMessage } from "ai";
import { z } from "zod";
export const incomingUserMessage = z.object({
  id: z.string().min(1).max(200),
  parts: z
    .array(
      z.discriminatedUnion("type", [
        z.object({ text: z.string().max(100_000), type: z.literal("text") }),
        z.object({
          fileName: z.string().max(255).optional(),
          filename: z.string().max(255).optional(),
          mediaType: z.string().max(127),
          pathname: z.string().max(512).optional(),
          size: z.number().int().nonnegative().optional(),
          type: z.literal("file"),
          url: z.string().max(2048).default(""),
        }),
      ])
    )
    .min(1)
    .max(50),
  role: z.literal("user"),
});
const agui = z.object({
  content: z.string().optional(),
  id: z.string().min(1),
  role: z.enum(["user", "assistant", "system", "tool"]),
  toolCallId: z.string().optional(),
  toolCalls: z
    .array(
      z.object({
        function: z.object({ arguments: z.string(), name: z.string().min(1) }),
        id: z.string().min(1),
      })
    )
    .optional(),
});
export function fromOpenMuseMessages(input: unknown[]): UIMessage[] {
  const result: UIMessage[] = [];
  for (const value of input) {
    const message = agui.parse(value);
    if (message.role === "tool") {
      for (const prior of result)
        for (const part of prior.parts) {
          if (
            part.type === "dynamic-tool" &&
            part.toolCallId === message.toolCallId
          ) {
            part.state = "output-available";
            part.output = message.content ?? "";
          }
        }
      continue;
    }
    const parts: UIMessage["parts"] = [];
    if (message.content) parts.push({ text: message.content, type: "text" });
    for (const call of message.toolCalls ?? []) {
      let input: unknown;
      try {
        input = JSON.parse(call.function.arguments);
      } catch {
        throw new Error("Arguments d’outil source invalides.");
      }
      parts.push({
        input,
        state: "input-available",
        toolCallId: call.id,
        toolName: call.function.name,
        type: "dynamic-tool",
      });
    }
    result.push({ id: message.id, parts, role: message.role });
  }
  return result;
}
/**
 * Ligne de `WakiesMessage` telle que les routes la servent.
 *
 * Les champs au-delà de `id`/`role`/`parts` sont FACULTATIFS : le module
 * convertit aussi bien l'ancienne forme (trois champs) que l'enrichie de la
 * messagerie (citation, horodatage, ordre d'écriture, auteur).
 */
type LigneSwap = {
  authorWakieId?: string | null;
  /**
   * `Date` côté serveur, millisecondes côté client : `versClient` convertit à
   * la frontière, et la conversion est REFAITE ici pour qu'un appelant serveur
   * (la route de chat) obtienne la même métadonnée que le navigateur.
   */
  createdAt?: Date | number | null;
  id: string;
  parts: unknown;
  replyToId?: string | null;
  role: string;
  seq?: number | null;
};

/**
 * Conversion lignes → `UIMessage`, MÉTADONNÉES COMPRISES.
 *
 * `metadata` est le seul endroit où l'AI SDK transporte des informations que
 * le modèle ne voit pas. Y placer la citation, l'auteur, l'horodatage et le
 * `seq` évite de faire voyager un second tableau parallèle dans tous les
 * composants — et le transcript peut alors décider seul d'afficher une
 * citation ou un séparateur de jour.
 */
export function storedMessages(rows: LigneSwap[]): UIMessage[] {
  return rows
    .filter(
      (row) =>
        row.id &&
        (row.role === "user" ||
          row.role === "assistant" ||
          row.role === "system") &&
        Array.isArray(row.parts)
    )
    .map((row) => {
      const metadata: Record<string, unknown> = {};
      if (row.authorWakieId !== undefined) {
        metadata.authorWakieId = row.authorWakieId;
      }
      if (row.createdAt !== undefined) {
        metadata.createdAt =
          row.createdAt instanceof Date
            ? row.createdAt.getTime()
            : row.createdAt;
      }
      if (row.replyToId !== undefined) metadata.replyToId = row.replyToId;
      if (row.seq !== undefined) metadata.seq = row.seq;
      return {
        id: row.id,
        // Une ligne sans métadonnée ne porte pas de `metadata` vide : un objet
        // vide ferait croire à une métadonnée présente et nulle.
        ...(Object.keys(metadata).length ? { metadata } : {}),
        parts: row.parts as UIMessage["parts"],
        role: row.role as UIMessage["role"],
      };
    });
}
/** Première partie texte d'un message stocké, bornée : c'est l'APERÇU. */
export function premiereTexte(parts: unknown): string {
  if (!Array.isArray(parts)) return "";
  for (const part of parts) {
    if (
      typeof part === "object" &&
      part !== null &&
      (part as { type?: unknown }).type === "text" &&
      typeof (part as { text?: unknown }).text === "string"
    ) {
      const texte = (part as { text: string }).text.trim();
      if (texte) return texte;
    }
  }
  return "";
}

/**
 * Aperçu d'un message pour la liste des conversations.
 *
 * Un message sans texte (appel d'outil, réaction seule, fichier) ne devient
 * pas une ligne vide silencieuse : il est ANNONCÉ (« appel d'outil », « pièce
 * jointe »), parce qu'un blanc dans une liste de conversations se lit comme un
 * bug. La coupe normalise les blancs : un aperçu n'est pas un transcript.
 */
export function apercuMessage(parts: unknown, max = 120): string {
  const texte = premiereTexte(parts).replace(/\s+/g, " ").trim();
  if (texte) return texte.slice(0, max);
  if (!Array.isArray(parts)) return "";
  for (const part of parts) {
    if (typeof part !== "object" || part === null) continue;
    const type = (part as { type?: unknown }).type;
    if (type === "file") return "Pièce jointe";
    if (type === "dynamic-tool" || type === "tool-invocation") {
      return "Appel d’outil";
    }
    if (type === "reasoning") return "Raisonnement";
  }
  return "";
}

export function safeAttachmentLink(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}
