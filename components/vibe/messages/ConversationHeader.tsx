/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — CONVERSATION HEADER (components/vibe/messages/ConversationHeader.tsx)
 * En-tête de chat actif, modération, recherche locale et messages épinglés
 * ============================================================================
 */

import {
  AlertCircleIcon as AlertCircle,
  ArrowLeftIcon as ArrowLeft,
  BanIcon as Ban,
  BookOpenIcon as BookOpen,
  CrownIcon as Crown,
  FlagIcon as Flag,
  InfoIcon as Info,
  MailIcon as Mail,
  MoreVerticalIcon as MoreVertical,
  PaletteIcon as Palette,
  PencilIcon as Pencil,
  PinIcon as Pin,
  SearchIcon as Search,
  Trash2Icon as Trash2,
  UserPlusIcon as UserPlus,
  UsersIcon as Users,
  XIcon as X,
} from "@mdevs/icons";
import type React from "react";
import { getBookIcon } from "@/components/vibe/common/bookIcons";
import { ProfileAvatar } from "@/components/vibe/common/ProfileAvatar";
import { VerifiedBadge } from "@/components/vibe/common/VerifiedBadge";
import type { DirectMessage, DMConversation } from "@/lib/vibe/types/vibe";
import { useNavigate } from "../router";
import type { ActivePartnerInfo } from "./messageTypes";

export interface ConversationHeaderProps {
  activeConv: DMConversation | null;
  activePartner: ActivePartnerInfo;
  activePartnerBlocked: boolean;
  bookId: string | null;
  convMenuOpen: boolean;
  convSearchOpen: boolean;
  convSearchQuery: string;
  errorMessage: string | null;
  groupIsAdmin: boolean;
  groupMembers: Array<{
    user_id: string | number;
    username: string;
    avatar_url?: string;
    role: string;
  }>;
  isBookConv: boolean;
  isGroupConv: boolean;
  isModerating: boolean;
  onBack: () => void;
  onBlockPartner: () => void;
  onChangeSearchQuery: (q: string) => void;
  onCloseConvMenu: () => void;
  onCloseSearch: () => void;
  onDeleteConversation: () => void;
  onMarkUnread: () => void;
  onOpenAddMembers: () => void;
  onOpenGroupInfo: () => void;
  onOpenRenameModal: () => void;
  onOpenReportModal: () => void;
  onOpenSearch: () => void;
  onOpenThemeModal: () => void;
  onRemoveMember: (userId: string) => void;
  onScrollToMessage: (id: string) => void;
  onSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onToggleConvMenu: () => void;
  onTogglePinsCollapsed: () => void;
  onTransferAdmin: (userId: string | number) => void;
  partnerTyping: boolean;
  pinnedMessages: DirectMessage[];
  pinsCollapsed: boolean;
}

