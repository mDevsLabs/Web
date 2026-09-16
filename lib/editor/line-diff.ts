/**
 * Diff par lignes mutualisé (couche commune).
 *
 * Extrait de components/chat/code-diff-view.tsx pour servir à la fois :
 * - la vue de diff code (CodeDiffView) ;
 * - l'aperçu des propositions de modifications ciblées (patch IA) ;
 * - tout futur rendu de diff ligne à ligne.
 *
 * Purement fonctionnel et sans DOM : testable côté Vitest, exécutable
 * client (composants) comme serveur (génération d'aperçus).
 */

// @ts-expect-error — le package n'expose pas de types fiables selon les versions.
import { diff_match_patch } from "diff-match-patch";

export interface DiffLine {
  newLineNumber?: number;
  oldLineNumber?: number;
  text: string;
  type: "insert" | "delete" | "equal";
}

export interface SplitRow {
  left?: { num?: number; text: string; type: "delete" | "equal" };
  right?: { num?: number; text: string; type: "insert" | "equal" };
}

export interface LineDiffResult {
  additions: number;
  deletions: number;
  lines: DiffLine[];
  splitRows: SplitRow[];
}

export type DiffStats = { additions: number; deletions: number };

/** Apparie les runs suppression/ajout pour la vue côte à côte. */
function buildSplitRows(lines: DiffLine[]): SplitRow[] {
  const rows: SplitRow[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.type === "equal") {
      rows.push({
        left: {
          num: line.oldLineNumber,
          text: line.text,
          type: "equal",
        },
        right: {
          num: line.newLineNumber,
          text: line.text,
          type: "equal",
        },
      });
      i++;
      continue;
    }
    // Run de suppressions suivi (éventuellement) d'un run d'ajouts : on apparie ligne à ligne
    if (line.type === "delete") {
      let j = i;
      while (j < lines.length && lines[j].type === "delete") {
        j++;
      }
      let k = j;
      while (k < lines.length && lines[k].type === "insert") {
        k++;
      }
      const dels = lines.slice(i, j);
      const ins = lines.slice(j, k);
      const max = Math.max(dels.length, ins.length);
      for (let r = 0; r < max; r++) {
        const d = dels[r];
        const n = ins[r];
        rows.push({
          left: d
            ? { num: d.oldLineNumber, text: d.text, type: "delete" }
            : undefined,
          right: n
            ? { num: n.newLineNumber, text: n.text, type: "insert" }
            : undefined,
        });
      }
      i = k;
      continue;
    }
    // Run d'ajouts seul (aucune suppression à apparier)
    let k = i;
    while (k < lines.length && lines[k].type === "insert") {
      k++;
    }
    for (let r = i; r < k; r++) {
      rows.push({
        right: {
          num: lines[r].newLineNumber,
          text: lines[r].text,
          type: "insert",
        },
      });
    }
    i = k;
  }
  return rows;
}

/**
 * Diff ligne à ligne de deux contenus (diff-match-patch au niveau lignes,
 * suivi d'un nettoyage sémantique pour regrouper les changements lisibles).
 */
export function diffLines(oldContent: string, newContent: string): DiffLine[] {
  const dmp = new diff_match_patch();
  const a = dmp.diff_linesToChars_(oldContent || "", newContent || "");
  const diffs = dmp.diff_main(a.chars1, a.chars2, false);
  dmp.diff_charsToLines_(diffs, a.lineArray);
  dmp.diff_cleanupSemantic(diffs);

  const resultLines: DiffLine[] = [];
  let oldLineNum = 1;
  let newLineNum = 1;

  for (const [op, text] of diffs) {
    const splitLines = text.split("\n");
    // Si la dernière ligne est vide à cause du split sur le dernier \n, on ne la traite pas si elle est vide
    const count =
      splitLines.length > 1 && splitLines.at(-1) === ""
        ? splitLines.length - 1
        : splitLines.length;

    for (let i = 0; i < count; i++) {
      const lineText = splitLines[i];
      if (op === 1) {
        resultLines.push({
          newLineNumber: newLineNum++,
          text: lineText,
          type: "insert",
        });
      } else if (op === -1) {
        resultLines.push({
          oldLineNumber: oldLineNum++,
          text: lineText,
          type: "delete",
        });
      } else {
        resultLines.push({
          newLineNumber: newLineNum++,
          oldLineNumber: oldLineNum++,
          text: lineText,
          type: "equal",
        });
      }
    }
  }

  return resultLines;
}

export function summarizeLines(lines: DiffLine[]): DiffStats {
  let additions = 0;
  let deletions = 0;
  for (const line of lines) {
    if (line.type === "insert") {
      additions += 1;
    } else if (line.type === "delete") {
      deletions += 1;
    }
  }
  return { additions, deletions };
}

/** Diff complet : lignes, vue split et statistiques. */
export function computeLineDiff(
  oldContent: string,
  newContent: string
): LineDiffResult {
  const lines = diffLines(oldContent, newContent);
  const { additions, deletions } = summarizeLines(lines);
  return {
    additions,
    deletions,
    lines,
    splitRows: buildSplitRows(lines),
  };
}
