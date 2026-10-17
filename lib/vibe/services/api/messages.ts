/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — MESSAGES & DMs API (messages.ts)
 * Gestion des messages directs, discussions de groupe, réactions et modération
 * ============================================================================
 */

import type { DirectMessage, DMConversation } from "@/lib/vibe/types/vibe";
import { ApiServiceCore } from "./base";
import { ApiUsersService } from "./users";

export class ApiMessagesService extends ApiUsersService {
  public static async getConversations(): Promise<{
    conversations: DMConversation[];
  }> {
    return ApiServiceCore.cachedRequest("/v1/dms/conversations", 8000);
  }

  public static async getMessages(
    partnerId: string | number
  ): Promise<{ messages: DirectMessage[]; pinned_messages?: DirectMessage[] }> {
    return ApiServiceCore.cachedRequest(`/v1/dms/messages/${partnerId}`, 5000);
  }

  public static async sendMessage(
    recipient_id: string | number,
    content: string,
    reply_to_id?: string,
    send_at?: string,
    conversation_id?: string,
    forwarded_from?: { message_id: string } | null,
    attached_post_id?: string
  ): Promise<{
    success: boolean;
    message: DirectMessage;
    scheduled?: boolean;
  }> {
    ApiServiceCore.invalidateCache("/dms/");
    const body = JSON.stringify({
      attached_post_id,
      content,
      conversation_id,
      forwarded_from,
      recipient_id,
      reply_to_id,
      send_at,
    });
    return ApiServiceCore.request("/v1/dms/messages", { body, method: "POST" });
  }

  public static async pinMessage(
    partnerId: string | number,
    messageId: string
  ): Promise<{ success: boolean; pinned: boolean }> {
    ApiServiceCore.invalidateCache("/dms/");
    return ApiServiceCore.request(`/v1/dms/conversations/${partnerId}/pin`, {
      body: JSON.stringify({ message_id: messageId }),
      method: "POST",
    });
  }

  public static async unpinMessage(
    partnerId: string | number,
    messageId: string
  ): Promise<{ success: boolean; pinned: boolean }> {
    ApiServiceCore.invalidateCache("/dms/");
    return ApiServiceCore.request(
      `/v1/dms/conversations/${partnerId}/pin/${messageId}`,
      { method: "DELETE" }
    );
  }

  public static async searchDMMessages(
    partnerId: string | number,
    q: string
  ): Promise<{ messages: DirectMessage[] }> {
    try {
      return await ApiServiceCore.request(
        `/v1/dms/messages/${partnerId}/search?q=${encodeURIComponent(q)}`
      );
    } catch {
      return { messages: [] };
    }
  }

  public static async markConversationUnread(
    partnerId: string | number
  ): Promise<{ success: boolean }> {
    ApiServiceCore.invalidateCache("/dms/");
    return ApiServiceCore.request(
      `/v1/dms/conversations/${partnerId}/mark-unread`,
      { method: "POST" }
    );
  }

  public static async createGroup(
    name: string,
    memberIds: Array<string | number>
  ): Promise<{
    success: boolean;
    conversation_id: string;
    name: string;
    member_count: number;
  }> {
    ApiServiceCore.invalidateCache("/dms/");
    return ApiServiceCore.request("/v1/dms/groups", {
      body: JSON.stringify({ member_ids: memberIds, name }),
      method: "POST",
    });
  }

  public static async addGroupMembers(
    groupId: string,
    memberIds: Array<string | number>
  ): Promise<{ success: boolean; added: number }> {
    ApiServiceCore.invalidateCache("/dms/");
    return ApiServiceCore.request(`/v1/dms/groups/${groupId}/members`, {
      body: JSON.stringify({ member_ids: memberIds }),
      method: "POST",
    });
  }

  public static async removeGroupMember(
    groupId: string,
    userId: string | number
  ): Promise<{ success: boolean }> {
    ApiServiceCore.invalidateCache("/dms/");
    return ApiServiceCore.request(
      `/v1/dms/groups/${groupId}/members/${userId}`,
      {
        method: "DELETE",
      }
    );
  }

  public static async getGroup(groupId: string): Promise<{
    group: {
      id: string;
      group_name: string;
      group_avatar_url?: string;
      created_by: string;
      is_admin: boolean;
      members: Array<{
        user_id: string;
        username: string;
        display_name?: string;
        avatar_url?: string;
        role: string;
        joined_at: string;
      }>;
    };
  }> {
    return ApiServiceCore.request(`/v1/dms/groups/${groupId}`);
  }

  public static async updateGroup(
    groupId: string,
    data: { name?: string; avatar_url?: string | null }
  ): Promise<{
    success: boolean;
    group?: { group_name: string; group_avatar_url: string | null };
  }> {
    ApiServiceCore.invalidateCache("/dms/");
    return ApiServiceCore.request(`/v1/dms/groups/${groupId}`, {
      body: JSON.stringify(data),
      method: "POST",
    });
  }

