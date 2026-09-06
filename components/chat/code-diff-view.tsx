"use client";

// @ts-expect-error
import { diff_match_patch } from "diff-match-patch";
import { Columns2Icon, Rows2Icon } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export interface CodeDiffViewProps {
  language?: string;
  newContent: string;
  oldContent: string;
}

interface DiffLine {
  newLineNumber?: number;
  oldLineNumber?: number;
  text: string;
  type: "insert" | "delete" | "equal";
}

interface SplitRow {
  left?: { num?: number; text: string; type: "delete" | "equal" };
  right?: { num?: number; text: string; type: "insert" | "equal" };
}

type ViewMode = "unified" | "split";

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

export function CodeDiffView({
  oldContent,
  newContent,
  language,
}: CodeDiffViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("split");

  const { lines, splitRows, additions, deletions } = useMemo(() => {
    const dmp = new diff_match_patch();
    const a = dmp.diff_linesToChars_(oldContent || "", newContent || "");
    const diffs = dmp.diff_main(a.chars1, a.chars2, false);
    dmp.diff_charsToLines_(diffs, a.lineArray);
    dmp.diff_cleanupSemantic(diffs);

    const resultLines: DiffLine[] = [];
    let oldLineNum = 1;
    let newLineNum = 1;
    let addCount = 0;
    let delCount = 0;

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
          // Inserted
          addCount++;
          resultLines.push({
            newLineNumber: newLineNum++,
            text: lineText,
            type: "insert",
          });
        } else if (op === -1) {
          // Deleted
          delCount++;
          resultLines.push({
            oldLineNumber: oldLineNum++,
            text: lineText,
            type: "delete",
          });
        } else {
          // Equal
          resultLines.push({
            newLineNumber: newLineNum++,
            oldLineNumber: oldLineNum++,
            text: lineText,
            type: "equal",
          });
        }
      }
    }

    return {
      additions: addCount,
      deletions: delCount,
      lines: resultLines,
      splitRows: buildSplitRows(resultLines),
    };
  }, [oldContent, newContent]);

  const cellClasses = (type: "insert" | "delete" | "equal" | "empty") => {
    if (type === "insert") {
      return "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200";
    }
    if (type === "delete") {
      return "bg-red-500/15 text-red-800 dark:text-red-200";
    }
    if (type === "empty") {
      return "bg-muted/20";
    }
    return "text-foreground";
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-border/60 bg-background font-mono text-xs">
      {/* Barre de stats + bascule de vue */}
      <div className="flex items-center justify-between gap-2 border-b border-border/40 bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="font-semibold uppercase tracking-wider">
            Comparaison ({language || "code"})
          </span>
          <div className="flex items-center gap-2">
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              +{additions}
            </span>
            <span className="font-medium text-red-600 dark:text-red-400">
              -{deletions}
            </span>
          </div>
        </div>
        <div className="flex items-center rounded-md border border-border/50 bg-background p-0.5">
          <button
            className={cn(
              "flex items-center gap-1 rounded-sm px-2 py-1 font-medium transition-colors",
              viewMode === "split"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setViewMode("split")}
            title="Vue côte à côte"
            type="button"
          >
            <Columns2Icon className="size-3.5" />
            <span>Côte à côte</span>
          </button>
          <button
            className={cn(
              "flex items-center gap-1 rounded-sm px-2 py-1 font-medium transition-colors",
              viewMode === "unified"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setViewMode("unified")}
            title="Vue unifiée"
            type="button"
          >
            <Rows2Icon className="size-3.5" />
            <span>Unifiée</span>
          </button>
        </div>
      </div>

      {viewMode === "split" ? (
        /* Vue côte à côte : ancienne version à gauche, nouvelle à droite */
        <div className="flex-1 overflow-auto">
          <div className="grid min-w-fit grid-cols-2 divide-x divide-border/30">
            <div className="border-r-0">
              <div className="sticky top-0 z-10 border-b border-border/40 bg-muted/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Ancienne version
              </div>
              {splitRows.map((row, idx) => {
                const cell = row.left;
                return (
                  <div
                    className={cn(
                      "flex leading-5 transition-colors",
                      cellClasses(cell?.type ?? "empty")
                    )}
                    key={`l-${idx}`}
                  >
                    <span className="w-10 shrink-0 select-none pr-2 text-right text-[10px] text-muted-foreground/60">
                      {cell?.num ?? ""}
                    </span>
                    <span className="whitespace-pre-wrap break-all pr-3">
                      {cell?.text || "\u00A0"}
                    </span>
                  </div>
                );
              })}
            </div>
            <div>
              <div className="sticky top-0 z-10 border-b border-border/40 bg-muted/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Nouvelle version
              </div>
              {splitRows.map((row, idx) => {
                const cell = row.right;
                return (
                  <div
                    className={cn(
                      "flex leading-5 transition-colors",
                      cellClasses(cell?.type ?? "empty")
                    )}
                    key={`r-${idx}`}
                  >
                    <span className="w-10 shrink-0 select-none pr-2 text-right text-[10px] text-muted-foreground/60">
                      {cell?.num ?? ""}
                    </span>
                    <span className="whitespace-pre-wrap break-all pr-3">
                      {cell?.text || "\u00A0"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Vue unifiée */
        <div className="flex-1 overflow-auto p-2">
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, idx) => {
                const isInsert = line.type === "insert";
                const isDelete = line.type === "delete";

                const rowBg = isInsert
                  ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
                  : isDelete
                    ? "bg-red-500/15 text-red-800 dark:text-red-200"
                    : "hover:bg-muted/20 text-foreground";

                const sign = isInsert ? "+" : isDelete ? "-" : " ";

                return (
                  <tr
                    className={`${rowBg} leading-5 transition-colors`}
                    key={idx}
                  >
                    <td className="w-10 select-none pr-2 text-right text-[10px] text-muted-foreground/60">
                      {line.oldLineNumber ?? ""}
                    </td>
                    <td className="w-10 select-none pr-2 text-right text-[10px] text-muted-foreground/60">
                      {line.newLineNumber ?? ""}
                    </td>
                    <td className="w-4 select-none text-center font-bold text-[11px] opacity-70">
                      {sign}
                    </td>
                    <td className="whitespace-pre-wrap break-all pl-1 pr-3">
                      {line.text || "\u00A0"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
