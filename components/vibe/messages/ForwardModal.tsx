/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — FORWARD MODAL (components/vibe/messages/ForwardModal.tsx)
 * Modale de sélection de la conversation cible pour le transfert d'un message
 * ============================================================================
 */

import { XIcon as X } from "@mdevs/icons";
import React from "react";
import { ProfileAvatar } from "@/components/vibe/common/ProfileAvatar";
import type { DirectMessage, DMConversation } from "@/lib/vibe/types/vibe";

export interface ForwardModalProps {
  message: DirectMessage | null;
  conversations: DMConversation[];
  onClose: () => void;
  onForwardTo: (conv: DMConversation) => void;
}

export const ForwardModal: React.FC<ForwardModalProps> = ({
  message,
  conversations,
  onClose,
  onForwardTo,
}) => {
  if (!message) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm vibe-chat-modal-content rounded-3xl p-4 space-y-3 animate-scaleUp text-zinc-900 vibe-dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">Transférer le message</h3>
          <button className="vibe-chat-icon-btn p-1" onClick={onClose} type="button">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[11px] text-zinc-600 vibe-dark:text-zinc-400 p-2 rounded-xl bg-zinc-50 vibe-dark:bg-zinc-900 border border-zinc-200 vibe-dark:border-zinc-800 truncate">
          {message.content.slice(0, 120)}
        </p>
        <div className="max-h-64 overflow-y-auto divide-y divide-zinc-100 vibe-dark:divide-zinc-900 rounded-2xl border border-zinc-200 vibe-dark:border-zinc-800">
          {conversations.length === 0 && (
            <p className="p-4 text-center text-xs text-zinc-500">
              Aucune conversation disponible.
            </p>
          )}
          {conversations.map((conv) => (
            <button
              className="vibe-chat-menu-item w-full p-3 flex items-center gap-3 transition-colors text-left"
              key={conv.partner_id}
              onClick={() => onForwardTo(conv)}
              type="button"
            >
              <ProfileAvatar
                alt={conv.partner_username}
                className="border border-zinc-200 vibe-dark:border-zinc-800 shrink-0"
                fallbackName={conv.partner_username}
                size="sm"
                src={conv.partner_avatar_url}
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-zinc-900 vibe-dark:text-white truncate">
                  {conv.partner_display_name || conv.partner_username}
                </p>
                <p className="text-[10px] text-zinc-500 font-mono">
                  @{conv.partner_username}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
