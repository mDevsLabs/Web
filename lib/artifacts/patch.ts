import { z } from "zod";
import { hashContent } from "./hash";

/**
 * Opérations ciblées d'un patch de document proposé par l'IA.
 *
 * Le format est strict et sérialisable en JSON (colonne jsonb) : chaque op
 * cible une portion précise du contenu, jamais le document entier. Le
 * remplacement total reste possible via `updateDocument`, pas via ce format.
 *
 * Invariants appliqués par `applyDocumentPatch` :
 * - validation de chaque op AVANT toute mutation (atomique : tout ou rien) ;
 * - re-vérification de `baseHash` contre le contenu réel avant application :
 *   une proposition générée sur une ancienne version est rejetée avec
 *   `stale_base` au lieu d'écraser silencieusement les modifications.
 */

export const documentPatchOpSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("replace_text"),
    find: z.string().min(1).max(100_000),
    replaceWith: z.string().max(100_000),
    occurrence: z.number().int().min(1).max(10_000).optional(),
    replaceAll: z.boolean().optional(),
    caseSensitive: z.boolean().optional(),
  }),
  z.object({
    type: z.literal("insert"),
    line: z.number().int().min(0).max(1_000_000),
    position: z.enum(["before", "after"]),
    content: z.string().max(100_000),
  }),
  z.object({
    type: z.literal("delete_range"),
    startLine: z.number().int().min(1).max(1_000_000),
    endLine: z.number().int().min(1).max(1_000_000),
  }),
  z.object({
    type: z.literal("replace_range"),
    startLine: z.number().int().min(1).max(1_000_000),
    endLine: z.number().int().min(1).max(1_000_000),
    content: z.string().max(100_000),
  }),
]);

export const documentPatchSchema = z.object({
  baseHash: z.string().min(1).max(64),
  ops: z.array(documentPatchOpSchema).min(1).max(100),
});

export type DocumentPatchOp = z.infer<typeof documentPatchOpSchema>;
export type DocumentPatch = z.infer<typeof documentPatchSchema>;

export type PatchOpError = {
  /** Index de l'op fautive dans le tableau ops. */
  opIndex: number;
  /** Type d'échec : base périmée, introuvable, hors bornes, invalide. */
  reason: "stale_base" | "not_found" | "out_of_bounds" | "invalid";
  message: string;
};

export type ApplyPatchSuccess = {
  ok: true;
  content: string;
  appliedOps: number;
};

export type ApplyPatchFailure = {
  ok: false;
  errors: PatchOpError[];
};

export type ApplyPatchResult = ApplyPatchSuccess | ApplyPatchFailure;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Regex d'aiguille échappée. La recherche passe par une regex sur la chaîne
 * d'origine (et non sur une copie en casse normalisée) : certains caractères
 * Unicode changent de longueur sous toLowerCase(), ce qui décalerait les
 * index de découpe et corromprait le résultat.
 */
function buildNeedleRegex(
  needle: string,
  caseSensitive: boolean,
  global: boolean
): RegExp {
  const flags = `${global ? "g" : ""}${caseSensitive ? "" : "i"}`;
  return new RegExp(escapeRegExp(needle), flags);
}

function countOccurrences(
  haystack: string,
  needle: string,
  caseSensitive: boolean
): number {
  const regex = buildNeedleRegex(needle, caseSensitive, true);
  let count = 0;
  while (regex.exec(haystack) !== null) {
    count += 1;
  }
  return count;
}

/** Index de la nième occurrence (1-indexed), ou -1. */
function findOccurrenceIndex(
  haystack: string,
  needle: string,
  occurrence: number,
  caseSensitive: boolean
): number {
  const regex = buildNeedleRegex(needle, caseSensitive, true);
  for (let seen = 0; seen < occurrence; seen += 1) {
    const match = regex.exec(haystack);
    if (!match) {
      return -1;
    }
    if (seen === occurrence - 1) {
      return match.index;
    }
  }
  return -1;
}

/**
 * Applique un patch ciblé de façon atomique.
 *
 * La vérification baseHash se fait sur le contenu tel quel : c'est l'appelant
 * qui décide de la fraîcheur (contenu courant de la BDD côté serveur, contenu
 * ouvert côté client).
 */
