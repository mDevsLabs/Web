/**
 * Panneau de réflexion Vibe.
 *
 * La réflexion est arrivée du fournisseur (OpenRouter) et a été persistée dans
 * `mai_messages.reasoning` ; ce composant ne fait que la rendre repliable. Les
 * classes suivent le thème de Vibe (`vibe-dark:`), jamais celui de l'hôte.
 */

import {
  BrainIcon as Brain,
  ChevronDownIcon as ChevronDown,
} from "@mdevs/icons";
import { useState } from "react";

export function MaiReasoning({
  text,
  defaultOpen = false,
}: {
  text?: string | null;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const value = (text ?? "").trim();
  if (!value) {
    return null;
  }
  return (
    <details
      className="mt-2.5 rounded-xl border border-zinc-200 vibe-dark:border-zinc-700/80 bg-black/5 vibe-dark:bg-zinc-900/40 overflow-hidden"
      onToggle={(event) => setOpen(event.currentTarget.open)}
      open={open}
    >
      <summary className="flex cursor-pointer items-center gap-2 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-zinc-500 hover:bg-black/5 vibe-dark:hover:bg-zinc-900/60">
        <Brain className="w-3 h-3 shrink-0" />
        Réflexion
        <ChevronDown
          className={`ml-auto w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </summary>
      <div className="max-h-64 overflow-y-auto border-t border-zinc-200 vibe-dark:border-zinc-800 px-2.5 py-2 text-[11px] leading-relaxed whitespace-pre-wrap text-zinc-600 vibe-dark:text-zinc-300">
        {value}
      </div>
    </details>
  );
}
