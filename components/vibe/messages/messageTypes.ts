/**
 * Types et utilitaires partagés pour la messagerie privée Vibe.
 */

import type { DirectMessage, DMConversation, VibeBookPost } from "@/lib/vibe/types/vibe";

export interface AttachedMedia {
  fileName?: string;
  size: number;
  type: "image" | "video" | "document";
  url: string;
}

export const dmDraftKey = (partnerId: string | number | null) =>
  `vibe_dm_draft_${partnerId}`;

export const formatFileSize = (bytes: number): string => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
};

export interface ActivePartnerInfo {
  id: string | number;
  username: string;
  display_name?: string;
  avatar_url?: string;
  is_verified?: boolean;
  tier?: string;
}

export interface ActiveGroupInfo {
  is_admin: boolean;
  members: Array<{
    user_id: string | number;
    username: string;
    display_name?: string;
    avatar_url?: string;
    role: string;
    joined_at?: string;
  }>;
}

export interface AttachedPostPreview {
  id: string;
  username: string;
  excerpt: string;
  avatar_url?: string | null;
}