export const ConversationHeader: React.FC<ConversationHeaderProps> = ({
  activePartner,
  activeConv,
  isGroupConv,
  isBookConv,
  bookId,
  activePartnerBlocked,
  convSearchOpen,
  convSearchQuery,
  convMenuOpen,
  pinnedMessages,
  pinsCollapsed,
  partnerTyping,
  errorMessage,
  groupIsAdmin,
  groupMembers,
  isModerating,
  onBack,
  onOpenSearch,
  onCloseSearch,
  onChangeSearchQuery,
  onSearchKeyDown,
  onOpenThemeModal,
  onToggleConvMenu,
  onCloseConvMenu,
  onOpenAddMembers,
  onOpenGroupInfo,
  onTransferAdmin,
  onRemoveMember,
  onMarkUnread,
  onOpenRenameModal,
  onBlockPartner,
  onOpenReportModal,
  onDeleteConversation,
  onTogglePinsCollapsed,
  onScrollToMessage,
}) => {
  const navigate = useNavigate();

  return (
    <>
      {/* Chat Top Header */}
      <div className="vibe-chat-header px-3.5 pt-[max(0.875rem,env(safe-area-inset-top))] pb-3.5 border-b flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            className="vibe-chat-icon-btn md:hidden p-1.5"
            onClick={onBack}
            type="button"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {isBookConv ? (
            <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-zinc-100 vibe-dark:bg-zinc-900 border border-zinc-200 vibe-dark:border-zinc-800">
              {(() => {
                const HeaderBookIcon = getBookIcon(
                  activeConv?.book_icon || "BookHeart"
                );
                return (
                  <HeaderBookIcon className="w-4 h-4 text-zinc-500 vibe-dark:text-zinc-400" />
                );
              })()}
            </span>
          ) : (
            <ProfileAvatar
              alt="Avatar"
              className="border border-zinc-200 vibe-dark:border-zinc-800 shrink-0"
              fallbackName={isGroupConv ? "#" : activePartner.username}
              size="sm"
              src={activePartner.avatar_url}
            />
          )}
          <div>
            <h3 className="text-xs font-bold text-black vibe-dark:text-white flex items-center gap-1.5">
              {isBookConv ? (
                <BookOpen className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              ) : isGroupConv ? (
                <Users className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              ) : null}
              {isBookConv && bookId ? (
                <button
                  className="hover:underline underline-offset-2"
                  onClick={() => navigate(`/books/${bookId}`)}
                  title="Ouvrir le Livre"
                  type="button"
                >
                  {activePartner.display_name || activePartner.username}
                </button>
              ) : (
                <span>
                  {activeConv?.custom_name ||
                    activePartner.display_name ||
                    activePartner.username}
                </span>
              )}
              {!isGroupConv && activeConv?.custom_name && (
                <span className="text-[10px] text-zinc-500 font-normal">
                  (@{activePartner.username})
                </span>
              )}
              {!isGroupConv && (
                <VerifiedBadge
                  isVerified={activePartner.is_verified}
                  size="xs"
                  tier={activePartner.tier}
                />
              )}
              {isGroupConv && !isBookConv && (
                <span className="text-[10px] text-zinc-500 font-normal">
                  {((activeConv?.members || []) as any[]).length > 0
                    ? `· ${((activeConv?.members || []) as any[]).length} membre${((activeConv?.members || []) as any[]).length > 1 ? "s" : ""}`
                    : "· groupe"}
                </span>
              )}
              {isBookConv && (
                <span className="px-1.5 py-0.5 rounded-md bg-zinc-100 vibe-dark:bg-zinc-900 border border-zinc-200 vibe-dark:border-zinc-800 text-[9px] font-bold text-zinc-500 shrink-0">
                  Livre
                </span>
              )}
              {activePartnerBlocked && (
                <span className="text-[9px] bg-zinc-100 vibe-dark:bg-zinc-800 text-zinc-600 vibe-dark:text-zinc-400 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Ban className="w-2.5 h-2.5" /> Bloqué
                </span>
              )}
            </h3>
            <span className="text-[11px] text-zinc-500 font-mono">
              {isBookConv
                ? "Conversation du Livre · « / » pour joindre une publication"
                : isGroupConv
                  ? `${((activeConv?.members || []) as any[])
                      .map((mm: any) => `@${mm.username}`)
                      .slice(0, 3)
                      .join(
                        " "
                      )}${((activeConv?.members || []) as any[]).length > 3 ? "…" : ""}`
                  : `@${activePartner.username}`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Recherche dans la conversation */}
          {convSearchOpen ? (
            <div className="flex items-center gap-1 rounded-full bg-zinc-100 vibe-dark:bg-zinc-900 px-2 py-1">
              <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <input
                autoFocus
                className="w-28 sm:w-40 bg-transparent text-xs text-black vibe-dark:text-white placeholder-zinc-500 focus:outline-none"
                onChange={(e) => onChangeSearchQuery(e.target.value)}
                onKeyDown={onSearchKeyDown}
                placeholder="Filtrer…"
                type="text"
                value={convSearchQuery}
              />
              <button
                className="text-zinc-500 hover:text-black vibe-dark:hover:text-white"
                onClick={onCloseSearch}
                title="Fermer la recherche"
                type="button"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              className="vibe-chat-icon-btn p-2 transition-colors"
              onClick={onOpenSearch}
              title="Rechercher dans la conversation"
              type="button"
            >
              <Search className="w-4 h-4" />
            </button>
          )}
          <button
            className="vibe-chat-icon-btn p-2 transition-colors"
            onClick={onOpenThemeModal}
            title="Personnaliser les couleurs et le fond de discussion"
            type="button"
          >
            <Palette className="w-4 h-4" />
          </button>

          {/* Menu modération de la conversation */}
          <div className="relative">
            <button
              className="vibe-chat-icon-btn p-2 transition-colors"
              onClick={onToggleConvMenu}
              title="Options de la conversation"
              type="button"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {convMenuOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={onCloseConvMenu} />
                <div className="absolute right-0 top-full mt-1 w-56 z-30 p-1.5 rounded-2xl vibe-menu shadow-2xl animate-fadeIn">
                  {isBookConv && bookId && (
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] vibe-chat-menu-item text-left"
                      onClick={() => {
                        onCloseConvMenu();
                        navigate(`/books/${bookId}`);
                      }}
                      type="button"
                    >
                      <BookOpen className="w-3.5 h-3.5" /> Ouvrir le Livre
                    </button>
                  )}
                  {isGroupConv && !isBookConv && groupIsAdmin && (
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] vibe-chat-menu-item text-left"
                      onClick={onOpenAddMembers}
                      type="button"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Ajouter des membres
                    </button>
                  )}
                  {isGroupConv && !isBookConv && (
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] vibe-chat-menu-item text-left"
                      onClick={onOpenGroupInfo}
                      type="button"
                    >
                      <Info className="w-3.5 h-3.5" /> Infos du groupe
                    </button>
                  )}
                  {isGroupConv && !isBookConv && (
                    <>
                      <div className="px-3 pt-1 pb-0.5 text-[9px] uppercase font-bold tracking-wider text-zinc-400">
                        Membres
                      </div>
                      {groupMembers.map((mm) => (
                        <div
                          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] text-left"
                          key={mm.user_id}
                        >
                          <ProfileAvatar
                            alt={mm.username}
                            fallbackName={mm.username}
                            size="xs"
                            src={mm.avatar_url}
                          />
                          <span className="truncate flex-1">
                            @{mm.username}
                          </span>
                          {mm.role === "admin" && (
                            <span className="text-[9px] font-bold text-zinc-400">
                              admin
                            </span>
                          )}
                          {groupIsAdmin && mm.role !== "admin" && (
                            <span className="flex items-center gap-1.5 shrink-0">
                              <button
                                className="text-amber-500 hover:text-amber-400"
                                onClick={() => onTransferAdmin(mm.user_id)}
                                title="Nommer administrateur"
                                type="button"
                              >
                                <Crown className="w-3 h-3" />
                              </button>
                              <button
                                className="text-red-500 hover:text-red-400"
                                onClick={() =>
                                  onRemoveMember(String(mm.user_id))
                                }
                                title="Retirer du groupe"
                                type="button"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          )}
                        </div>
                      ))}
                      <div className="border-t border-zinc-200 vibe-dark:border-zinc-800 my-1" />
                    </>
                  )}
                  {!isGroupConv && (
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] vibe-chat-menu-item text-left"
                      onClick={onMarkUnread}
                      type="button"
                    >
                      <Mail className="w-3.5 h-3.5" /> Marquer comme non lu
                    </button>
                  )}
                  {!isBookConv && (
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] vibe-chat-menu-item text-left"
                      onClick={onOpenRenameModal}
                      type="button"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Renommer la
                      conversation
                    </button>
                  )}
                  {!isGroupConv && (
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] vibe-chat-menu-item text-left disabled:opacity-40"
                      disabled={isModerating}
                      onClick={onBlockPartner}
                      type="button"
                    >
                      <Ban className="w-3.5 h-3.5" />{" "}
                      {activePartnerBlocked
                        ? "Débloquer cet utilisateur"
                        : "Bloquer cet utilisateur"}
                    </button>
                  )}
                  {!isGroupConv && (
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] text-amber-500 hover:bg-amber-500/10 text-left"
                      onClick={onOpenReportModal}
                      type="button"
                    >
                      <Flag className="w-3.5 h-3.5" /> Signaler la conversation
                    </button>
                  )}
                  {!isGroupConv && (
                    <>
                      <div className="border-t border-zinc-200 vibe-dark:border-zinc-800 my-1" />
                      <button
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] text-red-500 hover:bg-red-500/10 text-left disabled:opacity-40"
                        disabled={isModerating}
                        onClick={onDeleteConversation}
                        type="button"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Supprimer la
                        conversation
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="m-3 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 vibe-dark:text-red-400 flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Bandeau utilisateur bloqué */}
      {activePartnerBlocked && (
        <div className="vibe-chat-banner m-3 p-3 text-xs flex items-center gap-2">
          <Ban className="w-4 h-4 text-red-400 shrink-0" />
          <span>
            Vous avez bloqué <strong>@{activePartner.username}</strong>. Vous ne
            pouvez plus échanger de messages. Débloquez-le depuis le menu{" "}
            <strong>⋮</strong> en haut à droite.
          </span>
        </div>
      )}

      {/* Indicateur de frappe du partenaire (temps réel) */}
      {partnerTyping && !activePartnerBlocked && (
        <div
          aria-live="polite"
          className="px-4 pt-1.5 pb-0.5 flex items-center gap-2 animate-fadeIn"
        >
          <div className="vibe-chat-typing flex items-center gap-1.5 px-3 py-1.5 rounded-full">
            <span className="flex gap-0.5">
              <span
                className="w-1 h-1 rounded-full bg-zinc-400 animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-1 h-1 rounded-full bg-zinc-400 animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-1 h-1 rounded-full bg-zinc-400 animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </span>
            <span className="text-[11px] text-zinc-600 vibe-dark:text-zinc-400">
              @{activePartner.username} est en train d'écrire…
            </span>
          </div>
        </div>
      )}

      {/* Bannière messages épinglés (repliable) */}
      {pinnedMessages.length > 0 && (
        <div className="mx-3 mt-2 rounded-2xl border border-zinc-200 vibe-dark:border-zinc-800 bg-zinc-50 vibe-dark:bg-zinc-950 overflow-hidden">
          <button
            className="w-full flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold text-zinc-600 vibe-dark:text-zinc-300 hover:bg-zinc-100 vibe-dark:hover:bg-zinc-900 transition-colors"
            onClick={onTogglePinsCollapsed}
            type="button"
          >
            <Pin className="w-3.5 h-3.5" />
            <span>📌 Messages épinglés ({pinnedMessages.length})</span>
            <span className="ml-auto text-zinc-400">
              {pinsCollapsed ? "▸" : "▾"}
            </span>
          </button>
          {!pinsCollapsed && (
            <div className="px-3 pb-2 space-y-1">
              {pinnedMessages.map((p) => (
                <button
                  className="w-full text-left px-2 py-1.5 rounded-xl hover:bg-zinc-100 vibe-dark:hover:bg-zinc-900 transition-colors"
                  key={p.id}
                  onClick={() => onScrollToMessage(String(p.id))}
                  title="Aller au message"
                  type="button"
                >
                  <p className="text-[11px] text-zinc-600 vibe-dark:text-zinc-300 truncate">
                    {String(p.content || "").slice(0, 40) || "(média)"}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};
