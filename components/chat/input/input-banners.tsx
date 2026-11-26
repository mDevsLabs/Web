"use client";

import { GhostIcon, TriangleAlertIcon } from "@mdevs/icons";

export function GhostBanner({
  toggleGhostMode,
}: {
  toggleGhostMode: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-warning/30 bg-warning/10 text-xs shadow-xs">
      <div className="flex items-center gap-2 min-w-0">
        <GhostIcon className="size-4 shrink-0 text-warning animate-pulse" />
        <span className="font-semibold text-foreground shrink-0">
          Mode fantôme actif
        </span>
        <span className="hidden sm:inline text-muted-foreground truncate">
          — Discussion temporaire non enregistrée. Génération d'image
          indisponible.
        </span>
      </div>
      {/* Le bouton était conditionné à `isNewChatInput` : activé dans une
          conversation enregistrée, le mode fantôme restait actif sans aucun
          moyen de le couper, sinon qu'en recréant une discussion. Le garde
          n'avait aucune raison d'être — la bannière n'apparaît que si le mode
          est actif. */}
      <button
        className="text-xs font-medium text-warning hover:brightness-110 underline shrink-0 ml-auto cursor-pointer"
        onClick={toggleGhostMode}
        type="button"
      >
        Désactiver
      </button>
    </div>
  );
}

export function QuotaBanner({
  costPercent,
  tierLabel,
}: {
  costPercent: number;
  costAiUsed?: number;
  costAiLimit?: number;
  liveSessionTokens?: number;
  tierLabel?: string;
}) {
  const isDanger = costPercent >= 90;
  const isWarn = costPercent >= 75 && !isDanger;
  return (
    <div
      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-[11px] ${
        isDanger
          ? "bg-destructive/10 border-destructive/30 text-destructive"
          : isWarn
            ? "bg-warning/10 border-warning/30 text-warning"
            : "bg-muted/30 border-border/40 text-muted-foreground"
      }`}
    >
      <span className="font-semibold flex items-center gap-1.5">
        {isDanger ? <TriangleAlertIcon className="size-3.5 shrink-0" /> : null}
        Usage hebdomadaire{tierLabel ? ` (${tierLabel})` : ""} : {costPercent}%
      </span>
      <div className="hidden sm:block h-1.5 w-16 overflow-hidden rounded-full bg-muted/60">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isDanger ? "bg-destructive" : isWarn ? "bg-warning" : "bg-primary"
          }`}
          style={{ width: `${Math.min(100, costPercent)}%` }}
        />
      </div>
      <span className="ml-auto text-[10px]">
        {costPercent >= 100
          ? "Limite atteinte"
          : costPercent >= 90
            ? "Mise à niveau recommandée"
            : "Renouvelé lundi"}
      </span>
    </div>
  );
}

export function EditingBanner({ onCancelEdit }: { onCancelEdit?: () => void }) {
  return (
    <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
      <span>Modification du message</span>
      <button
        className="rounded px-1.5 py-0.5 text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
        onMouseDown={(e) => {
          e.preventDefault();
          onCancelEdit?.();
        }}
        type="button"
      >
        Annuler
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
