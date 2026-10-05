/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — CHIPS D'OUTILS mAI (src/components/mai/MaiToolChips.tsx)
 * Affiche les outils utilisés par mAI (persistés dans mai_messages.tool_calls) :
 * nom lisible, statut, arguments et résultat repliables, image éventuelle.
 * Partagé par la page Studio mAI et le drawer latéral.
 * ============================================================================
 */

import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  MinusCircle,
  Sparkles,
  XCircle,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { FALLBACK_MAI_TOOLS } from "@/lib/vibe/data/maiTools";
import type { MaiToolCall } from "@/lib/vibe/types/vibe";

const toolLabel = (id: string) =>
  FALLBACK_MAI_TOOLS.find((t) => t.id === id)?.name || id;

const STATUS_META: Record<
  string,
  { icon: React.ReactNode; label: string; className: string }
> = {
  blocked: {
    className: "text-zinc-500",
    icon: <MinusCircle className="w-3 h-3" />,
    label: "bloqué",
  },
  disabled: {
    className: "text-zinc-500",
    icon: <MinusCircle className="w-3 h-3" />,
    label: "désactivé",
  },
  error: {
    className: "text-red-500",
    icon: <XCircle className="w-3 h-3" />,
    label: "erreur",
  },
  executed: {
    className: "text-emerald-500",
    icon: <CheckCircle2 className="w-3 h-3" />,
    label: "exécuté",
  },
  pending_approval: {
    className: "text-amber-500",
    icon: <Clock className="w-3 h-3" />,
    label: "en attente",
  },
  rejected: {
    className: "text-zinc-500",
    icon: <XCircle className="w-3 h-3" />,
    label: "refusé",
  },
};

export const MaiToolChips: React.FC<{
  toolCalls?: MaiToolCall[] | null;
  className?: string;
}> = ({ toolCalls, className }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const list = Array.isArray(toolCalls) ? toolCalls.filter(Boolean) : [];
  if (list.length === 0) return null;

  return (
    <div className={`flex flex-col gap-1.5 ${className || ""}`}>
      {list.map((call, idx) => {
        const key = call.id || `${call.name}-${idx}`;
        const open = Boolean(expanded[key]);
        const meta = STATUS_META[call.status] || STATUS_META.executed;
        const imageUrl = call.result?.result?.imageUrl || null;
        const hasArgs = call.args && Object.keys(call.args).length > 0;
        return (
          <div
            className="rounded-xl border border-zinc-200 vibe-dark:border-zinc-700/80 overflow-hidden bg-black/5 vibe-dark:bg-zinc-900/40"
            key={key}
          >
            <button
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left hover:bg-black/5 vibe-dark:hover:bg-zinc-900/60 transition-colors"
              onClick={() => setExpanded((p) => ({ ...p, [key]: !open }))}
              type="button"
            >
              {open ? (
                <ChevronDown className="w-3 h-3 shrink-0" />
              ) : (
                <ChevronRight className="w-3 h-3 shrink-0" />
              )}
              <Sparkles className="w-3 h-3 shrink-0 text-zinc-500" />
              <span className="text-[10px] font-bold truncate flex-1">
                {toolLabel(call.name)}
              </span>
              <span
                className={`flex items-center gap-1 shrink-0 text-[9px] font-bold ${meta.className}`}
              >
                {meta.icon}
                {meta.label}
              </span>
            </button>
            {open && (
              <div className="px-2.5 pb-2 space-y-1.5 text-[10px]">
                {hasArgs && (
                  <pre className="font-mono whitespace-pre-wrap break-all max-h-32 overflow-y-auto opacity-80">
                    {JSON.stringify(call.args, null, 2)}
                  </pre>
                )}
                {call.result && (
                  <pre className="font-mono whitespace-pre-wrap break-all max-h-40 overflow-y-auto border-t border-zinc-200 vibe-dark:border-zinc-800 pt-1.5">
                    {JSON.stringify(call.result, null, 2)}
                  </pre>
                )}
                {call.error && (
                  <p className="text-red-500 font-semibold">{call.error}</p>
                )}
                {imageUrl && (
                  <img
                    alt="Résultat de l'outil"
                    className="w-full max-h-48 object-cover rounded-lg border border-zinc-200 vibe-dark:border-zinc-800"
                    src={imageUrl}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
