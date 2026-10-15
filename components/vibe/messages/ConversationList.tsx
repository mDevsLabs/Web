/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — CONVERSATION LIST (components/vibe/messages/ConversationList.tsx)
 * Volet latéral de recherche et sélection des conversations privées et groupes
 * ============================================================================
 */

import {
  BanIcon as Ban,
  BookOpenIcon as BookOpen,
  Loader2Icon as Loader2,
  LockIcon as Lock,
  MailIcon as Mail,
  SearchIcon as Search,
  UsersIcon as Users,
  XIcon as X,
} from "@mdevs/icons";
import React from "react";
import { getBookIcon } from "@/components/vibe/common/bookIcons";
import { ProfileAvatar } from "@/components/vibe/common/ProfileAvatar";
import { VerifiedBadge } from "@/components/vibe/common/VerifiedBadge";
import type { DMConversation } from "@/lib/vibe/types/vibe";
import { dmDraftKey } from "./messageTypes";

export interface ConversationListProps {
  conversations: DMConversation[];
  activePartnerId: string | number | null;
  isLoading: boolean;
  dmDraftKeys: string[];
  searchQuery: string;
  searchResults: Array<{
    id: string | number;
    username: string;
    display_name?: string;
    avatar_url?: string;
    is_verified?: boolean;
    tier?: string;
  }>;
  isSearchingUsers: boolean;
  onSearchUsers: (query: string) => void;
  onClearSearch: () => void;
  onStartConversationWith: (user: {
    id: string | number;
    username: string;
    display_name?: string;
    avatar_url?: string;
  }) => void;
  onSelectConversation: (conv: DMConversation) => void;
  onOpenGroupModal: () => void;
  onOpenConvMenu: (conv: DMConversation) => void;
  formatTime: (dateStr: string) => string;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activePartnerId,
  isLoading,
  dmDraftKeys,
  searchQuery,
  searchResults,
  isSearchingUsers,
  onSearchUsers,
  onClearSearch,
  onStartConversationWith,
  onSelectConversation,
  onOpenGroupModal,
  onOpenConvMenu,
  formatTime,
}) => {
  return (
    <div
      className={`vibe-chat-sidebar w-full md:w-80 lg:w-96 border-r flex flex-col ${
        activePartnerId ? "hidden md:flex" : "flex"
      }`}
    >
      {/* Header */}
      <div className="vibe-chat-sidebar-header p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-bold tracking-tight">Messages</h1>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            className="vibe-chat-icon-btn p-2 transition-colors"
            onClick={onOpenGroupModal}
            title="Créer un groupe"
            type="button"
          >
            <Users className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono text-zinc-500 flex items-center gap-1">
            <Lock className="w-3 h-3" /> Privé
          </span>
        </div>
      </div>

      {/* User Search Bar */}
      <div className="vibe-chat-search-bar p-3">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            className="vibe-chat-search-input w-full py-2 pl-9 pr-8 rounded-2xl text-xs focus:outline-none"
            onChange={(e) => onSearchUsers(e.target.value)}
            placeholder="Rechercher un membre (@nom)..."
            type="text"
            value={searchQuery}
          />
          {searchQuery && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black vibe-dark:hover:text-white"
              onClick={onClearSearch}
              type="button"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Loader pendant la recherche */}
        {isSearchingUsers && (
          <div className="vibe-chat-modal-content mt-2 p-3 rounded-2xl text-center text-xs text-zinc-600 vibe-dark:text-zinc-400 flex items-center justify-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-black vibe-dark:text-white" />
            <span>Recherche des membres...</span>
          </div>
        )}

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && !isSearchingUsers && (
          <div className="vibe-chat-modal-content mt-2 divide-y divide-zinc-200 vibe-dark:divide-zinc-900 rounded-2xl overflow-hidden shadow-2xl">
            {searchResults.map((u) => (
              <button
                className="vibe-chat-menu-item w-full p-2.5 flex items-center gap-3 cursor-pointer transition-colors text-left"
                key={u.id}
                onClick={() => onStartConversationWith(u)}
                type="button"
              >
                <ProfileAvatar
                  alt={u.username}
                  className="border border-zinc-200 vibe-dark:border-zinc-800 shrink-0"
                  fallbackName={u.username}
                  size="sm"
                  src={u.avatar_url}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-black vibe-dark:text-white truncate">
                      {u.display_name || u.username}
                    </span>
                    <VerifiedBadge
                      isVerified={u.is_verified}
                      size="xs"
                      tier={u.tier}
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500 font-mono">
                    @{u.username}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Aucun résultat */}
        {searchQuery.trim().length > 0 &&
          searchResults.length === 0 &&
          !isSearchingUsers && (
            <div className="vibe-chat-modal-content mt-2 p-4 rounded-2xl text-center text-xs text-zinc-500">
              <p className="font-semibold text-zinc-600 vibe-dark:text-zinc-400">
                Aucun résultat
              </p>
              <p className="text-[11px] text-zinc-400 vibe-dark:text-zinc-600 mt-0.5">
                Aucun compte trouvé pour « {searchQuery} »
              </p>
            </div>
          )}
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 vibe-dark:divide-zinc-900">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-black vibe-dark:text-white" />
            <span>Chargement des conversations...</span>
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 space-y-2">
            <Mail className="w-8 h-8 mx-auto text-zinc-400 vibe-dark:text-zinc-700" />
            <p className="text-xs">Aucun message direct pour le moment.</p>
            <p className="text-[11px] text-zinc-400 vibe-dark:text-zinc-600">
              Recherchez un utilisateur ci-dessus pour engager la
              conversation.
            </p>
          </div>
        ) : (
          conversations.map((conv) => {
            const isSelected = activePartnerId === conv.partner_id;
            const hasDraft = dmDraftKeys.includes(
              dmDraftKey(conv.partner_id)
            );
            const BookIcon = conv.is_book
              ? getBookIcon(conv.book_icon || "BookHeart")
              : null;
            return (
              <div
                className={`vibe-chat-conv-item p-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
                  isSelected ? "active" : ""
                }`}
                key={conv.partner_id}
                onClick={() => onSelectConversation(conv)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onOpenConvMenu(conv);
                }}
              >
                {conv.is_book && BookIcon ? (
                  <span className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-zinc-100 vibe-dark:bg-zinc-900 border border-zinc-200 vibe-dark:border-zinc-800">
                    <BookIcon className="w-5 h-5 text-zinc-500 vibe-dark:text-zinc-400" />
                  </span>
                ) : (
                  <ProfileAvatar
                    alt={conv.partner_username}
                    className="border border-zinc-200 vibe-dark:border-zinc-800 shrink-0"
                    fallbackName={conv.is_group ? "#" : conv.partner_username}
                    size="md"
                    src={conv.partner_avatar_url}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-black vibe-dark:text-white truncate flex items-center gap-1.5">
                      {conv.is_book ? (
                        <span className="px-1.5 py-0.5 rounded-md bg-zinc-100 vibe-dark:bg-zinc-900 border border-zinc-200 vibe-dark:border-zinc-800 text-[9px] font-bold text-zinc-500 shrink-0 flex items-center gap-1">
                          <BookOpen className="w-2.5 h-2.5" /> Livre
                        </span>
                      ) : conv.is_group ? (
                        <Users className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                      ) : null}
                      <span className="truncate">
                        {conv.custom_name ||
                          conv.partner_display_name ||
                          conv.partner_username}
                        {!conv.is_group && conv.custom_name && (
                          <span className="ml-1 text-[10px] text-zinc-500 font-normal">
                            @{conv.partner_username}
                          </span>
                        )}
                      </span>
                      {conv.is_group &&
                        !conv.is_book &&
                        Boolean(conv.members?.length) && (
                          <span className="text-[10px] text-zinc-500 font-normal shrink-0">
                            ({conv.members!.length + 1})
                          </span>
                        )}
                    </h4>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {formatTime(conv.last_message_at)}
                    </span>
                  </div>
                  <p className="text-xs opacity-70 truncate mt-0.5">
                    {conv.last_message_content || "Nouveau message"}
                  </p>
                  {hasDraft && (
                    <span className="mt-0.5 inline-block px-1.5 py-0.5 rounded-md bg-zinc-200 vibe-dark:bg-zinc-800 text-[9px] font-bold text-zinc-500">
                      Brouillon
                    </span>
                  )}
                </div>
                {conv.is_blocked && (
                  <span title="Utilisateur bloqué">
                    <Ban className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  </span>
                )}
                {Boolean(
                  conv.unread_count &&
                    conv.unread_count > 0 &&
                    String(conv.partner_id) !== String(activePartnerId)
                ) && (
                  <span className="vibe-chat-badge-unread w-5 h-5 rounded-full font-bold text-[10px] flex items-center justify-center shrink-0 animate-pulse">
                    {conv.unread_count}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