  public static async deleteGroup(
    groupId: string
  ): Promise<{ success: boolean }> {
    ApiServiceCore.invalidateCache("/dms/");
    return ApiServiceCore.request(`/v1/dms/groups/${groupId}`, {
      method: "DELETE",
    });
  }

  public static async transferGroupAdmin(
    groupId: string,
    userId: string | number
  ): Promise<{ success: boolean; new_admin: number }> {
    ApiServiceCore.invalidateCache("/dms/");
    return ApiServiceCore.request(
      `/v1/dms/groups/${groupId}/members/${userId}/transfer-admin`,
      { method: "POST" }
    );
  }

  public static async hideMessage(
    messageId: string
  ): Promise<{ success: boolean; hidden: boolean }> {
    ApiServiceCore.invalidateCache("/dms/");
    return ApiServiceCore.request(`/v1/dms/messages/${messageId}/hide`, {
      method: "POST",
    });
  }

  public static async saveMessageTranslation(
    messageId: string,
    lang: string,
    text: string,
    detected?: string | null
  ): Promise<{
    success: boolean;
    translations: Record<
      string,
      { text: string; detected?: string | null; at?: string }
    >;
  }> {
    return ApiServiceCore.request(
      `/v1/dms/messages/${messageId}/translations`,
      {
        body: JSON.stringify({ detected, lang, text }),
        method: "POST",
      }
    );
  }

  public static async reactToMessage(
    messageId: string,
    emoji: string
  ): Promise<{
    success: boolean;
    reacted: boolean;
    reactions: { emoji: string; count: number; mine: boolean }[];
  }> {
    ApiServiceCore.invalidateCache("/dms/");
    return ApiServiceCore.request(`/v1/dms/messages/${messageId}/react`, {
      body: JSON.stringify({ emoji }),
      method: "POST",
    });
  }

  public static async generateDMReply(
    partnerId: string | number,
    draft?: string,
    preset: "improve" | "shorten" | "extend" | "tone" | "custom" = "improve",
    customPrompt?: string,
    tone?: string
  ): Promise<{ success: boolean; suggestion: string }> {
    const payload: Record<string, unknown> = {
      draft: draft || "",
      partner_id: partnerId,
      preset,
    };
    if (preset === "custom" && customPrompt)
      payload.custom_prompt = customPrompt;
    if (preset === "tone" && tone) payload.tone = tone;
    try {
      return await ApiServiceCore.request("/v1/dms/suggest-reply", {
        body: JSON.stringify(payload),
        method: "POST",
      });
    } catch (error: any) {
      if (!ApiServiceCore.shouldRetryVibeAlias(error)) throw error;
      return ApiServiceCore.request(`/v1/dms/generate-reply/${partnerId}`, {
        body: JSON.stringify(payload),
        method: "POST",
      });
    }
  }

  public static async reportConversation(
    partnerId: string | number,
    reason: string,
    messageId?: string
  ): Promise<{ success: boolean }> {
    return ApiServiceCore.request("/v1/dms/report", {
      body: JSON.stringify({
        message_id: messageId,
        reason,
        reported_user_id: partnerId,
      }),
      method: "POST",
    });
  }

  public static async renameConversation(
    partnerId: string | number,
    customName: string
  ): Promise<{ success: boolean }> {
    ApiServiceCore.invalidateCache("/dms/");
    return ApiServiceCore.request(`/v1/dms/conversations/${partnerId}/rename`, {
      body: JSON.stringify({ name: customName }),
      method: "POST",
    });
  }

  public static async deleteConversation(
    partnerId: string | number
  ): Promise<{ success: boolean }> {
    return ApiServiceCore.request(`/v1/dms/conversations/${partnerId}`, {
      method: "DELETE",
    });
  }

  public static async deleteMessage(
    messageId: string
  ): Promise<{ success: boolean }> {
    return ApiServiceCore.request(`/v1/dms/messages/${messageId}`, {
      method: "DELETE",
    });
  }

  public static async editMessage(
    messageId: string,
    content: string
  ): Promise<{ success: boolean; message: DirectMessage }> {
    ApiServiceCore.invalidateCache("/dms/");
    return ApiServiceCore.request(`/v1/dms/messages/${messageId}`, {
      body: JSON.stringify({ content }),
      method: "PATCH",
    });
  }

  public static async sendTyping(
    partnerId: string | number,
    typing = true
  ): Promise<void> {
    const payload = JSON.stringify({ partner_id: partnerId, typing });
    await ApiServiceCore.request("/v1/dms/typing", {
      body: payload,
      method: "POST",
    });
  }
}
