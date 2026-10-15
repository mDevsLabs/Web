/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — GROUP MANAGEMENT MODAL (components/vibe/messages/GroupManagementModal.tsx)
 * Modale d'informations et de gestion d'un groupe : avatar, nom, rôles et membres
 * ============================================================================
 */

import {
  CheckIcon as Check,
  ImageIcon,
  Loader2Icon as Loader2,
  Trash2Icon as Trash2,
  UsersIcon as Users,
  XIcon as X,
} from "@mdevs/icons";
import React from "react";
import { ProfileAvatar } from "@/components/vibe/common/ProfileAvatar";
import type { DMConversation } from "@/lib/vibe/types/vibe";
import type { ActiveGroupInfo } from "./messageTypes";

export interface GroupManagementModalProps {
  open: boolean;
  groupId: string | null;
  activeConv: DMConversation | null;
  activeGroupInfo: ActiveGroupInfo | null;
  groupMembers: Array<{
    user_id: string | number;
    username: string;
    display_name?: string;
    avatar_url?: string;
    role: string;
  }>;
  groupIsAdmin: boolean;
  groupNameDraft: string;
  groupSaving: boolean;
  groupAvatarUploading: boolean;
  currentUserId?: string | number;
  groupAvatarInputRef: React.RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onAvatarSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeGroupNameDraft: (name: string) => void;
  onSaveGroupName: () => void;
  onTransferAdmin: (userId: string | number) => void;
  onRemoveMember: (userId: string) => void;
  onDeleteGroup: () => void;
}

export const GroupManagementModal: React.FC<GroupManagementModalProps> = ({
  open,
  groupId,
  activeConv,
  activeGroupInfo,
  groupMembers,
  groupIsAdmin,
  groupNameDraft,
  groupSaving,
  groupAvatarUploading,
  currentUserId,
  groupAvatarInputRef,
  onClose,
  onAvatarSelected,
  onChangeGroupNameDraft,
  onSaveGroupName,
  onTransferAdmin,
  onRemoveMember,
  onDeleteGroup,
}) => {
  if (!open || !groupId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm vibe-chat-modal-content rounded-3xl p-5 space-y-4 animate-scaleUp text-zinc-900 vibe-dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 vibe-dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <h3 className="text-sm font-bold">Infos du groupe</h3>
          </div>
          <button
            className="vibe-chat-icon-btn p-1"
            onClick={onClose}
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Photo du groupe */}
        <div className="flex flex-col items-center gap-2">
          <ProfileAvatar
            alt={activeConv?.partner_username || "Groupe"}
            fallbackName={
              activeConv?.partner_display_name ||
              activeConv?.partner_username ||
              "Groupe"
            }
            size="lg"
            src={
              (activeGroupInfo as any)?.group_avatar_url ||
              activeConv?.partner_avatar_url
            }
          />
          <input
            accept="image/*"
            className="hidden"
            onChange={onAvatarSelected}
            ref={groupAvatarInputRef}
            type="file"
          />
          {groupIsAdmin && (
            <button
              className="text-[11px] font-semibold text-sky-600 vibe-dark:text-sky-400 hover:underline disabled:opacity-40 flex items-center gap-1"
              disabled={groupAvatarUploading}
              onClick={() => groupAvatarInputRef.current?.click()}
              type="button"
            >
              {groupAvatarUploading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <ImageIcon className="w-3 h-3" />
              )}
              {groupAvatarUploading ? "Envoi…" : "Changer la photo"}
            </button>
          )}
        </div>

        {/* Nom du groupe */}
        {groupIsAdmin ? (
          <div className="flex items-center gap-2">
            <input
              className="flex-1 px-3 py-2 rounded-xl bg-zinc-50 vibe-dark:bg-zinc-900 border border-zinc-200 vibe-dark:border-zinc-800 text-xs outline-none focus:border-zinc-500"
              maxLength={100}
              onChange={(e) => onChangeGroupNameDraft(e.target.value)}
              placeholder="Nom du groupe"
              type="text"
              value={groupNameDraft}
            />
            <button
              className="px-3 py-2 rounded-xl bg-zinc-900 text-white vibe-dark:bg-white vibe-dark:text-black text-[11px] font-bold disabled:opacity-40 flex items-center gap-1"
              disabled={groupSaving || !groupNameDraft.trim()}
              onClick={onSaveGroupName}
              type="button"
            >
              {groupSaving ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Check className="w-3 h-3" />
              )}
              Enregistrer
            </button>
          </div>
        ) : (
          <p className="text-center text-sm font-bold">
            {activeConv?.partner_display_name ||
              activeConv?.partner_username ||
              "Groupe"}
          </p>
        )}

        {/* Membres + rôles + administration */}
        <div className="space-y-1">
          <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 px-1">
            Membres ({groupMembers.length})
          </p>
          <div className="max-h-44 overflow-y-auto divide-y divide-zinc-100 vibe-dark:divide-zinc-900 rounded-2xl border border-zinc-200 vibe-dark:border-zinc-800">
            {groupMembers.map((mm) => (
              <div
                className="flex items-center gap-2 px-3 py-2 text-[11px]"
                key={mm.user_id}
              >
                <ProfileAvatar
                  alt={mm.username}
                  fallbackName={mm.username}
                  size="xs"
                  src={mm.avatar_url}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">@{mm.username}</p>
                  {mm.display_name && (
                    <p className="truncate text-[10px] text-zinc-500">
                      {mm.display_name}
                    </p>
                  )}
                </div>
                {mm.role === "admin" && (
                  <span className="text-[9px] font-bold text-zinc-400 shrink-0">
                    admin
                  </span>
                )}
                {groupIsAdmin &&
                  String(mm.user_id) !== String(currentUserId) && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        className="text-sky-600 vibe-dark:text-sky-400 hover:underline text-[10px] font-semibold"
                        onClick={() => onTransferAdmin(mm.user_id)}
                        title="Transférer le rôle d'administrateur"
                        type="button"
                      >
                        Transférer
                      </button>
                      <button
                        className="text-red-500 hover:text-red-400"
                        onClick={() => onRemoveMember(String(mm.user_id))}
                        title="Exclure du groupe"
                        type="button"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions quitter / supprimer */}
        <div className="border-t border-zinc-200 vibe-dark:border-zinc-800 pt-3 space-y-1">
          {groupIsAdmin ? (
            <button
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[11px] text-red-500 hover:bg-red-500/10 transition-colors font-semibold"
              onClick={onDeleteGroup}
              type="button"
            >
              <Trash2 className="w-3.5 h-3.5" /> Supprimer le groupe
            </button>
          ) : (
            <button
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[11px] text-red-500 hover:bg-red-500/10 transition-colors font-semibold"
              onClick={() => {
                onClose();
                if (currentUserId) onRemoveMember(String(currentUserId));
              }}
              type="button"
            >
              <X className="w-3.5 h-3.5" /> Quitter le groupe
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
