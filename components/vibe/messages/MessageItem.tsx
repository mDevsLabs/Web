/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — MESSAGE ITEM (components/vibe/messages/MessageItem.tsx)
 * Rendu d'une bulle de message : texte riche, médias, réactions, citation et actions
 * ============================================================================
 */

import {
  BellRingIcon as BellRing,
  CheckIcon as Check,
  ClockIcon as Clock,
  CopyIcon as Copy,
  EyeIcon as Eye,
  FileTextIcon as FileText,
  ForwardIcon as Forward,
  InfoIcon as Info,
  LanguagesIcon as Languages,
  Link2Icon as Link2,
  Loader2Icon as Loader2,
  MoreVerticalIcon as MoreVertical,
  PencilIcon as Pencil,
  PinIcon as Pin,
  PinOffIcon as PinOff,
  ReplyIcon as Reply,
  Trash2Icon as Trash2,
  XIcon as X,
} from "@mdevs/icons";
import { motion } from "framer-motion";
import React from "react";
import { ProfileAvatar } from "@/components/vibe/common/ProfileAvatar";
import {
  htmlToPlainText,
  isRichHtml,
  RichContent,
} from "@/components/vibe/common/RichContent";
import { stripUrlsFromHtml } from "@/components/vibe/common/richTextUtils";
import { REACTION_EMOJIS } from "@/components/vibe/messages/reactionEmojis";
import {
  MESSAGE_BUBBLE_SHAPES,
  MESSAGE_BUBBLE_THEMES,
  type MessageBubbleShape,
  type MessageBubbleTheme,
} from "@/lib/vibe/context/ThemeContext";
import {
  browserToDeepLCode,
  TRANSLATION_LANGUAGES,
} from "@/lib/vibe/services/api";
import type { DirectMessage } from "@/lib/vibe/types/vibe";
import { useNavigate } from "../router";

export interface MessageItemProps {
  message: DirectMessage;
  currentUser: { id?: string | number; username?: string } | null;
  isGroupConv: boolean;
  firstUnreadId: string | null;
  convSearchOpen: boolean;
  convSearchQuery: string;
  highlightedMessageId: string | null;
  messageBubbleTheme: MessageBubbleTheme;
  messageBubbleShape: MessageBubbleShape;
  animationsEnabled: boolean;
  currentTimestamp: number;
  actionMenuFor: string | null;
  translatePickerFor: string | null;
  translateLang: string;
  translations: Record<string, string>;
  translatingIds: Set<string>;
  pinnedMessages: DirectMessage[];
  formatTime: (dateStr: string) => string;
  onSetRef: (id: string, el: HTMLDivElement | null) => void;
  onToggleActionMenu: (id: string) => void;
  onCloseActionMenu: () => void;
  onToggleReaction: (msg: DirectMessage, emoji: string) => void;
  onEditMessage: (msg: DirectMessage) => void;
  onOpenInfoModal: (msg: DirectMessage) => void;
  onReplyTo: (msg: DirectMessage) => void;
  onForward: (msg: DirectMessage) => void;
  onCopyMessage: (msg: DirectMessage) => void;
  onCopyMessageLink: (msg: DirectMessage) => void;
  onToggleTranslatePicker: (id: string) => void;
  onTranslateMessage: (msg: DirectMessage, langCode: string) => void;
  onTogglePin: (msg: DirectMessage) => void;
  onDeleteMessage: (msg: DirectMessage) => void;
  onHideMessage: (msg: DirectMessage) => void;
}

/** Surlignage des occurrences (découpage React, sans HTML brut). */
export const highlightMatches = (
  content: string,
  query: string
): React.ReactNode => {
  if (!query) return content;
  const parts = content.split(query);
  if (parts.length <= 1) return content;
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            <mark className="bg-yellow-400/60 text-inherit rounded-sm px-0.5">
              {query}
            </mark>
          )}
        </span>
      ))}
    </>
  );
};

