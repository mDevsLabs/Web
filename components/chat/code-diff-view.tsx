"use client";

// @ts-expect-error
import { diff_match_patch } from "diff-match-patch";
import { useMemo } from "react";

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

export function CodeDiffView({
  oldContent,
  newContent,
  language,
}: CodeDiffViewProps) {
  const { lines, additions, deletions } = useMemo(() => {
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
        splitLines.length > 1 && splitLines[splitLines.length - 1] === ""
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

    return { additions: addCount, deletions: delCount, lines: resultLines };
  }, [oldContent, newContent]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border/60 bg-background font-mono text-xs">
      {/* Barre de stats du diff */}
      <div className="flex items-center justify-between border-b border-border/40 bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
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

      {/* Conteneur des lignes diff */}
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
    </div>
  );
}
