/**
 * ============================================================================
 * VIBE — PARAMÈTRES IA mAI (components/vibe/settings/MaiSettingsSection.tsx)
 * Section Paramètres : Modèles, voix TTS, contexte, catalogue d'outils mAI et approbation.
 * ============================================================================
 */

import {
  CpuIcon as Cpu,
  Loader2Icon as Loader2,
  SparklesIcon as Sparkles,
  Volume2Icon as Volume2,
  WrenchIcon as Wrench,
} from "@mdevs/icons";
import type React from "react";

export interface MaiSettingsSectionProps {
  maiAutoApproveTools: boolean;
  setMaiAutoApproveTools: (val: boolean) => void;
  postsAIGeneratedByDefault: boolean;
  setPostsAIGeneratedByDefault: (val: boolean) => void;
  maiContextPosts: boolean;
  setMaiContextPosts: (val: boolean) => void;
  maiContextDms: boolean;
  setMaiContextDms: (val: boolean) => void;
  maiContextBooks: boolean;
  setMaiContextBooks: (val: boolean) => void;
  maiDefaultModel: string;
  setMaiDefaultModel: (val: string) => void;
  models: Array<{ id: string; name: string; provider?: string }>;
  maiTtsVoice: string;
  setMaiTtsVoice: (val: string) => void;
  voices: Array<{ id: string; name: string }>;
  maiCatalog: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    sensitive: boolean;
    slash_command: string;
  }>;
  maiEnabledTools: string[];
  setMaiEnabledTools: React.Dispatch<React.SetStateAction<string[]>>;
  maiToolsLoaded: boolean;
}

