/**
 * ============================================================================
 * VIBE — PARAMÈTRES DE MODÉRATION (components/vibe/settings/ModerationSettingsSection.tsx)
 * Section Paramètres : Filtre IA de toxicité et floutage des médias sensibles.
 * ============================================================================
 */

import { EyeOffIcon as EyeOff } from "@mdevs/icons";
import type React from "react";

export interface ModerationSettingsSectionProps {
  contentFilter: "low" | "medium" | "strict";
  setContentFilter: (filter: "low" | "medium" | "strict") => void;
  blurSensitive: boolean;
  setBlurSensitive: (blur: boolean) => void;
}

export const ModerationSettingsSection: React.FC<
  ModerationSettingsSectionProps
> = ({
  contentFilter,
  setContentFilter,
  blurSensitive,
  setBlurSensitive,
}) => {
  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-4">
      <div className="flex items-center gap-2 text-white font-bold text-sm">
        <EyeOff className="w-4 h-4 text-white" />
        <span>Modération du contenu</span>
      </div>

      <div className="space-y-4 text-xs">
        <div className="space-y-1.5">
          <label className="text-zinc-400 font-mono uppercase text-[11px]">
            Filtre IA de toxicité
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(["low", "medium", "strict"] as const).map((lvl) => (
              <button
                className={`py-2 px-3 rounded-xl border text-xs font-semibold capitalize transition-all ${
                  contentFilter === lvl
                    ? "bg-white text-black border-white"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                }`}
                key={lvl}
                onClick={() => setContentFilter(lvl)}
                type="button"
              >
                {lvl === "low"
                  ? "Léger"
                  : lvl === "medium"
                    ? "Modéré"
                    : "Strict"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
          <div>
            <span className="font-semibold text-white">
              Flouter les médias sensibles
            </span>
            <p className="text-zinc-500 text-[11px]">
              Affiche un filtre d'avertissement sur les images sensibles
            </p>
          </div>
          <input
            checked={blurSensitive}
            className="w-4 h-4 accent-white cursor-pointer"
            onChange={(e) => setBlurSensitive(e.target.checked)}
            type="checkbox"
          />
        </div>
      </div>
    </div>
  );
};
