/**
 * ============================================================================
 * VIBE — PARAMÈTRES DU FIL D'ACTUALITÉ (components/vibe/settings/FeedSettingsSection.tsx)
 * Section Paramètres : Mode par défaut du flux, masquage des reposts et mots-clés bloqués.
 * ============================================================================
 */

import { SlidersIcon as Sliders } from "@mdevs/icons";
import type React from "react";

export interface FeedSettingsSectionProps {
  feedDefaultMode: "for_you" | "stream" | "trending";
  setFeedDefaultMode: (mode: "for_you" | "stream" | "trending") => void;
  hideReposts: boolean;
  setHideReposts: (hide: boolean) => void;
  blockedKeywords: string;
  setBlockedKeywords: (keywords: string) => void;
}

export const FeedSettingsSection: React.FC<FeedSettingsSectionProps> = ({
  feedDefaultMode,
  setFeedDefaultMode,
  hideReposts,
  setHideReposts,
  blockedKeywords,
  setBlockedKeywords,
}) => {
  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-4">
      <div className="flex items-center gap-2 text-white font-bold text-sm">
        <Sliders className="w-4 h-4 text-white" />
        <span>Personnalisation des Fils d’actualité</span>
      </div>

      <div className="space-y-4 text-xs">
        <div className="space-y-1.5">
          <label className="text-zinc-400 font-mono uppercase text-[11px]">
            Fil d'actualité par défaut
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "for_you", label: "Pour Vous (IA)" },
              { id: "stream", label: "Abonnements" },
              { id: "trending", label: "Tendances" },
            ].map((mode) => (
              <button
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  feedDefaultMode === mode.id
                    ? "bg-white text-black border-white"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                }`}
                key={mode.id}
                onClick={() => setFeedDefaultMode(mode.id as any)}
                type="button"
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
          <div>
            <span className="font-semibold text-white">
              Masquer les repartages (reposts)
            </span>
            <p className="text-zinc-500 text-[11px]">
              N'affiche que les publications originales dans votre flux
            </p>
          </div>
          <input
            checked={hideReposts}
            className="w-4 h-4 accent-white cursor-pointer"
            onChange={(e) => setHideReposts(e.target.checked)}
            type="checkbox"
          />
        </div>

        <div className="space-y-1.5 pt-2 border-t border-zinc-900">
          <label className="text-zinc-400 font-mono uppercase text-[11px]">
            Mots-clés &amp; #Hashtags masqués
          </label>
          <input
            className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
            onChange={(e) => setBlockedKeywords(e.target.value)}
            placeholder="spoilers, politique, crypto (séparés par des virgules)"
            type="text"
            value={blockedKeywords}
          />
        </div>
      </div>
    </div>
  );
};
