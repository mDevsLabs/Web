/**
 * ============================================================================
 * VIBE — APPARENCE & LANGUE (components/vibe/settings/AppearanceSettingsSection.tsx)
 * Section Paramètres : Thème clair/sombre/système, thème programmé, taille de texte,
 * couleur d'accent et langue de traduction.
 * ============================================================================
 */

import {
  CheckIcon as Check,
  LanguagesIcon as Languages,
  LaptopIcon as Laptop,
  MoonIcon as Moon,
  PaletteIcon as Palette,
  SunIcon as Sun,
  TypeIcon as Type,
} from "@mdevs/icons";
import type React from "react";
import { ACCENT_COLORS, useTheme } from "@/lib/vibe/context/ThemeContext";
import {
  browserToDeepLCode,
  TRANSLATION_LANGUAGES,
} from "@/lib/vibe/services/api";

export interface AppearanceSettingsSectionProps {
  setUiLanguage: (lang: string) => void;
  uiLanguage: string;
}

export const AppearanceSettingsSection: React.FC<
  AppearanceSettingsSectionProps
> = ({ uiLanguage, setUiLanguage }) => {
  const {
    theme,
    setTheme,
    accentColor,
    setAccentColor,
    fontSize,
    setFontSize,
    scheduledTheme,
    setScheduledTheme,
  } = useTheme();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Section 0: Apparence & Thème d'affichage */}
      <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-4 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Sun className="w-4 h-4 text-white" />
              <span>Apparence & Thème</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full uppercase">
              Par défaut : Clair
            </span>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            Choisissez l’affichage qui vous convient le mieux. Le thème clair
            est défini par défaut, ou optez pour le thème système ou sombre.
          </p>

          <div className="grid grid-cols-3 gap-2.5">
            {[
              {
                badge: "Par défaut",
                icon: Sun,
                iconColor: "text-zinc-200",
                id: "light",
                label: "Clair",
                previewBg: "bg-white border-zinc-200 text-zinc-900",
              },
              {
                badge: "Auto OS",
                icon: Laptop,
                iconColor: "text-zinc-200",
                id: "system",
                label: "Système",
                previewBg:
                  "bg-gradient-to-r from-white to-zinc-900 border-zinc-500 text-zinc-800",
              },
              {
                badge: "Nuit",
                icon: Moon,
                iconColor: "text-zinc-200",
                id: "dark",
                label: "Sombre",
                previewBg: "bg-zinc-950 border-zinc-800 text-white",
              },
            ].map((item) => {
              const isSelected = theme === item.id;
              const IconComponent = item.icon;
              return (
                <button
                  className={`relative p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 min-h-[96px] ${
                    isSelected
                      ? "bg-zinc-900 border-white text-white shadow-lg ring-1 ring-white/30"
                      : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white"
                  }`}
                  key={item.id}
                  onClick={() => setTheme(item.id as any)}
                  type="button"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="p-1.5 rounded-xl bg-zinc-800/80">
                      <IconComponent className={`w-4 h-4 ${item.iconColor}`} />
                    </div>
                    {isSelected ? (
                      <div className="w-4 h-4 rounded-full bg-white text-black flex items-center justify-center shadow">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-zinc-700" />
                    )}
                  </div>

                  <div>
                    <div className="font-bold text-xs text-white">
                      {item.label}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono">
                      {item.badge}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Thème programmé (bascule automatique) */}
        <div className="space-y-2.5 pt-3 border-t border-zinc-900">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-zinc-200 font-bold text-xs flex items-center gap-1.5">
                <Moon className="w-3 h-3 text-zinc-400" /> Thème programmé
              </p>
              <p className="text-zinc-500 text-[11px]">
                Bascule automatique clair/sombre (ex. 22h–7h = sombre). Inactif
                en mode « Système ».
              </p>
            </div>
            <input
              checked={scheduledTheme.enabled}
              className="w-4 h-4 accent-white cursor-pointer ml-3 shrink-0"
              onChange={(e) =>
                setScheduledTheme({
                  ...scheduledTheme,
                  enabled: e.target.checked,
                })
              }
              type="checkbox"
            />
          </div>
          {scheduledTheme.enabled && (
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1">
                <span className="text-[10px] font-mono uppercase text-zinc-500">
                  Sombre dès
                </span>
                <input
                  className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-zinc-500 text-xs"
                  onChange={(e) =>
                    setScheduledTheme({
                      ...scheduledTheme,
                      darkStart: e.target.value || "22:00",
                    })
                  }
                  type="time"
                  value={scheduledTheme.darkStart}
                />
              </label>
              <label className="space-y-1">
                <span className="text-[10px] font-mono uppercase text-zinc-500">
                  Clair dès
                </span>
                <input
                  className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-zinc-500 text-xs"
                  onChange={(e) =>
                    setScheduledTheme({
                      ...scheduledTheme,
                      darkEnd: e.target.value || "07:00",
                    })
                  }
                  type="time"
                  value={scheduledTheme.darkEnd}
                />
              </label>
            </div>
          )}
        </div>

        {/* Taille du texte */}
        <div className="space-y-2 pt-3 border-t border-zinc-900">
          <label className="text-zinc-400 font-mono uppercase text-[11px] flex items-center gap-1.5">
            <Type className="w-3 h-3 text-zinc-400" /> Taille du texte
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: "small", label: "Petite", sample: "text-[11px]" },
                { id: "medium", label: "Moyenne", sample: "text-xs" },
                { id: "large", label: "Grande", sample: "text-sm" },
              ] as const
            ).map((s) => (
              <button
                className={`py-2 px-3 rounded-xl border font-semibold transition-all flex flex-col items-center gap-0.5 ${
                  fontSize === s.id
                    ? "bg-white text-black border-white"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                }`}
                key={s.id}
                onClick={() => setFontSize(s.id as any)}
                type="button"
              >
                <span className={s.sample}>Aa</span>
                <span className="text-[10px]">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Section 0b & 0c: Accent & Langue de traduction */}
      <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-4 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Palette className="w-4 h-4 text-white" />
            <span>Personnalisation & Langue</span>
          </div>

          {/* Couleur d'accent */}
          <div className="space-y-2">
            <label className="text-zinc-400 font-mono uppercase text-[11px] flex items-center justify-between">
              <span>Couleur d'accent</span>
              <span className="text-zinc-500 font-normal lowercase">
                {ACCENT_COLORS[accentColor]?.label || accentColor}
              </span>
            </label>
            <p className="text-zinc-500 text-[11px]">
              Boutons d'action et éléments interactifs clés.
            </p>
            <div className="flex flex-wrap gap-2.5 pt-1">
              {(
                Object.keys(ACCENT_COLORS) as Array<keyof typeof ACCENT_COLORS>
              ).map((key) => {
                const c = ACCENT_COLORS[key];
                const isSelected = accentColor === key;
                return (
                  <button
                    className={`relative w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                      isSelected
                        ? "border-white shadow-lg ring-1 ring-white/50"
                        : "border-zinc-700"
                    }`}
                    key={key}
                    onClick={() => setAccentColor(key as any)}
                    style={{ backgroundColor: c.hex }}
                    title={c.label}
                    type="button"
                  >
                    {isSelected && (
                      <Check className="w-4 h-4 text-black stroke-[3] absolute inset-0 m-auto" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Langue de traduction */}
        <div className="space-y-2 pt-3 border-t border-zinc-900">
          <div className="flex items-center justify-between">
            <label className="text-zinc-400 font-mono uppercase text-[11px] flex items-center gap-1.5">
              <Languages className="w-3 h-3 text-zinc-400" /> Langue de
              traduction
            </label>
            <span className="text-[10px] font-mono text-zinc-500 uppercase">
              Auto :{" "}
              {browserToDeepLCode(
                typeof navigator === "undefined" ? "" : navigator.language
              )}
            </span>
          </div>
          <p className="text-zinc-500 text-[11px]">
            Langue cible du bouton « Traduire » sur les publications et
            réponses.
          </p>
          <select
            className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-zinc-500 text-xs"
            onChange={(e) => setUiLanguage(e.target.value)}
            value={uiLanguage}
          >
            <option value="">Langue du navigateur (automatique)</option>
            {TRANSLATION_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
