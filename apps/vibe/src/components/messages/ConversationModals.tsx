/**
 * ============================================================================
 * VIBE — MODALES DE CONVERSATION (src/components/messages/ConversationModals.tsx)
 * Modales de la page Messages : renommage local, signalement et informations
 * d'un message. Chaque modale porte son propre état de saisie ; la page fournit
 * les valeurs initiales et les callbacks d'action.
 * ============================================================================
 */

import React, { useEffect, useState } from 'react';
import { CheckIcon as Check, EyeIcon as Eye, FlagIcon as Flag, InfoIcon as Info, PencilIcon as Pencil, SendIcon as Send, XIcon as X } from "@mdevs/icons";
import type { DirectMessage } from '../../types/vibe';

const REPORT_REASONS = ['Spam ou arnaque', 'Harcèlement', 'Contenu haineux ou violent', 'Contenu illégal', 'Impersonation', 'Autre'];

/** Renommage local de la conversation (visible par le compte courant uniquement). */
export const RenameConversationModal: React.FC<{
  open: boolean;
  initialValue: string;
  /** Nom affiché en placeholder quand aucun nom local n'est défini. */
  fallbackName?: string;
  busy: boolean;
  onClose: () => void;
  /** Reçoit le nom saisi (vide = réafficher le nom d'origine). */
  onSave: (value: string) => void;
}> = ({ open, initialValue, fallbackName, busy, onClose, onSave }) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (open) setValue(initialValue);
  }, [open, initialValue]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" onClick={onClose}>
      <div className="w-full max-w-sm vibe-chat-modal-content rounded-3xl p-5 space-y-3 animate-scaleUp text-zinc-900 dark:text-white" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-bold">Renommer la conversation</h3>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={50}
          placeholder={fallbackName}
          className="vibe-chat-search-input w-full p-2.5 rounded-xl text-xs focus:outline-none"
          autoFocus
        />
        <p className="text-[10px] text-zinc-500">Laissez vide pour réafficher le nom d'origine. Ce nom n'est visible que par vous.</p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="vibe-chat-modal-btn py-2 px-4 text-[11px] font-semibold">
            Annuler
          </button>
          <button
            onClick={() => onSave(value)}
            disabled={busy}
            style={{ backgroundColor: 'var(--vibe-accent, #ffffff)' }}
            className="vibe-chat-accent-btn py-2 px-4 text-[11px] font-bold disabled:opacity-40"
          >
            {busy ? '...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
};

/** Signalement d'une conversation (motif sélectionnable). */
export const ReportConversationModal: React.FC<{
  open: boolean;
  /** Pseudo du partenaire signalé (affiché dans le titre). */
  username?: string;
  busy: boolean;
  onClose: () => void;
  /** Reçoit le motif choisi. */
  onSubmit: (reason: string) => void;
}> = ({ open, username, busy, onClose, onSubmit }) => {
  const [reason, setReason] = useState(REPORT_REASONS[0]);

  useEffect(() => {
    if (open) setReason(REPORT_REASONS[0]);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" onClick={onClose}>
      <div className="w-full max-w-sm vibe-chat-modal-content rounded-3xl p-5 space-y-3 animate-scaleUp text-zinc-900 dark:text-white" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <Flag className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-bold">Signaler @{username}</h3>
        </div>
        <div className="space-y-1.5">
          {REPORT_REASONS.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={`vibe-chat-modal-card w-full text-left px-3 py-2 rounded-xl text-[11px] transition-colors ${
                reason === r ? 'selected font-bold' : ''
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="vibe-chat-modal-btn py-2 px-4 text-[11px] font-semibold">
            Annuler
          </button>
          <button
            onClick={() => onSubmit(reason)}
            disabled={busy}
            style={{ backgroundColor: '#f59e0b' }}
            className="vibe-chat-accent-btn py-2 px-4 text-[11px] font-bold disabled:opacity-40"
          >
            {busy ? '...' : 'Signaler'}
          </button>
        </div>
      </div>
    </div>
  );
};

/** Cycle de vie d'un message : envoi, réception, lecture, édition. */
export const MessageInfoModal: React.FC<{
  message: DirectMessage | null;
  onClose: () => void;
}> = ({ message, onClose }) => {
  if (!message) return null;
  const msg = message as DirectMessage & { read_at?: string | null };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm vibe-chat-modal-content rounded-3xl p-5 space-y-4 animate-scaleUp text-zinc-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-zinc-900 dark:text-white" />
            <h3 className="text-sm font-bold">Informations du message</h3>
          </div>
          <button type="button" onClick={onClose} className="vibe-chat-icon-btn p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Aperçu du message */}
        <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-200">
          <p className="line-clamp-4">{msg.content}</p>
        </div>

        {/* Détails du cycle de vie du message */}
        <div className="space-y-3 text-xs">
          <div className="flex items-start justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-900">
            <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-zinc-400" /> Envoyé
            </span>
            <span className="font-mono text-zinc-800 dark:text-zinc-200 text-right">
              {new Date(msg.created_at).toLocaleString('fr-FR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-900">
            <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-zinc-400" /> Reçu / Délivré
            </span>
            <span className="text-emerald-500 font-semibold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Reçu par le serveur
            </span>
          </div>

          <div className="flex items-start justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-900">
            <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-zinc-400" /> État de lecture
            </span>
            <div className="text-right">
              {msg.is_read || msg.read_at ? (
                <span className="text-sky-500 font-semibold flex items-center gap-1 justify-end">
                  <Eye className="w-3.5 h-3.5" /> Lu
                  {msg.read_at && (
                    <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 font-normal">
                      ({new Date(msg.read_at).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })})
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-zinc-400 dark:text-zinc-500 font-medium">Non encore lu</span>
              )}
            </div>
          </div>

          {msg.is_edited && (
            <div className="flex items-start justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-900">
              <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Pencil className="w-3.5 h-3.5 text-zinc-400" /> Modifié
              </span>
              <span className="font-mono text-zinc-700 dark:text-zinc-300 text-right">
                {msg.edited_at
                  ? new Date(msg.edited_at).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })
                  : 'Oui'}
              </span>
            </div>
          )}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="vibe-chat-send-btn py-2 px-4 text-xs font-bold transition-colors shadow"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
