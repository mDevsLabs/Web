/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — MESSAGE COMPOSER (components/vibe/messages/MessageComposer.tsx)
 * Barre de saisie : texte riche, médias, dictée, réponses rapides et Livre
 * ============================================================================
 *
 * POURQUOI CETTE BARRE A ÉTÉ SIMPLIFIÉE
 *
 * La version précédente affichait en permanence, au-dessus du champ, sept
 * boutons de mise en forme — gras, italique, souligné, barré, lien, @tous —
 * puis, sur la ligne du bas, un bouton « + », un bouton d'envoi programmé et
 * un bouton d'envoi. Neuf cibles pour écrire trois mots.
 *
 * La règle retenue : la mise en forme apparaît QUAND on écrit. Le champ vide
 * n'affiche plus que trois commandes — ajouter (+), dicter, envoyer — et la
 * barre de mise en forme se déplie dès la première frappe (ou via le bouton
 * « Aa » de la pastille de saisie, qui la maintient ouverte). L'envoi programmé
 * et les presets mAI passent dans le menu « + » : ce sont des actions
 * occasionnelles, pas les gestes d'un message sur deux.
 *
 * LES FONCTIONNALITÉS DE RÉDACTION AJOUTÉES
 *
 * 1. RÉPONSES RAPIDES : des phrases enregistrées, réinsérées en un clic, et
 *    « enregistrer ce texte comme réponse rapide » depuis le menu. Stockées
 *    sur l'appareil (`lib/vibe/services/quickReplies.ts`) — c'est un raccourci
 *    de rédaction, pas une donnée de compte.
 * 2. MODE RÉDACTION : le composeur occupe l'écran, avec le compteur de
 *    caractères et les réponses rapides à portée. Utile pour les messages
 *    longs, où la barre d'un chat est trop étroite.
 * 3. RAPPEL DU DERNIER MESSAGE : flèche haut dans un champ vide (geste
 *    standard d'une messagerie), traité par `MessageRichInput`.
 */

import {
  ArrowUpIcon as ArrowUp,
  BellRingIcon as BellRing,
  BoldIcon as Bold,
  BookOpenIcon as BookOpen,
  CheckIcon as Check,
  ClockIcon as Clock,
  DramaIcon as Drama,
  ExpandIcon as Expand,
  FileTextIcon as FileText,
  ImageIcon,
  ItalicIcon as Italic,
  Link2Icon as Link2,
  Loader2Icon as Loader2,
  Maximize2Icon as Maximize2,
  MicIcon as Mic,
  MicOffIcon as MicOff,
  Minimize2Icon as Minimize2,
  PencilIcon as Pencil,
  PenLineIcon as PenLine,
  PinIcon as Pin,
  PlusIcon as Plus,
  QuoteIcon as Quote,
  ScissorsIcon as Scissors,
  SparklesIcon as Sparkles,
  StrikethroughIcon as Strikethrough,
  TypeIcon as Type,
  UnderlineIcon as Underline,
  Wand2Icon as Wand2,
  XIcon as X,
  ZapIcon as Zap,
} from "@mdevs/icons";
import { motion } from "framer-motion";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ProfileAvatar } from "@/components/vibe/common/ProfileAvatar";
import { htmlToPlainText } from "@/components/vibe/common/RichContent";
import { ToolAutocomplete } from "@/components/vibe/layout/ToolAutocomplete";
import {
  MessageRichInput,
  type MessageRichInputHandle,
} from "@/components/vibe/messages/MessageRichInput";
import {
  addQuickReply,
  QUICK_REPLIES_MAX,
  type QuickReply,
  readQuickReplies,
  removeQuickReply,
  writeQuickReplies,
} from "@/lib/vibe/services/quickReplies";
import type { DirectMessage, VibeBookPost } from "@/lib/vibe/types/vibe";
import { useNavigate } from "../router";
import {
  type AttachedMedia,
  type AttachedPostPreview,
  formatFileSize,
} from "./messageTypes";