export const MessageItem: React.FC<MessageItemProps> = ({
  message: m,
  currentUser: user,
  isGroupConv,
  firstUnreadId,
  convSearchOpen,
  convSearchQuery,
  highlightedMessageId,
  messageBubbleTheme,
  messageBubbleShape,
  animationsEnabled,
  currentTimestamp,
  actionMenuFor,
  translatePickerFor,
  translateLang,
  translations,
  translatingIds,
  pinnedMessages,
  formatTime,
  onSetRef,
  onToggleActionMenu,
  onCloseActionMenu,
  onToggleReaction,
  onEditMessage,
  onOpenInfoModal,
  onReplyTo,
  onForward,
  onCopyMessage,
  onCopyMessageLink,
  onToggleTranslatePicker,
  onTranslateMessage,
  onTogglePin,
  onDeleteMessage,
  onHideMessage,
}) => {
  const navigate = useNavigate();

  const isMe =
    user &&
    (String(m.sender_id) === String(user.id) ||
      m.sender_username === user.username);
  // Contenu riche (HTML de l'éditeur) ou texte brut historique
  const richMsg = isRichHtml(m.content);
  const plainSrc = richMsg ? htmlToPlainText(m.content) : m.content;
  // Liens markdown [label](url) : rendus inline par RichContent, pas en média
  const mdLinkRe = /\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/g;
  const hasMdLinks = !richMsg && mdLinkRe.test(m.content);
  const contentForMedia = richMsg
    ? plainSrc
    : m.content.replace(mdLinkRe, " ");
  // Extract possible media URLs inside message (hors liens markdown)
  const urls = contentForMedia.match(/https?:\/\/[^\s]+/g) || [];
  const nonUrlText = contentForMedia
    .replace(/https?:\/\/[^\s]+/g, "")
    .trim();
  // HTML sans les URLs média en texte (les <a href> restent intacts)
  const richSource =
    richMsg && urls.length > 0 ? stripUrlsFromHtml(m.content) : m.content;
  const isMediaOnly =
    urls.length > 0 &&
    !nonUrlText &&
    !hasMdLinks &&
    !(m as any).reply_to_content;
  const canEdit =
    isMe &&
    !String(m.id).startsWith("temp") &&
    currentTimestamp - new Date(m.created_at).getTime() <= 60 * 60 * 1000;

  const currentThemeConfig =
    MESSAGE_BUBBLE_THEMES[messageBubbleTheme] ||
    MESSAGE_BUBBLE_THEMES.monochrome;
  const currentShapeConfig =
    MESSAGE_BUBBLE_SHAPES[messageBubbleShape] || MESSAGE_BUBBLE_SHAPES.pill;

  const isFirstUnread =
    firstUnreadId !== null && String(m.id) === String(firstUnreadId);
  const searchQ = convSearchOpen ? convSearchQuery.trim() : "";
  const matchesSearch = searchQ ? plainSrc.includes(searchQ) : false;
  // Groupe : affiche le pseudo de l'expéditeur + surligne les mentions urgentes
  const isUrgent =
    isGroupConv &&
    Array.isArray((m as any).urgent_mentions) &&
    (m as any).urgent_mentions.length > 0;

  return (
    <React.Fragment key={m.id}>
      {/* Mention urgente (@tous / @user) : bandeau au-dessus du message */}
      {isUrgent && (
        <div className="flex justify-center my-0.5">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 text-red-500 text-[9px] font-bold uppercase tracking-wide">
            <BellRing className="w-2.5 h-2.5" />
            Mention urgente — {((m as any).urgent_mentions || []).join(", ")}
          </span>
        </div>
      )}
      {/* Groupe : nom de l'expéditeur au-dessus des bulles des autres */}
      {isGroupConv && !isMe && (
        <span className="text-[10px] font-bold text-zinc-500 px-1 mb-0.5">
          @{m.sender_username || "membre"}
        </span>
      )}
      {/* Séparateur « Non lus » (style WhatsApp) */}
      {isFirstUnread && (
        <div
          aria-label="Messages non lus"
          className="flex items-center gap-2 py-1"
        >
          <div className="flex-1 h-px bg-red-500/70" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">
            Non lus
          </span>
          <div className="flex-1 h-px bg-red-500/70" />
        </div>
      )}
      <div
        className={`flex flex-col ${isMe ? "items-end" : "items-start"} relative my-1 group ${
          matchesSearch ? "rounded-2xl ring-1 ring-yellow-400/60" : ""
        } ${
          highlightedMessageId === String(m.id)
            ? "rounded-2xl ring-2 ring-sky-400/70 bg-sky-500/10 px-1"
            : ""
        } ${animationsEnabled ? "animate-messageIn" : ""}`}
        key={m.id}
        ref={(el) => onSetRef(String(m.id), el)}
      >
        {/* Ligne de message avec le bouton d'actions parfaitement aligné */}
        <div
          className={`flex items-center gap-1.5 max-w-[85%] sm:max-w-[75%] ${
            isMe ? "flex-row-reverse" : "flex-row"
          }`}
        >
          {/* Bulle du message */}
          {isMediaOnly ? (
            <div
              className={`vibe-msg-media-bubble relative overflow-hidden shadow-sm ${
                isMe
                  ? currentShapeConfig.meRadius
                  : currentShapeConfig.partnerRadius
              }`}
            >
              {urls.map((url, i) => {
                const isVid =
                  url.includes(".mp4") ||
                  url.includes(".webm") ||
                  url.includes("video");
                const isImage = /\.(png|jpe?g|webp|gif|svg|bmp)(\?|#|$)/i.test(
                  url
                );
                if (isVid) {
                  return (
                    <video
                      className="rounded-2xl max-h-64 w-full object-cover"
                      controls
                      key={i}
                      src={url}
                    />
                  );
                }
                if (!isImage) {
                  const fileName = (() => {
                    try {
                      return decodeURIComponent(
                        url.split("?")[0].split("/").pop() || "Document"
                      );
                    } catch {
                      return "Document";
                    }
                  })();
                  return (
                    <a
                      className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-black/10 vibe-dark:bg-white/10 hover:bg-black/20 vibe-dark:hover:bg-white/20 transition-colors max-w-[240px]"
                      href={url}
                      key={i}
                      onClick={(e) => e.stopPropagation()}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <FileText className="w-6 h-6 shrink-0" />
                      <span className="min-w-0">
                        <span className="block text-[11px] font-bold truncate">
                          {fileName}
                        </span>
                        <span className="block text-[10px] opacity-70">
                          Ouvrir le document
                        </span>
                      </span>
                    </a>
                  );
                }
                return (
                  <img
                    alt="Pièce jointe"
                    className="rounded-2xl max-h-64 w-full object-cover"
                    key={i}
                    src={url}
                  />
                );
              })}
            </div>
          ) : (
            <div
              className={`p-3 text-xs leading-relaxed relative shadow-sm min-w-[70px] ${
                isMe
                  ? `${currentShapeConfig.meRadius} ${
                      currentThemeConfig.id === "monochrome"
                        ? "vibe-msg-bubble-me-mono"
                        : currentThemeConfig.textColor === "light"
                          ? "vibe-msg-text-light"
                          : currentThemeConfig.textColor === "dark"
                            ? "vibe-msg-text-dark"
                            : "vibe-msg-text-adaptive"
                    } font-medium`
                  : `${currentShapeConfig.partnerRadius} vibe-msg-bubble-partner`
              }`}
              style={
                isMe && currentThemeConfig.id !== "monochrome"
                  ? {
                      background: currentThemeConfig.gradient,
                      border: currentThemeConfig.border,
                    }
                  : undefined
              }
            >
              {/* Attribution d'un message transféré */}
              {(m as any).forwarded_from?.username && (
                <p className="text-[10px] font-semibold opacity-70 mb-1.5 flex items-center gap-1">
                  <Forward className="w-3 h-3 shrink-0" />
                  Transféré de @{(m as any).forwarded_from.username}
                </p>
              )}

              {/* Citation du message auquel on répond */}
              {(m as any).reply_to_content && (
                <div
                  className={`mb-2 p-2 rounded-xl text-left border-l-4 transition-colors ${
                    isMe
                      ? currentThemeConfig.id === "monochrome"
                        ? "vibe-msg-quote-me-mono"
                        : "vibe-msg-quote-gradient"
                      : "vibe-msg-quote-partner"
                  }`}
                >
                  <p className="text-[10px] font-bold flex items-center gap-1 opacity-90 truncate">
                    <Reply className="w-3 h-3 shrink-0" />
                    <span>
                      @{(m as any).reply_to_username || "message"}
                    </span>
                  </p>
                  <p className="text-[10px] opacity-90 truncate max-w-[240px] mt-0.5">
                    {htmlToPlainText((m as any).reply_to_content)}
                  </p>
                </div>
              )}

              {/* Publication du Livre jointe (carte cliquable) */}
              {(m as DirectMessage).attached_post && (
                <button
                  className="w-full mb-2 p-2 rounded-xl text-left bg-black/10 vibe-dark:bg-white/10 hover:bg-black/20 vibe-dark:hover:bg-white/20 transition-colors flex items-start gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(
                      `/post/${(m as DirectMessage).attached_post!.id}`
                    );
                  }}
                  title="Ouvrir la publication"
                  type="button"
                >
                  <ProfileAvatar
                    alt={(m as DirectMessage).attached_post!.username}
                    className="shrink-0"
                    fallbackName={(m as DirectMessage).attached_post!.username}
                    size="xs"
                    src={
                      (m as DirectMessage).attached_post!.avatar_url ||
                      undefined
                    }
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-bold truncate">
                      @{(m as DirectMessage).attached_post!.username} ·
                      Publication du Livre
                    </span>
                    <span className="block text-[10px] opacity-80 truncate max-w-[240px]">
                      {(m as DirectMessage).attached_post!.excerpt}
                    </span>
                  </span>
                </button>
              )}

              {nonUrlText &&
                (matchesSearch && searchQ ? (
                  <p className="leading-relaxed break-words">
                    {highlightMatches(nonUrlText, searchQ)}
                  </p>
                ) : (
                  <RichContent
                    className="leading-relaxed"
                    content={
                      richMsg
                        ? richSource
                        : hasMdLinks
                          ? m.content
                          : nonUrlText
                    }
                  />
                ))}

              {urls.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {urls.map((url, i) => {
                    const isVid =
                      url.includes(".mp4") ||
                      url.includes(".webm") ||
                      url.includes("video");
                    const isImage =
                      /\.(png|jpe?g|webp|gif|svg|bmp)(\?|#|$)/i.test(url);
                    if (isVid) {
                      return (
                        <video
                          className="rounded-xl max-h-48 w-full object-cover"
                          controls
                          key={i}
                          src={url}
                        />
                      );
                    }
                    if (!isImage) {
                      const fileName = (() => {
                        try {
                          return decodeURIComponent(
                            url.split("?")[0].split("/").pop() || "Document"
                          );
                        } catch {
                          return "Document";
                        }
                      })();
                      return (
                        <a
                          className="flex items-center gap-2.5 p-2.5 rounded-xl bg-black/10 vibe-dark:bg-white/10 hover:bg-black/20 vibe-dark:hover:bg-white/20 transition-colors max-w-[240px]"
                          href={url}
                          key={i}
                          onClick={(e) => e.stopPropagation()}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          <FileText className="w-6 h-6 shrink-0" />
                          <span className="min-w-0">
                            <span className="block text-[11px] font-bold truncate">
                              {fileName}
                            </span>
                            <span className="block text-[10px] opacity-70">
                              Ouvrir le document
                            </span>
                          </span>
                        </a>
                      );
                    }
                    return (
                      <img
                        alt="Pièce jointe"
                        className="rounded-xl max-h-48 w-full object-cover"
                        key={i}
                        src={url}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Bouton d'options (⋮) : centré verticalement, apparaît au survol */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              className="vibe-chat-icon-btn p-1.5 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onToggleActionMenu(String(m.id));
              }}
              title="Options du message"
              type="button"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Menu d'actions flottant au-dessus du message */}
        {actionMenuFor === String(m.id) && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={onCloseActionMenu}
            />
            <div
              className={`absolute z-40 bottom-full ${
                isMe ? "right-0" : "left-0"
              } mb-2 p-1.5 rounded-2xl vibe-menu shadow-2xl flex flex-col gap-0.5 animate-fadeIn min-w-[210px]`}
            >
              <div className="flex items-center justify-between px-1.5 py-1">
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    className="p-1 rounded-lg hover:bg-zinc-200/60 vibe-dark:hover:bg-zinc-800/60 text-base transition-transform hover:scale-125"
                    key={emoji}
                    onClick={() => onToggleReaction(m, emoji)}
                    type="button"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <div className="w-full border-t border-zinc-200 vibe-dark:border-zinc-800 my-0.5" />

              {/* Option Modifier le message (limite 60 min) */}
              {canEdit && (
                <button
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] vibe-chat-menu-item transition-colors text-left"
                  onClick={() => onEditMessage(m)}
                  type="button"
                >
                  <Pencil className="w-3.5 h-3.5 text-zinc-500 vibe-dark:text-zinc-400" />{" "}
                  Modifier le message
                </button>
              )}

              {/* Option Informations */}
              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] vibe-chat-menu-item transition-colors text-left"
                onClick={() => onOpenInfoModal(m)}
                type="button"
              >
                <Info className="w-3.5 h-3.5 text-zinc-500 vibe-dark:text-zinc-400" />{" "}
                Informations
              </button>

              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] vibe-chat-menu-item transition-colors text-left"
                onClick={() => onReplyTo(m)}
                type="button"
              >
                <Reply className="w-3.5 h-3.5 text-zinc-500 vibe-dark:text-zinc-400" />{" "}
                Répondre
              </button>

              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] vibe-chat-menu-item transition-colors text-left"
                onClick={() => onForward(m)}
                type="button"
              >
                <Forward className="w-3.5 h-3.5 text-zinc-500 vibe-dark:text-zinc-400" />{" "}
                Transférer
              </button>

              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] vibe-chat-menu-item transition-colors text-left"
                onClick={() => onCopyMessage(m)}
                type="button"
              >
                <Copy className="w-3.5 h-3.5 text-zinc-500 vibe-dark:text-zinc-400" />{" "}
                Copier le message
              </button>

              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] vibe-chat-menu-item transition-colors text-left"
                onClick={() => onCopyMessageLink(m)}
                type="button"
              >
                <Link2 className="w-3.5 h-3.5 text-zinc-500 vibe-dark:text-zinc-400" />{" "}
                Copier le lien du message
              </button>

              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] vibe-chat-menu-item transition-colors text-left"
                onClick={() => onToggleTranslatePicker(String(m.id))}
                type="button"
              >
                <Languages className="w-3.5 h-3.5 text-zinc-500 vibe-dark:text-zinc-400" />
                Traduire
                <span className="ml-auto text-[9px] text-zinc-400 font-mono">
                  {translateLang ||
                    browserToDeepLCode(navigator.language || "fr-FR")}
                </span>
              </button>
              {translatePickerFor === String(m.id) && (
                <div className="max-h-44 overflow-y-auto border-t border-zinc-200 vibe-dark:border-zinc-800 pt-1 pl-2">
                  {TRANSLATION_LANGUAGES.map((lg) => (
                    <button
                      className="w-full text-left px-3 py-1 rounded-lg text-[10px] text-zinc-600 vibe-dark:text-zinc-300 hover:bg-black/5 vibe-dark:hover:bg-zinc-800/60 transition-colors"
                      key={lg.code}
                      onClick={() => onTranslateMessage(m, lg.code)}
                      type="button"
                    >
                      {lg.label}
                    </button>
                  ))}
                </div>
              )}

              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] vibe-chat-menu-item transition-colors text-left"
                onClick={() => onTogglePin(m)}
                type="button"
              >
                {pinnedMessages.some((p) => String(p.id) === String(m.id)) ? (
                  <>
                    <PinOff className="w-3.5 h-3.5 text-zinc-500 vibe-dark:text-zinc-400" />{" "}
                    Désépingler
                  </>
                ) : (
                  <>
                    <Pin className="w-3.5 h-3.5 text-zinc-500 vibe-dark:text-zinc-400" />{" "}
                    Épingler
                  </>
                )}
              </button>

              {isMe && !String(m.id).startsWith("temp") && (
                <button
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] text-red-500 hover:bg-red-500/10 transition-colors text-left"
                  onClick={() => onDeleteMessage(m)}
                  type="button"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Supprimer pour tout le
                  monde
                </button>
              )}

              {!String(m.id).startsWith("temp") && (
                <button
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] text-red-500 hover:bg-red-500/10 transition-colors text-left"
                  onClick={() => onHideMessage(m)}
                  type="button"
                >
                  <X className="w-3.5 h-3.5" /> Supprimer pour moi
                </button>
              )}
            </div>
          </>
        )}

        {/* Réactions affichées sous la bulle */}
        {Array.isArray((m as any).reactions) &&
          (m as any).reactions.length > 0 && (
            <div className="flex gap-1 mt-1">
              {(m as any).reactions.map(
                (r: { emoji: string; count: number; mine: boolean }) => (
                  <motion.button
                    className={`vibe-chat-reaction-chip px-1.5 py-0.5 rounded-full text-[10px] border transition-colors ${
                      animationsEnabled ? "animate-reactionPop" : ""
                    } ${
                      r.mine
                        ? "bg-sky-500/20 border-sky-500 text-sky-600 vibe-dark:text-sky-300"
                        : ""
                    }`}
                    key={r.emoji}
                    onClick={() => onToggleReaction(m, r.emoji)}
                    transition={{
                      damping: 20,
                      stiffness: 500,
                      type: "spring",
                    }}
                    type="button"
                    whileTap={animationsEnabled ? { scale: 0.8 } : undefined}
                  >
                    {r.emoji} {r.count}
                  </motion.button>
                )
              )}
            </div>
          )}

        {/* Traduction mAI sous la bulle originale */}
        {translations[m.id] && (
          <div className="max-w-[85%] sm:max-w-[75%] mt-1 pl-2 border-l-2 border-zinc-300 vibe-dark:border-zinc-700">
            <p className="text-[11px] italic text-zinc-500 vibe-dark:text-zinc-400 leading-relaxed break-words">
              {translations[m.id]}
            </p>
            <p className="text-[9px] text-zinc-400 vibe-dark:text-zinc-600 mt-0.5">
              Traduit avec mAI
            </p>
          </div>
        )}
        {translatingIds.has(String(m.id)) && (
          <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" /> Traduction…
          </p>
        )}
        {/* Badge envoi programmé */}
        {(m as any).status === "scheduled" && (
          <span className="mt-1 inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 vibe-dark:text-amber-400">
            <Clock className="w-2.5 h-2.5" />
            Envoi prévu
            {(m as any).send_at ? ` le ${formatTime((m as any).send_at)}` : ""}
          </span>
        )}

        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-zinc-500 px-1 font-mono">
          <span>{formatTime(m.created_at)}</span>
          {m.is_edited && (
            <span
              className="text-[9px] text-zinc-400 italic"
              title={
                m.edited_at
                  ? `Modifié à ${formatTime(m.edited_at)}`
                  : "Modifié"
              }
            >
              (modifié)
            </span>
          )}
          {isMe &&
            (m.is_read || (m as any).read_at ? (
              <span
                className="inline-flex items-center gap-0.5 text-sky-400 font-medium"
                title="Vu"
              >
                <Eye className="w-3 h-3" />
                <span className="text-[9px]">Vu</span>
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-0.5 text-zinc-400"
                title="Envoyé"
              >
                <Check className="w-3 h-3" />
                <span className="text-[9px]">Envoyé</span>
              </span>
            ))}
        </div>
      </div>
    </React.Fragment>
  );
};
