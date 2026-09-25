"use client";

import { motion } from "framer-motion";
import { AlertTriangleIcon, Settings2Icon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { AgentComposerSubmit } from "@/components/agent/agent-composer";
import { AgentComposer } from "@/components/agent/agent-composer";
import { AgentChannelNotice } from "@/components/agent/alpha-badge";
import type { SharedModel } from "@/components/chat/model-selector-compact";
import type { AgentRequestOptions } from "@/hooks/use-agent-chat";
import type { ProjectLite } from "@/hooks/use-projects";
import { AGENT_HOME_TITLE } from "@/lib/agent/channel";
import type { AgentFlags } from "@/lib/agent/flags";
import type { ModelCapabilities } from "@/lib/ai/registry/capabilities";

// Page d'accueil d'Agent : une seule intention, une seule zone de saisie. Les
// réglages secondaires (projet, fichiers, outils, modèle, réflexion) vivent
// dans des menus du composer, jamais encombrés sur l'écran.
export function AgentHome({
  capabilities,
  flags,
  isRunning,
  modeSwitcher,
  modelCompatibilityKnown,
  modelIsCompatible,
  modelId,
  models,
  onModelChange,
  onOptionsChange,
  onProjectChange,
  onStop,
  onSubmit,
  options,
  project,
}: {
  capabilities: ModelCapabilities;
  flags: AgentFlags;
  isRunning: boolean;
  /**
   * Sélecteur Chat | Agent (HomeModeSwitcher), rendu en tête de la pile
   * centrée : même contrôle et même position que sur l'accueil Chat.
   */
  modeSwitcher?: ReactNode;
  modelCompatibilityKnown: boolean;
  modelIsCompatible: boolean;
  modelId: string;
  models: SharedModel[];
  onModelChange: (id: string) => void;
  onOptionsChange: (patch: Partial<AgentRequestOptions>) => void;
  onProjectChange: (project: ProjectLite | null) => void;
  onStop: () => void;
  onSubmit: (payload: AgentComposerSubmit) => void;
  options: AgentRequestOptions;
  project: ProjectLite | null;
}) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-3 py-8">
      {/* Premier élément de la pile : l'écart avec le titre vaut gap-6 (24 px)
          + mb-2 (8 px) = 32 px, soit exactement la marge utilisée par la pile
          d'accueil du Chat (mb-8). */}
      {modeSwitcher ? <div className="mb-2">{modeSwitcher}</div> : null}

      {modelCompatibilityKnown && !modelIsCompatible ? (
        <div
          className="flex w-full items-start gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-left text-xs leading-5 text-amber-900 dark:text-amber-200"
          role="status"
        >
          <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
          <span>
            Le modèle sélectionné ne peut pas exécuter la boucle d&apos;outils
            Agent. Choisissez un modèle compatible pour continuer.
          </span>
        </div>
      ) : null}

      <motion.h1
        animate={{ opacity: 1, y: 0 }}
        className="text-center text-2xl font-semibold tracking-tight text-balance sm:text-3xl"
        initial={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        {AGENT_HOME_TITLE}
      </motion.h1>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.08, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <AgentComposer
          capabilities={capabilities}
          flags={flags}
          isRunning={isRunning}
          modelId={modelId}
          modelIsCompatible={modelIsCompatible || !modelCompatibilityKnown}
          models={models}
          onModelChange={onModelChange}
          onOptionsChange={onOptionsChange}
          onProjectChange={onProjectChange}
          onStop={onStop}
          onSubmit={onSubmit}
          options={options}
          project={project}
        />
      </motion.div>

      <div className="flex flex-col items-center gap-2">
        <AgentChannelNotice />
        <Link
          className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground transition-colors hover:text-foreground"
          href="/settings/agent"
        >
          <Settings2Icon className="size-3" />
          Paramètres Agent
        </Link>
      </div>
    </div>
  );
}