export function applyDocumentPatch(
  base: string,
  patch: DocumentPatch
): ApplyPatchResult {
  const errors: PatchOpError[] = [];

  const expectedHash = hashContent(base);
  if (patch.baseHash !== expectedHash) {
    errors.push({
      message: `Le document a changé depuis la génération de cette proposition (base ${patch.baseHash} ≠ courant ${expectedHash}). Recalculez le diff avant d'appliquer.`,
      opIndex: 0,
      reason: "stale_base",
    });
    return { errors, ok: false };
  }

  // Pré-validation de toutes les opérations sur la base d'origine :
  // aucune mutation n'a lieu tant qu'une op est invalide.
  const lines = base.split("\n");

  patch.ops.forEach((op, opIndex) => {
    if (op.type === "replace_text") {
      const caseSensitive = op.caseSensitive ?? true;
      const count = countOccurrences(base, op.find, caseSensitive);
      if (count === 0) {
        errors.push({
          message: `Texte introuvable : « ${op.find.slice(0, 80)}${op.find.length > 80 ? "…" : ""} »`,
          opIndex,
          reason: "not_found",
        });
        return;
      }
      const occurrence = op.replaceAll ? 1 : (op.occurrence ?? 1);
      if (occurrence > count) {
        errors.push({
          message: `Occurrence ${occurrence} demandée mais seulement ${count} occurrence(s) trouvée(s).`,
          opIndex,
          reason: "not_found",
        });
      }
      return;
    }

    if (op.type === "insert") {
      // line peut valoir 0 (avant la première ligne) ou lines.length (après
      // la dernière) : insertion en bord de document.
      if (op.line > lines.length) {
        errors.push({
          message: `Insertion à la ligne ${op.line} alors que le document compte ${lines.length} ligne(s).`,
          opIndex,
          reason: "out_of_bounds",
        });
      }
      return;
    }

    // delete_range / replace_range : bornes 1-indexed inclusives.
    if (op.startLine > op.endLine) {
      errors.push({
        message: `Intervalle invalide : startLine (${op.startLine}) > endLine (${op.endLine}).`,
        opIndex,
        reason: "invalid",
      });
      return;
    }
    if (op.startLine > lines.length || op.endLine > lines.length) {
      errors.push({
        message: `Lignes ${op.startLine}-${op.endLine} hors document (${lines.length} ligne(s)).`,
        opIndex,
        reason: "out_of_bounds",
      });
    }
  });

  if (errors.length > 0) {
    return { errors, ok: false };
  }

  // Application séquentielle. replace_text opère sur le contenu courant (les
  // ops précédentes peuvent avoir décalé les offsets) ; les ops par lignes
  // utilisent des index relatifs au tableau de lignes courant.
  let content = base;
  let workingLines = lines;

  for (let opIndex = 0; opIndex < patch.ops.length; opIndex += 1) {
    const op = patch.ops[opIndex];

    if (op.type === "replace_text") {
      const caseSensitive = op.caseSensitive ?? true;
      const replaceFn = () => op.replaceWith;

      if (op.replaceAll) {
        content = content.replace(
          buildNeedleRegex(op.find, caseSensitive, true),
          replaceFn
        );
      } else {
        const occurrence = op.occurrence ?? 1;
        const index = findOccurrenceIndex(
          content,
          op.find,
          occurrence,
          caseSensitive
        );
        if (index === -1) {
          // Inatteignable après pré-validation ; garde-fou défensif.
          return {
            errors: [
              {
                message: `Texte introuvable à l'application (op ${opIndex + 1}).`,
                opIndex,
                reason: "not_found",
              },
            ],
            ok: false,
          };
        }
        content =
          content.slice(0, index) +
          op.replaceWith +
          content.slice(index + op.find.length);
      }
      // Les ops ligne suivantes se référent au contenu mis à jour.
      workingLines = content.split("\n");
      continue;
    }

    if (op.type === "insert") {
      const inserted = op.content.split("\n");
      const at = op.position === "before" ? op.line : op.line + 1;
      workingLines = [
        ...workingLines.slice(0, at),
        ...inserted,
        ...workingLines.slice(at),
      ];
      content = workingLines.join("\n");
      continue;
    }

    if (op.type === "delete_range") {
      workingLines = [
        ...workingLines.slice(0, op.startLine - 1),
        ...workingLines.slice(op.endLine),
      ];
      content = workingLines.join("\n");
      continue;
    }

    // replace_range
    workingLines = [
      ...workingLines.slice(0, op.startLine - 1),
      ...op.content.split("\n"),
      ...workingLines.slice(op.endLine),
    ];
    content = workingLines.join("\n");
  }

  return { appliedOps: patch.ops.length, content, ok: true };
}