export const MaiSettingsSection: React.FC<MaiSettingsSectionProps> = ({
  maiAutoApproveTools,
  setMaiAutoApproveTools,
  postsAIGeneratedByDefault,
  setPostsAIGeneratedByDefault,
  maiContextPosts,
  setMaiContextPosts,
  maiContextDms,
  setMaiContextDms,
  maiContextBooks,
  setMaiContextBooks,
  maiDefaultModel,
  setMaiDefaultModel,
  models,
  maiTtsVoice,
  setMaiTtsVoice,
  voices,
  maiCatalog,
  maiEnabledTools,
  setMaiEnabledTools,
  maiToolsLoaded,
}) => {
  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-4">
      <div className="flex items-center gap-2 text-white font-bold text-sm">
        <Sparkles className="w-4 h-4 text-white" />
        <span>Intelligence Artificielle mAI</span>
      </div>

      <div className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800">
            <div>
              <span className="font-semibold text-white">
                Approbation auto des outils mAI
              </span>
              <p className="text-zinc-500 text-[11px]">
                Exécuter ses requêtes sans confirmation manuelle
              </p>
            </div>
            <input
              checked={maiAutoApproveTools}
              className="w-4 h-4 accent-white cursor-pointer ml-3 shrink-0"
              onChange={(e) => setMaiAutoApproveTools(e.target.checked)}
              type="checkbox"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800">
            <div>
              <span className="font-semibold text-white">
                Posts marqués IA par défaut
              </span>
              <p className="text-zinc-500 text-[11px]">
                Badge « Créé avec l'IA » activé automatiquement
              </p>
            </div>
            <input
              checked={postsAIGeneratedByDefault}
              className="w-4 h-4 accent-white cursor-pointer ml-3 shrink-0"
              onChange={(e) => setPostsAIGeneratedByDefault(e.target.checked)}
              type="checkbox"
            />
          </div>
        </div>

        {/* mAI — personnalisation du contexte (opt-in) */}
        <div className="space-y-2.5 pt-3 border-t border-zinc-900">
          <p className="text-zinc-200 font-bold text-xs flex items-center gap-1.5">
            <Cpu className="w-3 h-3 text-zinc-400" /> mAI — Personnalisation du
            contexte
          </p>
          <p className="text-zinc-500 text-[11px]">
            Autorisez mAI à connaître vos contenus pour des réponses plus
            personnalisées.
          </p>
          <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <span className="text-xs text-zinc-300">Mes publications</span>
            <input
              checked={maiContextPosts}
              className="w-4 h-4 accent-white cursor-pointer shrink-0"
              onChange={(e) => setMaiContextPosts(e.target.checked)}
              type="checkbox"
            />
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-zinc-300">Mes messages privés</span>
              <input
                checked={maiContextDms}
                className="w-4 h-4 accent-white cursor-pointer shrink-0"
                onChange={(e) => setMaiContextDms(e.target.checked)}
                type="checkbox"
              />
            </div>
            <p className="text-[11px] text-amber-600 vibe-dark:text-amber-400/90">
              ⚠️ Confidentiel : seuls des extraits tronqués sont transmis à mAI,
              jamais cités verbatim.
            </p>
          </div>
          <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <span className="text-xs text-zinc-300">Mes Vibe Books</span>
            <input
              checked={maiContextBooks}
              className="w-4 h-4 accent-white cursor-pointer shrink-0"
              onChange={(e) => setMaiContextBooks(e.target.checked)}
              type="checkbox"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-900">
          {/* Modèle mAI par défaut */}
          <div className="space-y-1.5">
            <label className="text-zinc-400 font-mono uppercase text-[11px] flex items-center gap-1.5">
              <Cpu className="w-3 h-3 text-zinc-400" />
              Modèle mAI par défaut
            </label>
            {models.length > 0 ? (
              <select
                className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-zinc-500 text-xs"
                onChange={(e) => setMaiDefaultModel(e.target.value)}
                value={maiDefaultModel}
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                    {m.provider ? ` — ${m.provider}` : ""}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-2 text-zinc-500 py-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Chargement des modèles…</span>
              </div>
            )}
            <p className="text-zinc-600 text-[10px] font-mono truncate">
              {maiDefaultModel}
            </p>
          </div>

          {/* Voix de lecture mAI */}
          <div className="space-y-1.5">
            <label className="text-zinc-400 font-mono uppercase text-[11px] flex items-center gap-1.5">
              <Volume2 className="w-3 h-3 text-zinc-400" />
              Voix de lecture mAI
            </label>
            {voices.length > 0 ? (
              <select
                className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-zinc-500 text-xs"
                onChange={(e) => setMaiTtsVoice(e.target.value)}
                value={maiTtsVoice}
              >
                {voices.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name || v.id}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-2 text-zinc-500 py-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Chargement des voix…</span>
              </div>
            )}
          </div>
        </div>

        {/* Outils mAI disponibles (catalogue lib/tools/index.json) */}
        <div className="space-y-2.5 pt-3 border-t border-zinc-900">
          <div className="flex items-center justify-between gap-3">
            <p className="text-zinc-200 font-bold text-xs flex items-center gap-1.5">
              <Wrench className="w-3 h-3 text-zinc-400" /> Outils disponibles
              pour mAI
            </p>
            <button
              className="text-[10px] font-bold text-zinc-400 hover:text-white underline underline-offset-2"
              onClick={() =>
                setMaiEnabledTools((prev) =>
                  prev.length === maiCatalog.length
                    ? []
                    : maiCatalog.map((t) => t.id)
                )
              }
              type="button"
            >
              {maiEnabledTools.length === maiCatalog.length
                ? "Tout désélectionner"
                : "Tout sélectionner"}
            </button>
          </div>
          <p className="text-zinc-500 text-[11px]">
            Choisissez les outils que mAI peut utiliser en votre nom. Les outils
            sensibles restent soumis à l'approbation ci-dessus.
          </p>
          {maiToolsLoaded ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {maiCatalog.map((tool) => {
                const checked = maiEnabledTools.includes(tool.id);
                return (
                  <label
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                      checked
                        ? "bg-zinc-900 border-zinc-600"
                        : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700"
                    }`}
                    key={tool.id}
                  >
                    <input
                      checked={checked}
                      className="w-4 h-4 accent-white cursor-pointer mt-0.5 shrink-0"
                      onChange={() =>
                        setMaiEnabledTools((prev) =>
                          prev.includes(tool.id)
                            ? prev.filter((id) => id !== tool.id)
                            : [...prev, tool.id]
                        )
                      }
                      type="checkbox"
                    />
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-white">
                          {tool.name}
                        </span>
                        {tool.sensitive && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 vibe-dark:text-amber-400 font-bold">
                            sensible
                          </span>
                        )}
                      </span>
                      <span className="block text-[10px] text-zinc-500 font-mono">
                        {tool.slash_command}
                      </span>
                      <span className="block text-[11px] text-zinc-400 line-clamp-2">
                        {tool.description}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-zinc-500 py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Chargement du catalogue…</span>
            </div>
          )}
          <p className="text-zinc-600 text-[10px]">
            {maiEnabledTools.length}/{maiCatalog.length} outils activés
          </p>
        </div>
      </div>
    </div>
  );
};
