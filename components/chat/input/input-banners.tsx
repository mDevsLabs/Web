"use client";

import { GhostIcon, TriangleAlertIcon } from "lucide-react";

export function GhostBanner({
  isNewChatInput,
  toggleGhostMode,
}: {
  isNewChatInput: boolean;
  toggleGhostMode: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs shadow-xs">
      <div className="flex items-center gap-2 min-w-0">
        <GhostIcon className="size-4 shrink-0 text-purple-400 animate-pulse" />
        <span className="font-semibold text-foreground shrink-0">
          Mode fantôme actif
        </span>
        <span className="hidden sm:inline text-muted-foreground truncate">
          — Discussion temporaire non enregistrée. Génération d'image
          indisponible.
        </span>
      </div>
      {isNewChatInput ? (
        <button
          className="text-xs font-medium text-purple-400 hover:text-purple-300 underline shrink-0 ml-auto cursor-pointer"
          onClick={toggleGhostMode}
          type="button"
        >
          Désactiver
        </button>
      ) : null}
    </div>
  );
}

export function QuotaBanner({
  costPercent,
  costAiUsed,
  costAiLimit,
  liveSessionTokens,
}: {
  costPercent: number;
  costAiUsed: number;
  costAiLimit: number;
  liveSessionTokens: number;
}) {
  return (
    <div
      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-[11px] ${costPercent >= 90 ? "bg-red-500/10 border-red-500/30 text-red-600" : costPercent >= 75 ? "bg-amber-500/10 border-amber-500/30 text-amber-600" : "bg-muted/30 border-border/40 text-muted-foreground"}`}
    >
      <span className="font-semibold flex items-center gap-1">
        {costPercent >= 90 ? (
          <TriangleAlertIcon className="size-3.5 shrink-0" />
        ) : null}
        {costPercent >= 90 ? "Quota mAI à " : "Quota mAI: "}
        {costPercent}%
      </span>
      <span className="font-mono text-[10px]">
        {costAiUsed}/{costAiLimit} tokens
      </span>
      <span className="hidden sm:inline">
        {liveSessionTokens > 0 ? `(+${liveSessionTokens} cette session)` : ""}
      </span>
      <span className="ml-auto hidden sm:inline text-[10px]">
        {costPercent >= 90 ? "Mise à niveau recommandée" : ""}
      </span>
    </div>
  );
}

export function EditingBanner({ onCancelEdit }: { onCancelEdit?: () => void }) {
  return (
    <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
      <span>Editing message</span>
      <button
        className="rounded px-1.5 py-0.5 text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
        onMouseDown={(e) => {
          e.preventDefault();
          onCancelEdit?.();
        }}
        type="button"
      >
        Cancel
      </button>
    </div>
  );
}

export function NoToolsWarning() {
  return (
    <div className="mb-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-[11.5px] text-amber-700 dark:text-amber-400">
      <TriangleAlertIcon className="size-3.5 shrink-0" />
      <span>
        Ce modèle ne prend pas en charge les outils (tools). Les MCP,
        compétences et outils système sont désactivés.
      </span>
    </div>
  );
}