export interface MessageComposerProps {
  activePartnerBlocked: boolean;
  animationsEnabled: boolean;
  attachedMediaList: AttachedMedia[];
  attachedPost: AttachedPostPreview | null;
  bookPickerLoading: boolean;
  bookPickerOpen: boolean;
  bookPickerQuery: string;
  customPresetOpen: boolean;
  customPresetText: string;
  editingMessage: DirectMessage | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  filteredBookPickerPosts: VibeBookPost[];
  hasUrgentMention: boolean;
  isBookConv: boolean;
  isGeneratingSuggestion: boolean;
  isGroupConv: boolean;
  isListening: boolean;
  isSending: boolean;
  isSupported: boolean;
  isUploading: boolean;
  justSent: boolean;
  /** Texte du dernier message envoyé — rappelé par la flèche haut. */
  lastSentText?: string;
  mediaLimitLabel: string;
  mentionQuery: string | null;
  mentionSuggestions: Array<{
    user_id: string | number;
    username: string;
    avatar_url?: string;
    role: string;
  }>;
  messageCharLimit: number;
  messagePlain: string;
  onAttachFiles: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCancelAttachedPost: () => void;
  onCancelEditing: () => void;
  onCancelReply: () => void;
  onChangeBookPickerQuery: (q: string) => void;
  onChangeCustomPresetText: (t: string) => void;
  onChangeScheduledAt: (val: string) => void;
  onClearSchedule: () => void;
  onCloseBookPicker: () => void;
  onCloseCustomPreset: () => void;
  onCloseMentionQuery: () => void;
  onClosePlusMenu: () => void;
  onCloseToolQuery: () => void;
  onGenerateSuggestion: (
    preset: "improve" | "shorten" | "extend" | "tone" | "custom",
    customPrompt?: string
  ) => void;
  onInsertLink: () => void;
  onInsertMention: (username: string) => void;
  onOpenBookPostPicker: () => void;
  onRemoveAttachedMedia: (index: number) => void;
  onRichInputChange: (plain: string, html: string) => void;
  onSelectBookPost: (post: VibeBookPost) => void;
  onSendMessage: (e?: React.FormEvent) => void;
  onStartListening: () => void;
  onStopListening: () => void;
  onTogglePlusMenu: () => void;
  onToggleSchedule: () => void;
  onToolbarCommand: (
    command: "bold" | "italic" | "underline" | "strikeThrough"
  ) => void;
  onUserInput: () => void;
  plusMenuOpen: boolean;
  replyTo: DirectMessage | null;
  richInputRef: React.RefObject<MessageRichInputHandle | null>;
  scheduledAt: string;
  showSchedule: boolean;
  toolQuery: string | null;
}

const PRESET_OPTIONS: {
  key: "shorten" | "extend" | "tone" | "improve" | "custom";
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    icon: <Scissors className="w-3.5 h-3.5" />,
    key: "shorten",
    label: "Réduire",
  },
  {
    icon: <Expand className="w-3.5 h-3.5" />,
    key: "extend",
    label: "Allonger",
  },
  {
    icon: <Drama className="w-3.5 h-3.5" />,
    key: "tone",
    label: "Changer le ton",
  },
  {
    icon: <Wand2 className="w-3.5 h-3.5" />,
    key: "improve",
    label: "Améliorer",
  },
  {
    icon: <PenLine className="w-3.5 h-3.5" />,
    key: "custom",
    label: "Personnalisé…",
  },
];

