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
    // Ancrage de la sélection (offsets dans le contenu de base) : cible
    // l'occurrence EXACTE choisie par l'utilisateur, jamais « la première
    // qui passe » (issue #52).
    anchor: z
      .object({
        end: z.number().int().min(1),
        start: z.number().int().min(0),
      })
      .optional(),
    caseSensitive: z.boolean().optional(),
    find: z.string().min(1).max(100_000),
    occurrence: z.number().int().min(1).max(10_000).optional(),
    replaceAll: z.boolean().optional(),
    replaceWith: z.string().max(100_000),
    type: z.literal("replace_text"),
  }),
  z.object({
    content: z.string().max(100_000),
    line: z.number().int().min(0).max(1_000_000),
    position: z.enum(["before", "after"]),
    type: z.literal("insert"),
  }),
  z.object({
    endLine: z.number().int().min(1).max(1_000_000),
    startLine: z.number().int().min(1).max(1_000_000),
    type: z.literal("delete_range"),
  }),
  z.object({
    content: z.string().max(100_000),
    endLine: z.number().int().min(1).max(1_000_000),
    startLine: z.number().int().min(1).max(1_000_000),
    type: z.literal("replace_range"),
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
  /**
   * Type d'échec : base périmée, introuvable, hors bornes, invalide, ou
   * correspondance multiple sans ancrage (« ambiguous »).
   */
  reason:
    | "ambiguous"
    | "invalid"
    | "not_found"
    | "out_of_bounds"
    | "stale_base";
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
 * Résout un ancrage de sélection en une occurrence (1-indexée) de `find`.
 *
 * L'ancrage est VÉRIFIÉ : la tranche [start, end) doit être exactement le texte
 * recherché, et la correspondance doit commencer à `start`. Le moindre écart
 * retourne null — jamais de repli sur la première occurrence, c'est
 * précisément ce qui remplaçait la mauvaise occurrence (issue #52).
 */
function resolveAnchorOccurrence(
  base: string,
  needle: string,
  anchor: { end: number; start: number },
  caseSensitive: boolean
): number | null {
  const { end, start } = anchor;
  if (
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    start < 0 ||
    end > base.length ||
    start >= end
  ) {
    return null;
  }
  const exact = new RegExp(
    `^${escapeRegExp(needle)}$`,
    caseSensitive ? "" : "i"
  );
  if (!exact.test(base.slice(start, end))) {
    return null;
  }
  const regex = buildNeedleRegex(needle, caseSensitive, true);
  let occurrence = 1;
  let match = regex.exec(base);
  while (match !== null) {
    if (match.index === start) {
      return occurrence;
    }
    if (match.index > start) {
      break;
    }
    occurrence += 1;
    match = regex.exec(base);
  }
  return null;
}

export type SelectionContext = {
  /** Ancrage de la sélection dans le contenu, ou null s'il n'est pas résoluble. */
  anchor: { end: number; start: number } | null;
  /** Texte sélectionné tel que présenté à l'assistant. */
  text: string;
};

/**
 * Ancre les opérations de remplacement qui ciblent EXACTEMENT la sélection.
 *
 * L'assistant ne reçoit qu'une chaîne pour la sélection : sans cette passe, un
 * `replace_text` sur un texte présent plusieurs fois retombait sur la première
 * occurrence — parfois PAS celle que l'utilisateur avait sélectionnée (issue
 * #52). L'ancre est vérifiée contre le contenu courant ; sans vérification,
 * l'op est laissée telle quelle et c'est le refus d'ambiguïté
 * d'`applyDocumentPatch` qui prend le relais.
 */
export function anchorOpsToSelection(
  content: string,
  ops: DocumentPatchOp[],
  selection: SelectionContext | null
): DocumentPatchOp[] {
  const anchor = selection?.anchor;
  if (!selection?.text || !anchor) {
    return ops;
  }
  if (content.slice(anchor.start, anchor.end) !== selection.text) {
    return ops;
  }
  return ops.map((op) => {
    if (
      op.type !== "replace_text" ||
      op.replaceAll ||
      op.occurrence !== undefined ||
      op.anchor
    ) {
      return op;
    }
    return op.find === selection.text ? { ...op, anchor } : op;
  });
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
  // Occurrences résolues depuis un ancrage de sélection (1-indexées) :
  // l'application réutilise la mécanique d'occurrence, stable même si les ops
  // précédentes décalent les offsets du contenu courant.
  const resolvedOccurrences = new Map<number, number>();

  patch.ops.forEach((op, opIndex) => {
    if (op.type === "replace_text") {
      const caseSensitive = op.caseSensitive ?? true;
      if (op.anchor) {
        const resolved = resolveAnchorOccurrence(
          base,
          op.find,
          op.anchor,
          caseSensitive
        );
        if (resolved === null) {
          errors.push({
            message: `L'ancrage de la sélection [${op.anchor.start}, ${op.anchor.end}) ne correspond pas au texte « ${op.find.slice(0, 80)}${op.find.length > 80 ? "…" : ""} ». Le patch est refusé : une autre occurrence ne sera jamais remplacée à la place.`,
            opIndex,
            reason: "invalid",
          });
        } else {
          resolvedOccurrences.set(opIndex, resolved);
        }
        return;
      }
      const count = countOccurrences(base, op.find, caseSensitive);
      if (count === 0) {
        errors.push({
          message: `Texte introuvable : « ${op.find.slice(0, 80)}${op.find.length > 80 ? "…" : ""} »`,
          opIndex,
          reason: "not_found",
        });
        return;
      }
      if (!op.replaceAll && op.occurrence === undefined && count > 1) {
        // Refus d'un patch ambigu : prendre silencieusement la première
        // occurrence remplaçait PARFOIS la mauvaise (issue #52).
        errors.push({
          message: `Le texte « ${op.find.slice(0, 80)}${op.find.length > 80 ? "…" : ""} » apparaît ${count} fois : précisez l'occurrence (1 à ${count}), ancrez la sélection (anchor), élargissez le texte recherché ou utilisez replaceAll.`,
          opIndex,
          reason: "ambiguous",
        });
        return;
      }
      const occurrence = op.replaceAll ? 1 : (op.occurrence ?? 1);
      if (!op.replaceAll && occurrence > count) {
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
        const occurrence =
          resolvedOccurrences.get(opIndex) ?? op.occurrence ?? 1;
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
