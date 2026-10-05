/**
 * ============================================================================
 * VIBE — APPARENCE DES DISCUSSIONS (src/components/settings/ChatAppearanceSection.tsx)
 * Section Paramètres : personnalisation des discussions privées (couleur et
 * dégradés des bulles envoyées, fond d'écran, forme des bulles) avec aperçu
 * en direct. Lit et écrit directement le thème via `useTheme`.
 * ============================================================================
 */

import { Check, CheckCheck, MessageSquare } from "lucide-react";
import type React from "react";
import {
  CHAT_BACKGROUND_THEMES,
  type ChatBackgroundTheme,
  MESSAGE_BUBBLE_SHAPES,
  MESSAGE_BUBBLE_THEMES,
  type MessageBubbleShape,
  type MessageBubbleTheme,
  useTheme,
} from "@/lib/vibe/context/ThemeContext";

export const ChatAppearanceSection: React.FC = () => {
  const {
    messageBubbleTheme,
    setMessageBubbleTheme,
    chatBackgroundTheme,
    setChatBackgroundTheme,
    messageBubbleShape,
    setMessageBubbleShape,
  } = useTheme();

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
          <MessageSquare className="w-5 h-5 text-white" />
          <span>Personnalisation des discussions & messages</span>
        </div>
        <span className="text-[10px] sm:text-[11px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-full">
          Aperçu en direct
        </span>
      </div>

      <p className="text-xs text-zinc-400 leading-relaxed">
        Personnalisez l'apparence de vos conversations privées : couleur et
        dégradés des bulles envoyées, fond d'écran du chat et forme des bulles.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Contrôles (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Couleur / Dégradé des bulles envoyées */}
          <div className="space-y-2.5">
            <label className="text-zinc-400 font-mono uppercase text-[11px] flex items-center justify-between">
              <span>Bulles de message envoyées</span>
              <span className="text-zinc-500 font-normal lowercase">
                {MESSAGE_BUBBLE_THEMES[messageBubbleTheme]?.label ||
                  messageBubbleTheme}
              </span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(MESSAGE_BUBBLE_THEMES) as MessageBubbleTheme[]).map(
                (themeKey) => {
                  const t = MESSAGE_BUBBLE_THEMES[themeKey];
                  const isSelected = messageBubbleTheme === themeKey;
                  const isLightText = t.textColor === "light";
                  return (
                    <button
                      className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col gap-2 ${
                        isSelected
                          ? "border-white bg-zinc-900 ring-1 ring-white/30 shadow-md"
                          : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"
                      }`}
                      key={themeKey}
                      onClick={() => setMessageBubbleTheme(themeKey)}
                      type="button"
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className="w-6 h-6 rounded-full border border-white/20 shadow-inner flex items-center justify-center"
                          style={{ background: t.gradient }}
                        >
                          {isSelected && (
                            <Check
                              className={`w-3.5 h-3.5 ${isLightText ? "text-white" : "text-black"} stroke-[3]`}
                            />
                          )}
                        </div>
                        {isSelected && (
                          <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                            Actif
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-semibold text-zinc-200 truncate block">
                        {t.label}
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* 2. Fond d'écran des discussions */}
          <div className="space-y-2.5 pt-4 border-t border-zinc-900">
            <label className="text-zinc-400 font-mono uppercase text-[11px] flex items-center justify-between">
              <span>Arrière-plan des discussions</span>
              <span className="text-zinc-500 font-normal lowercase">
                {CHAT_BACKGROUND_THEMES[chatBackgroundTheme]?.label ||
                  chatBackgroundTheme}
              </span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(
                Object.keys(CHAT_BACKGROUND_THEMES) as ChatBackgroundTheme[]
              ).map((bgKey) => {
                const b = CHAT_BACKGROUND_THEMES[bgKey];
                const isSelected = chatBackgroundTheme === bgKey;
                return (
                  <button
                    className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col gap-2 ${
                      isSelected
                        ? "border-white bg-zinc-900 ring-1 ring-white/30 shadow-md"
                        : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"
                    }`}
                    key={bgKey}
                    onClick={() => setChatBackgroundTheme(bgKey)}
                    type="button"
                  >
                    <div
                      className={`w-full h-8 rounded-xl border border-white/10 flex items-center justify-center relative overflow-hidden ${b.previewBg}`}
                      style={b.style ? { background: b.style } : undefined}
                    >
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center shadow">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-zinc-200 truncate block">
                      {b.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Forme des bulles */}
          <div className="space-y-2.5 pt-4 border-t border-zinc-900">
            <label className="text-zinc-400 font-mono uppercase text-[11px] flex items-center justify-between">
              <span>Forme & Arrondi des bulles</span>
              <span className="text-zinc-500 font-normal lowercase">
                {MESSAGE_BUBBLE_SHAPES[messageBubbleShape]?.label ||
                  messageBubbleShape}
              </span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(Object.keys(MESSAGE_BUBBLE_SHAPES) as MessageBubbleShape[]).map(
                (shapeKey) => {
                  const s = MESSAGE_BUBBLE_SHAPES[shapeKey];
                  const isSelected = messageBubbleShape === shapeKey;
                  return (
                    <button
                      className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
                        isSelected
                          ? "border-white bg-zinc-900 ring-1 ring-white/30 text-white"
                          : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-white"
                      }`}
                      key={shapeKey}
                      onClick={() => setMessageBubbleShape(shapeKey)}
                      type="button"
                    >
                      <div
                        className={`w-12 h-6 border border-zinc-600 bg-zinc-800 ${s.meRadius} flex items-center justify-center`}
                      >
                        <div className="w-4 h-1 bg-zinc-400 rounded-full" />
                      </div>
                      <span className="text-[11px] font-semibold">
                        {s.label}
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </div>

        {/* Live Preview (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl border border-zinc-800 p-4 bg-zinc-900/60 flex flex-col gap-3 sticky top-24">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
              Aperçu de la conversation
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">
              Temps réel
            </span>
          </div>

          {/* Cadre de simulation de discussion */}
          <div
            className={`rounded-2xl border border-zinc-800 p-4 space-y-3 min-h-[220px] flex flex-col justify-end transition-all shadow-inner overflow-hidden ${
              CHAT_BACKGROUND_THEMES[chatBackgroundTheme]?.previewBg ||
              "bg-black"
            }`}
            style={
              CHAT_BACKGROUND_THEMES[chatBackgroundTheme]?.style
                ? {
                    background:
                      CHAT_BACKGROUND_THEMES[chatBackgroundTheme].style,
                  }
                : undefined
            }
          >
            {/* Message reçu */}
            <div className="flex items-end gap-2 max-w-[85%]">
              <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                V
              </div>
              <div
                className={`p-3 bg-zinc-900/90 border border-zinc-800 text-zinc-100 text-xs shadow-sm ${MESSAGE_BUBBLE_SHAPES[messageBubbleShape]?.partnerRadius || "rounded-2xl"}`}
              >
                <p className="leading-relaxed">
                  Salut ! Tu as vu le nouveau design des messages Vibe ? ✨
                </p>
                <span className="text-[9px] text-zinc-500 font-mono mt-1 block">
                  14:30
                </span>
              </div>
            </div>

            {/* Message envoyé */}
            <div className="flex items-end justify-end gap-2 self-end max-w-[85%]">
              <div
                className={`p-3 text-xs shadow-md transition-all ${
                  MESSAGE_BUBBLE_THEMES[messageBubbleTheme]?.textColor ===
                  "dark"
                    ? "vibe-msg-text-dark"
                    : "vibe-msg-text-light"
                } ${MESSAGE_BUBBLE_SHAPES[messageBubbleShape]?.meRadius || "rounded-2xl"}`}
                style={{
                  background:
                    MESSAGE_BUBBLE_THEMES[messageBubbleTheme]?.gradient,
                  border: MESSAGE_BUBBLE_THEMES[messageBubbleTheme]?.border,
                }}
              >
                <p className="leading-relaxed font-medium">
                  Oui, c'est super fluide et personnalisable ! 🚀
                </p>
                <div className="flex items-center justify-end gap-1 mt-1 opacity-75">
                  <span className="text-[9px] font-mono">14:31</span>
                  <CheckCheck className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-zinc-400 text-center">
            Ces réglages s'appliquent immédiatement à toutes vos discussions
            privées.
          </p>
        </div>
      </div>
    </div>
  );
};
