/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — THEME MODAL (components/vibe/messages/ThemeModal.tsx)
 * Modale de personnalisation des bulles, couleurs et fond de discussion
 * ============================================================================
 */

import { PaletteIcon as Palette, XIcon as X } from "@mdevs/icons";
import type React from "react";
import {
  CHAT_BACKGROUND_THEMES,
  type ChatBackgroundTheme,
  MESSAGE_BUBBLE_SHAPES,
  MESSAGE_BUBBLE_THEMES,
  type MessageBubbleShape,
  type MessageBubbleTheme,
} from "@/lib/vibe/context/ThemeContext";

export interface ThemeModalProps {
  chatBackgroundTheme: ChatBackgroundTheme;
  messageBubbleShape: MessageBubbleShape;
  messageBubbleTheme: MessageBubbleTheme;
  onChangeChatBackgroundTheme: (bgId: ChatBackgroundTheme) => void;
  onChangeMessageBubbleShape: (shape: MessageBubbleShape) => void;
  onChangeMessageBubbleTheme: (themeId: MessageBubbleTheme) => void;
  onClose: () => void;
  open: boolean;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({
  open,
  messageBubbleTheme,
  chatBackgroundTheme,
  messageBubbleShape,
  onClose,
  onChangeMessageBubbleTheme,
  onChangeChatBackgroundTheme,
  onChangeMessageBubbleShape,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md vibe-chat-modal-content rounded-3xl p-5 space-y-4 animate-scaleUp text-zinc-900 vibe-dark:text-white max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 vibe-dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-zinc-900 vibe-dark:text-white" />
            <h3 className="text-sm font-bold">Personnaliser la discussion</h3>
          </div>
          <button
            className="vibe-chat-icon-btn p-1"
            onClick={onClose}
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section 1 : Couleur ou Dégradé des bulles envoyées */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-700 vibe-dark:text-zinc-300 flex items-center gap-1.5">
            <span>Bulle des messages envoyés</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(MESSAGE_BUBBLE_THEMES).map((themeOpt) => {
              const isSelected = messageBubbleTheme === themeOpt.id;
              return (
                <button
                  className={`vibe-chat-modal-card p-2.5 text-left flex items-center gap-2.5 transition-all ${
                    isSelected ? "selected shadow-md" : ""
                  }`}
                  key={themeOpt.id}
                  onClick={() => onChangeMessageBubbleTheme(themeOpt.id)}
                  type="button"
                >
                  <span
                    className="w-6 h-6 rounded-full shrink-0 border border-black/10 vibe-dark:border-white/20 shadow-inner"
                    style={{
                      background: themeOpt.gradient,
                      border: themeOpt.border,
                    }}
                  />
                  <span className="text-[11px] font-semibold truncate text-zinc-800 vibe-dark:text-zinc-200">
                    {themeOpt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2 : Fond de la zone de messages */}
        <div className="space-y-2 pt-2 border-t border-zinc-200 vibe-dark:border-zinc-900">
          <label className="text-xs font-bold text-zinc-700 vibe-dark:text-zinc-300">
            Fond de la discussion
          </label>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(CHAT_BACKGROUND_THEMES).map((bgOpt) => {
              const isSelected = chatBackgroundTheme === bgOpt.id;
              return (
                <button
                  className={`vibe-chat-modal-card p-2.5 text-left flex items-center gap-2.5 transition-all ${
                    isSelected ? "selected shadow-md" : ""
                  }`}
                  key={bgOpt.id}
                  onClick={() => onChangeChatBackgroundTheme(bgOpt.id)}
                  type="button"
                >
                  <span
                    className={`w-6 h-6 rounded-full shrink-0 border border-black/10 vibe-dark:border-white/20 ${bgOpt.previewBg}`}
                    style={{ background: bgOpt.style || undefined }}
                  />
                  <span className="text-[11px] font-semibold truncate text-zinc-800 vibe-dark:text-zinc-200">
                    {bgOpt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3 : Forme de la bulle */}
        <div className="space-y-2 pt-2 border-t border-zinc-200 vibe-dark:border-zinc-900">
          <label className="text-xs font-bold text-zinc-700 vibe-dark:text-zinc-300">
            Forme de la bulle
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(Object.keys(MESSAGE_BUBBLE_SHAPES) as MessageBubbleShape[]).map(
              (shapeKey) => {
                const isSelected = messageBubbleShape === shapeKey;
                const s = MESSAGE_BUBBLE_SHAPES[shapeKey];
                return (
                  <button
                    className={`vibe-chat-modal-card py-2 px-2 text-center text-[11px] font-semibold transition-all ${
                      isSelected ? "selected font-bold shadow" : ""
                    }`}
                    key={shapeKey}
                    onClick={() => onChangeMessageBubbleShape(shapeKey)}
                    type="button"
                  >
                    {s.label.split(" ")[0]}
                  </button>
                );
              }
            )}
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            className="vibe-chat-send-btn py-2 px-5 text-xs font-bold transition-colors shadow"
            onClick={onClose}
            type="button"
          >
            Terminer
          </button>
        </div>
      </div>
    </div>
  );
};