export const MessageComposer: React.FC<MessageComposerProps> = ({
  activePartnerBlocked,
  editingMessage,
  replyTo,
  attachedPost,
  customPresetOpen,
  customPresetText,
  isGeneratingSuggestion,
  showSchedule,
  scheduledAt,
  messagePlain,
  messageCharLimit,
  isGroupConv,
  hasUrgentMention,
  mentionQuery,
  mentionSuggestions,
  isBookConv,
  toolQuery,
  bookPickerOpen,
  bookPickerQuery,
  bookPickerLoading,
  filteredBookPickerPosts,
  plusMenuOpen,
  isUploading,
  mediaLimitLabel,
  isListening,
  isSupported,
  isSending,
  justSent,
  animationsEnabled,
  attachedMediaList,
  lastSentText,
  richInputRef,
  fileInputRef,
  onSendMessage,
  onCancelEditing,
  onCancelReply,
  onCancelAttachedPost,
  onChangeCustomPresetText,
  onCloseCustomPreset,
  onGenerateSuggestion,
  onChangeScheduledAt,
  onToggleSchedule,
  onClearSchedule,
  onToolbarCommand,
  onInsertLink,
  onInsertMention,
  onCloseMentionQuery,
  onCloseToolQuery,
  onOpenBookPostPicker,
  onCloseBookPicker,
  onChangeBookPickerQuery,
  onSelectBookPost,
  onTogglePlusMenu,
  onClosePlusMenu,
  onAttachFiles,
  onRemoveAttachedMedia,
  onRichInputChange,
  onUserInput,
  onStartListening,
  onStopListening,
}) => {
  const navigate = useNavigate();

  /**
   * Le composeur a-t-il le focus ? La barre de mise en forme suit cette
   * information autant que le contenu : on écrit rarement un message vide.
   */
  const [focused, setFocused] = useState(false);
  /** Épinglage manuel de la barre de mise en forme (bouton « Aa »). */
  const [formattingPinned, setFormattingPinned] = useState(false);
  /** Mode rédaction : le composeur occupe l'écran. */
  const [focusMode, setFocusMode] = useState(false);
  /** Réponses rapides de l'appareil. */
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>(() =>
    readQuickReplies()
  );

  // Un message parti referme le mode rédaction : rester en plein écran après
  // l'envoi donnerait l'impression que rien n'a été envoyé.
  useEffect(() => {
    if (justSent) {
      setFocusMode(false);
    }
  }, [justSent]);

  // Le mode rédaction capture l'écran : Échap doit en sortir, sinon on s'y
  // retrouve enfermé sans savoir comment revenir à la conversation.
  useEffect(() => {
    if (!focusMode) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFocusMode(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [focusMode]);

  const persistQuickReplies = useCallback((next: QuickReply[]) => {
    setQuickReplies(next);
    writeQuickReplies(next);
  }, []);

  const insertQuickReply = useCallback(
    (reply: QuickReply) => {
      richInputRef.current?.setHTML(reply.html);
      richInputRef.current?.focus();
      onClosePlusMenu();
    },
    [onClosePlusMenu, richInputRef]
  );

  const saveCurrentAsQuickReply = useCallback(() => {
    if (!messagePlain.trim()) {
      return;
    }
    if (quickReplies.length >= QUICK_REPLIES_MAX) {
      toast.warning(
        `Limite de ${QUICK_REPLIES_MAX} réponses rapides atteinte. Supprimez-en une.`
      );
      return;
    }
    const next = addQuickReply(quickReplies, {
      html: richInputRef.current?.getHTML() || messagePlain,
      text: messagePlain,
    });
    persistQuickReplies(next);
    toast.success("Réponse rapide enregistrée.");
  }, [messagePlain, persistQuickReplies, quickReplies, richInputRef]);

  const recallLastMessage = useCallback(() => {
    if (!lastSentText?.trim()) {
      return;
    }
    richInputRef.current?.setHTML(
      lastSentText
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\r?\n/g, "<br>")
    );
    richInputRef.current?.focus();
  }, [lastSentText, richInputRef]);

  const nearLimit = messagePlain.length >= messageCharLimit * 0.8;
  const overLimit = messagePlain.length > messageCharLimit;
  const showFormatting =
    !editingMessage && (formattingPinned || focused || messagePlain.length > 0);
  const words = useMemo(
    () => messagePlain.trim().split(/\s+/).filter(Boolean).length,
    [messagePlain]
  );

  return (
    <>
      {/* Aperçu des médias joints */}
      {attachedMediaList.length > 0 && (
        <div className="vibe-chat-bottom-bar p-3 border-t flex items-center gap-2 overflow-x-auto">
          {attachedMediaList.map((media, idx) => (
            <div className="relative group shrink-0" key={idx}>
              {media.type === "video" ? (
                <video
                  className="w-16 h-16 object-cover rounded-xl border border-zinc-200 vibe-dark:border-zinc-800"
                  src={media.url}
                />
              ) : media.type === "document" ? (
                <div className="w-40 h-16 rounded-xl border border-zinc-200 vibe-dark:border-zinc-800 flex items-center gap-2 px-2 overflow-hidden">
                  <FileText className="w-5 h-5 shrink-0 text-zinc-500" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold truncate">
                      {media.fileName || "Document"}
                    </p>
                    <p className="text-[9px] text-zinc-500 font-mono">
                      {formatFileSize(media.size)}
                    </p>
                  </div>
                </div>
              ) : (
                <img
                  alt="Aperçu"
                  className="w-16 h-16 object-cover rounded-xl border border-zinc-200 vibe-dark:border-zinc-800"
                  src={media.url}
                />
              )}
              <button
                className="vibe-chat-remove-media absolute -top-1 -right-1 p-1 rounded-full shadow"
                onClick={() => onRemoveAttachedMedia(idx)}
                type="button"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <span className="text-[11px] text-zinc-500 pl-2">
            {attachedMediaList.length} fichier(s) (max {mediaLimitLabel})
          </span>
        </div>
      )}

      {/* Mode rédaction : le composeur prend l'écran, la conversation reste
          derrière. Le fond vient du thème Vibe (`--bg-primary`), jamais d'une
          couleur d'hôte : Vibe vit sous `.vibe-root`. */}
      <form
        className={
          focusMode
            ? "vibe-composer-focus fixed inset-0 z-[60] flex flex-col gap-3 p-4 sm:p-8 bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-y-auto"
            : "vibe-chat-bottom-bar p-3 space-y-2 relative"
        }
        onBlur={(event) => {
          // `relatedTarget` est la cible qui reçoit le focus : si elle est
          // encore dans le composeur (bouton de mise en forme, menu), on ne
          // referme pas la barre d'outils.
          if (
            !event.currentTarget.contains(event.relatedTarget as Node | null)
          ) {
            setFocused(false);
          }
        }}
        onFocus={() => setFocused(true)}
        onSubmit={onSendMessage}
      >
        {focusMode && (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold">Rédaction</p>
              <p className="text-[11px] text-zinc-500">
                Échap pour revenir à la conversation · Maj+Entrée pour un retour
                à la ligne
              </p>
            </div>
            <button
              className="vibe-chat-icon-btn p-2 shrink-0"
              onClick={() => setFocusMode(false)}
              title="Revenir à la conversation"
              type="button"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {activePartnerBlocked && (
          <p className="text-center text-[11px] text-zinc-500 py-1">
            Utilisateur bloqué — l'envoi de messages est désactivé.
          </p>
        )}

        {/* Bandeau d'édition de message */}
        {editingMessage && (
          <div className="vibe-chat-banner flex items-center justify-between px-3.5 py-2 rounded-2xl text-xs animate-fadeIn">
            <div className="flex items-center gap-2">
              <Pencil className="w-3.5 h-3.5 text-black vibe-dark:text-white" />
              <span>
                Modification du message{" "}
                <span className="text-[10px] text-zinc-500 vibe-dark:text-zinc-400 font-mono">
                  (limite 60 min)
                </span>
              </span>
            </div>
            <button
              className="vibe-chat-icon-btn p-1 shrink-0"
              onClick={onCancelEditing}
              title="Annuler la modification"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Aperçu de réponse */}
        {replyTo && !editingMessage && (
          <div className="vibe-chat-banner flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px]">
            <span className="truncate">
              Réponse à <strong>@{replyTo.sender_username}</strong> :{" "}
              {htmlToPlainText(replyTo.content).slice(0, 60)}
            </span>
            <button
              className="vibe-chat-icon-btn text-zinc-500 shrink-0 ml-2"
              onClick={onCancelReply}
              type="button"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Publication du Livre jointe */}
        {attachedPost && !editingMessage && (
          <div className="vibe-chat-banner flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] animate-fadeIn">
            <button
              className="flex items-center gap-2 min-w-0 text-left"
              onClick={() => navigate(`/post/${attachedPost.id}`)}
              title="Ouvrir la publication"
              type="button"
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                Publication de <strong>@{attachedPost.username}</strong> :{" "}
                {attachedPost.excerpt.slice(0, 60)}
              </span>
            </button>
            <button
              className="vibe-chat-icon-btn text-zinc-500 shrink-0 ml-2"
              onClick={onCancelAttachedPost}
              type="button"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {customPresetOpen && !isGeneratingSuggestion && (
          <div className="flex items-center gap-2 mb-2">
            <div className="vibe-chat-banner flex-1 flex items-center gap-2 px-3 py-1.5">
              <PenLine className="w-3.5 h-3.5 text-zinc-400 vibe-dark:text-zinc-500 shrink-0" />
              <input
                autoFocus
                className="flex-1 bg-transparent text-xs text-black vibe-dark:text-white placeholder-zinc-400 vibe-dark:placeholder-zinc-500 focus:outline-none"
                onChange={(e) => onChangeCustomPresetText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onGenerateSuggestion("custom", customPresetText);
                  }
                }}
                placeholder="Votre consigne pour mAI (ex. : rends-le plus drôle)…"
                type="text"
                value={customPresetText}
              />
            </div>
            <button
              className="vibe-chat-send-btn p-1.5 disabled:opacity-40 shrink-0 shadow"
              disabled={!customPresetText.trim()}
              onClick={() => onGenerateSuggestion("custom", customPresetText)}
              title="Appliquer la consigne"
              type="button"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
            <button
              className="p-1.5 rounded-full text-zinc-500 hover:text-black vibe-dark:hover:text-white shrink-0"
              onClick={onCloseCustomPreset}
              title="Annuler"
              type="button"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Programmation de l'envoi */}
        {showSchedule && (
          <div className="flex items-center gap-2 px-1 animate-fadeIn">
            <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <input
              className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-zinc-100 vibe-dark:bg-zinc-900 border border-zinc-200 vibe-dark:border-zinc-800 text-xs text-black vibe-dark:text-white focus:outline-none"
              min={new Date(
                Date.now() - new Date().getTimezoneOffset() * 60_000
              )
                .toISOString()
                .slice(0, 16)}
              onChange={(e) => onChangeScheduledAt(e.target.value)}
              type="datetime-local"
              value={scheduledAt}
            />
            {scheduledAt && (
              <button
                className="text-zinc-500 hover:text-black vibe-dark:hover:text-white shrink-0"
                onClick={onClearSchedule}
                title="Annuler la programmation"
                type="button"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
        {scheduledAt && !showSchedule && (
          <button
            className="mx-1 w-fit flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 vibe-dark:text-amber-400 text-[10px] font-bold"
            onClick={onToggleSchedule}
            type="button"
          >
            <Clock className="w-3 h-3" />
            Envoi prévu le{" "}
            {new Date(scheduledAt).toLocaleString("fr-FR", {
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              month: "short",
            })}
          </button>
        )}

        {/* Barre de mise en forme — repliée tant que l'on n'écrit pas. */}
        {showFormatting && (
          <div className="flex items-center gap-0.5 px-1 flex-wrap">
            <button
              className="vibe-chat-icon-btn p-1.5"
              onClick={() => onToolbarCommand("bold")}
              onMouseDown={(e) => e.preventDefault()}
              title="Gras (ou **texte**)"
              type="button"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              className="vibe-chat-icon-btn p-1.5"
              onClick={() => onToolbarCommand("italic")}
              onMouseDown={(e) => e.preventDefault()}
              title="Italique (ou *texte*)"
              type="button"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              className="vibe-chat-icon-btn p-1.5"
              onClick={() => onToolbarCommand("underline")}
              onMouseDown={(e) => e.preventDefault()}
              title="Souligné"
              type="button"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
            <button
              className="vibe-chat-icon-btn p-1.5"
              onClick={() => onToolbarCommand("strikeThrough")}
              onMouseDown={(e) => e.preventDefault()}
              title="Barré"
              type="button"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>
            <button
              className="vibe-chat-icon-btn p-1.5"
              onClick={onInsertLink}
              onMouseDown={(e) => e.preventDefault()}
              title="Insérer un lien"
              type="button"
            >
              <Link2 className="w-3.5 h-3.5" />
            </button>
            {isGroupConv && (
              <>
                <button
                  className="ml-1 px-2 py-1 rounded-full bg-zinc-900 text-white vibe-dark:bg-white vibe-dark:text-black text-[10px] font-bold"
                  onClick={() => richInputRef.current?.insertText("@tous ")}
                  onMouseDown={(e) => e.preventDefault()}
                  title="Mentionner tout le groupe (urgent)"
                  type="button"
                >
                  @tous
                </button>
                {hasUrgentMention && (
                  <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/15 text-red-600 vibe-dark:text-red-400 text-[10px] font-bold animate-pulse">
                    <BellRing className="w-3 h-3" /> Mention urgente
                  </span>
                )}
              </>
            )}
            {nearLimit && (
              <span
                className={`ml-auto text-[10px] font-mono ${
                  overLimit ? "text-red-500 font-bold" : "text-zinc-500"
                }`}
              >
                {messagePlain.length}/{messageCharLimit.toLocaleString("fr-FR")}
              </span>
            )}
          </div>
        )}

        {/* Autocomplétion @mention (groupes) */}
        {isGroupConv &&
          mentionQuery !== null &&
          mentionSuggestions.length > 0 && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={onCloseMentionQuery}
              />
              <div className="absolute bottom-full left-0 mb-2 z-50 w-64 rounded-2xl vibe-menu p-1.5 shadow-2xl animate-fadeIn max-h-48 overflow-y-auto">
                {mentionSuggestions.map((mm) => (
                  <button
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-[11px] vibe-chat-menu-item text-left"
                    key={mm.user_id}
                    onClick={() => onInsertMention(mm.username)}
                    type="button"
                  >
                    <ProfileAvatar
                      alt={mm.username}
                      fallbackName={mm.username}
                      size="xs"
                      src={mm.avatar_url}
                    />
                    <span className="truncate flex-1">@{mm.username}</span>
                    {mm.role === "admin" && (
                      <span className="text-[9px] font-bold text-zinc-400">
                        admin
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

        {/* Livre : commande « / » */}
        {isBookConv && toolQuery !== null && !bookPickerOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={onCloseToolQuery} />
            <ToolAutocomplete
              onClose={onCloseToolQuery}
              onSelect={() => {}}
              query={`/${toolQuery}`}
              showTools={false}
              specialAction={{
                description: "Sélectionner une Vibe du Livre (carte cliquable)",
                label: "/post",
                onSelect: onOpenBookPostPicker,
                subtitle: "Joindre une publication du Livre",
              }}
              trigger="/"
            />
          </>
        )}

        {/* Livre : sélecteur des publications */}
        {bookPickerOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={onCloseBookPicker} />
            <div className="absolute bottom-full left-0 mb-2 z-50 w-full max-w-md rounded-2xl vibe-menu p-2 shadow-2xl animate-fadeIn">
              <div className="flex items-center gap-2 px-1 pb-2">
                <BookOpen className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span className="text-[11px] font-bold text-zinc-600 vibe-dark:text-zinc-300 flex-1 truncate">
                  Publications du Livre
                </span>
                <button
                  className="vibe-chat-icon-btn p-1 shrink-0"
                  onClick={onCloseBookPicker}
                  type="button"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                autoFocus
                className="w-full mb-2 px-3 py-2 rounded-xl bg-zinc-100 vibe-dark:bg-zinc-900 border border-zinc-200 vibe-dark:border-zinc-800 text-xs text-black vibe-dark:text-white focus:outline-none"
                onChange={(e) => onChangeBookPickerQuery(e.target.value)}
                placeholder="Filtrer par contenu ou @auteur…"
                type="text"
                value={bookPickerQuery}
              />
              <div className="max-h-56 overflow-y-auto divide-y divide-zinc-100 vibe-dark:divide-zinc-900">
                {bookPickerLoading ? (
                  <div className="p-4 text-center text-[11px] text-zinc-500 flex items-center justify-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Chargement…
                  </div>
                ) : filteredBookPickerPosts.length === 0 ? (
                  <div className="p-4 text-center text-[11px] text-zinc-500">
                    Aucune publication dans ce Livre pour le moment.
                  </div>
                ) : (
                  filteredBookPickerPosts.map((p) => (
                    <button
                      className="w-full flex items-start gap-2 px-2 py-2 rounded-xl text-left hover:bg-black/5 vibe-dark:hover:bg-zinc-900 transition-colors"
                      key={p.id}
                      onClick={() => onSelectBookPost(p)}
                      type="button"
                    >
                      <ProfileAvatar
                        alt={p.username || "vibe"}
                        className="shrink-0 mt-0.5"
                        fallbackName={p.username || "vibe"}
                        size="xs"
                        src={p.avatar_url}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold truncate">
                            @{p.username}
                          </span>
                          {p.is_pinned && (
                            <span className="px-1 py-0.5 rounded-md bg-zinc-100 vibe-dark:bg-zinc-900 border border-zinc-200 vibe-dark:border-zinc-800 text-[8px] font-bold text-zinc-500 flex items-center gap-0.5 shrink-0">
                              <Pin className="w-2 h-2" /> épinglé
                            </span>
                          )}
                        </span>
                        <span className="block text-[10px] opacity-75 truncate">
                          {htmlToPlainText(p.content || "").slice(0, 100)}
                        </span>
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        <div
          className={
            focusMode
              ? "flex flex-col gap-2 flex-1 min-h-0"
              : "flex items-center gap-2 sm:gap-3"
          }
        >
          <input
            accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            className="hidden"
            multiple
            onChange={onAttachFiles}
            ref={fileInputRef}
            type="file"
          />

          <div className={focusMode ? "flex items-center gap-2" : "contents"}>
            {/* Bouton + avec menu déroulant */}
            <div className="relative shrink-0">
              <button
                className={`vibe-chat-plus-btn w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  plusMenuOpen ? "rotate-45 shadow-md" : ""
                }`}
                onClick={onTogglePlusMenu}
                title="Ajouter des médias, une réponse rapide ou une option mAI"
                type="button"
              >
                <Plus className="w-5 h-5 transition-transform" />
              </button>

              {plusMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={onClosePlusMenu}
                  />
                  <div className="absolute bottom-full left-0 mb-2.5 z-50 w-72 max-h-[70vh] overflow-y-auto rounded-3xl vibe-menu p-2 shadow-2xl animate-fadeIn space-y-1">
                    <button
                      className="vibe-chat-menu-item w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs transition-colors text-left"
                      disabled={isUploading}
                      onClick={() => {
                        onClosePlusMenu();
                        fileInputRef.current?.click();
                      }}
                      type="button"
                    >
                      <div className="vibe-chat-modal-card p-2 rounded-xl shrink-0">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-zinc-900 vibe-dark:text-white">
                          Importer photos & vidéos
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          Jusqu'à {mediaLimitLabel} de médias au total
                        </p>
                      </div>
                    </button>

                    {/* Réponses rapides : rédaction en un clic */}
                    <div className="border-t border-zinc-200 vibe-dark:border-zinc-800 my-1" />
                    <div className="px-3 pt-1 pb-1 text-[10px] uppercase font-bold tracking-wider text-zinc-500 flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-zinc-700 vibe-dark:text-white" />
                      <span>Réponses rapides</span>
                      <span className="ml-auto font-mono text-[9px] normal-case">
                        {quickReplies.length}/{QUICK_REPLIES_MAX}
                      </span>
                    </div>
                    {quickReplies.length === 0 ? (
                      <p className="px-3 pb-1 text-[10px] text-zinc-500">
                        Aucune réponse enregistrée.
                      </p>
                    ) : (
                      quickReplies.map((reply) => (
                        <div
                          className="flex items-center gap-1 rounded-xl pr-1"
                          key={reply.id}
                        >
                          <button
                            className="vibe-chat-menu-item flex-1 min-w-0 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs text-left"
                            onClick={() => insertQuickReply(reply)}
                            title={reply.text}
                            type="button"
                          >
                            <Quote className="w-3 h-3 shrink-0 text-zinc-500" />
                            <span className="truncate">{reply.label}</span>
                          </button>
                          <button
                            className="p-1 rounded-lg text-zinc-400 hover:text-red-500 shrink-0"
                            onClick={() =>
                              persistQuickReplies(
                                removeQuickReply(quickReplies, reply.id)
                              )
                            }
                            title="Supprimer cette réponse rapide"
                            type="button"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    )}
                    <button
                      className="vibe-chat-menu-item w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs text-left disabled:opacity-40"
                      disabled={!messagePlain.trim()}
                      onClick={saveCurrentAsQuickReply}
                      title="Enregistrer le texte en cours comme réponse rapide"
                      type="button"
                    >
                      <Plus className="w-3 h-3 text-zinc-500" />
                      Enregistrer ce texte
                    </button>

                    <div className="border-t border-zinc-200 vibe-dark:border-zinc-800 my-1" />

                    {/* Presets mAI */}
                    <div className="px-3 pt-1 pb-1 text-[10px] uppercase font-bold tracking-wider text-zinc-500 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-zinc-700 vibe-dark:text-white" />
                      <span>Assistant mAI</span>
                    </div>
                    {PRESET_OPTIONS.map((opt) => (
                      <button
                        className="vibe-chat-menu-item w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors text-left disabled:opacity-40 disabled:hover:bg-transparent"
                        disabled={!messagePlain.trim() && opt.key !== "custom"}
                        key={opt.key}
                        onClick={() => {
                          onClosePlusMenu();
                          onGenerateSuggestion(opt.key);
                        }}
                        type="button"
                      >
                        <span className="text-zinc-500 vibe-dark:text-zinc-400">
                          {opt.icon}
                        </span>
                        <span>{opt.label}</span>
                      </button>
                    ))}

                    <div className="border-t border-zinc-200 vibe-dark:border-zinc-800 my-1" />

                    {/* Actions occasionnelles : programmation, Livre, rédaction */}
                    <button
                      className="vibe-chat-menu-item w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-left"
                      onClick={() => {
                        onClosePlusMenu();
                        onToggleSchedule();
                      }}
                      type="button"
                    >
                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      Programmer l'envoi
                    </button>
                    {isBookConv && (
                      <button
                        className="vibe-chat-menu-item w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-left"
                        onClick={() => {
                          onClosePlusMenu();
                          onOpenBookPostPicker();
                        }}
                        type="button"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
                        Joindre une Vibe du Livre
                      </button>
                    )}
                    <button
                      className="vibe-chat-menu-item w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-left"
                      onClick={() => {
                        onClosePlusMenu();
                        setFocusMode(true);
                      }}
                      type="button"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-zinc-500" />
                      Mode rédaction (plein écran)
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Bulle de saisie : pastille compacte, mise en forme optionnelle */}
            <div
              className={`vibe-chat-input-pill flex-1 flex items-end px-3 py-1.5 min-w-0 ${
                focusMode ? "items-start" : ""
              }`}
            >
              {!editingMessage && (
                <button
                  aria-pressed={formattingPinned}
                  className={`p-1.5 rounded-full transition-colors shrink-0 ${
                    formattingPinned
                      ? "text-black vibe-dark:text-white bg-black/10 vibe-dark:bg-white/10"
                      : "vibe-chat-icon-btn"
                  }`}
                  onClick={() => setFormattingPinned((value) => !value)}
                  onMouseDown={(e) => e.preventDefault()}
                  title={
                    formattingPinned
                      ? "Masquer la mise en forme"
                      : "Afficher la mise en forme"
                  }
                  type="button"
                >
                  <Type className="w-3.5 h-3.5" />
                </button>
              )}

              <MessageRichInput
                className={`flex-1 min-w-0 py-1 text-xs overflow-y-auto whitespace-pre-wrap break-words ${
                  focusMode ? "max-h-none text-sm leading-relaxed" : "max-h-32"
                }`}
                disabled={activePartnerBlocked}
                maxChars={messageCharLimit}
                onChange={onRichInputChange}
                onEmptyArrowUp={recallLastMessage}
                onEnterSend={() => {
                  if (!activePartnerBlocked && !isSending) onSendMessage();
                }}
                onUserInput={onUserInput}
                placeholder={
                  isListening
                    ? "Parlez, dictée en cours..."
                    : editingMessage
                      ? "Modifier votre message..."
                      : "Écrire un message..."
                }
                ref={richInputRef}
              />

              {isSupported && (
                <button
                  className={`p-1.5 rounded-full transition-colors ml-1.5 shrink-0 ${
                    isListening
                      ? "bg-red-500 text-white animate-pulse"
                      : "vibe-chat-icon-btn"
                  }`}
                  onClick={isListening ? onStopListening : onStartListening}
                  title={
                    isListening ? "Arrêter la dictée" : "Dicter le message"
                  }
                  type="button"
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Bouton d'envoi */}
          <motion.button
            className={`vibe-chat-send-btn w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-40 shrink-0 shadow cursor-pointer ${
              justSent ? "just-sent animate-pop" : ""
            } ${focusMode ? "self-end" : ""}`}
            disabled={
              activePartnerBlocked ||
              (!messagePlain.trim() && attachedMediaList.length === 0) ||
              isSending ||
              overLimit
            }
            title={
              editingMessage
                ? "Enregistrer la modification"
                : "Envoyer le message"
            }
            transition={{ damping: 22, stiffness: 500, type: "spring" }}
            type="submit"
            whileTap={animationsEnabled ? { scale: 0.85 } : undefined}
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : justSent ? (
              <Check className="w-5 h-5 stroke-[2.5]" />
            ) : (
              <ArrowUp className="w-5 h-5 stroke-[2.5]" />
            )}
          </motion.button>
        </div>

        {/* Ligne d'aide du mode rédaction : ce que l'on gagne à y être. */}
        {focusMode && (
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-500">
            <span className="font-mono">
              {messagePlain.length}/{messageCharLimit.toLocaleString("fr-FR")}{" "}
              caractères
            </span>
            <span>
              {words} mot{words > 1 ? "s" : ""}
            </span>
          </div>
        )}
      </form>
    </>
  );
};
