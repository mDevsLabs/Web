/**
 * Panneau de réflexion Vibe.
 *
 * La réflexion est arrivée du fournisseur (OpenRouter) et a été persistée dans
 * `mai_messages.reasoning` ; ce composant la rend en Markdown, repliable.
 * Les classes suivent le thème de Vibe (`vibe-dark:`), jamais celui de l'hôte.
 */

import {
  BrainIcon as Brain,
  ChevronDownIcon as ChevronDown,
} from "@mdevs/icons";
import { useState } from "react";
import { renderRichMarkdown } from "@/components/vibe/common/richMarkdown";
import { sanitizeRichHtml } from "@/components/vibe/common/richSanitizer";

export function MaiReasoning({
  text,
  defaultOpen = false,
}: {
  text?: string | null;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [copied, setCopied] = useState(false);
  const value = (text ?? "").trim();
  if (!value) {
    return null;
  }
  const html = sanitizeRichHtml(renderRichMarkdown(value));
  return (
    <div className="mt-2.5 overflow-hidden rounded-xl border border-zinc-200 bg-black/5 vibe-dark:border-zinc-700/80 vibe-dark:bg-zinc-900/40">
      <div className="flex items-center gap-2 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
        <button
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left hover:text-zinc-700 vibe-dark:hover:text-zinc-300"
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          <Brain className="h-3 w-3 shrink-0" />
          Réflexion
          <ChevronDown
            className={`ml-auto h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        <button
          className="shrink-0 text-[10px] font-semibold normal-case tracking-normal text-zinc-500 hover:text-zinc-800 vibe-dark:hover:text-zinc-200"
          onClick={() => {
            navigator.clipboard
              .writeText(value)
              .then(() => {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 2000);
              })
              .catch(() => {});
          }}
          type="button"
        >
          {copied ? "Copié" : "Copier"}
        </button>
      </div>
      {open ? (
        <div
          className="border-t border-zinc-200 px-2.5 py-2 text-[11px] leading-relaxed text-zinc-600 vibe-dark:border-zinc-800 vibe-dark:text-zinc-300"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: HTML produit par renderRichMarkdown puis sanitizeRichHtml.
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : null}
    </div>
  );
}
