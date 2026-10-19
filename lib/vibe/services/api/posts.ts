/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — POSTS & FEED API (posts.ts)
 * Gestion du fil d'actualités, publications, sondages, commentaires, signets
 * ============================================================================
 */

import { AppStorage } from "@/lib/vibe/services/storageAdapter";
import type { Comment, Poll, Post, ServerDraft } from "@/lib/vibe/types/vibe";
import {
  ApiServiceCore,
  type CreatorStats,
  type PostStats,
  type StatsPeriod,
  type TranslateResult,
} from "./base";
import { ApiMessagesService } from "./messages";

export class ApiPostsService extends ApiMessagesService {
  public static async getFeed(
    type: "for_you" | "stream" | "trending" = "for_you",
    tag?: string,
    cursor?: string
  ): Promise<{
    posts: Post[];
    mode: string;
    title: string;
    nextCursor?: string | null;
  }> {
    const endpoint = ApiServiceCore.feedEndpoint(type, tag, cursor);
    const sessionGeneration = ApiServiceCore.sessionGeneration;
    const cacheGeneration = ApiServiceCore.cacheGeneration;

    try {
      const res = await ApiServiceCore.request<{
        posts: Post[];
        mode: string;
        title: string;
        nextCursor?: string | null;
      }>(endpoint);

      if (
        !cursor &&
        !tag &&
        res?.posts &&
        res.posts.length > 0 &&
        sessionGeneration === ApiServiceCore.sessionGeneration &&
        cacheGeneration === ApiServiceCore.cacheGeneration
      ) {
        AppStorage.setJSON(`vibe_offline_feed_${type}`, res);
      }
      return res;
    } catch (networkErr) {
      const cached =
        sessionGeneration === ApiServiceCore.sessionGeneration &&
        cacheGeneration === ApiServiceCore.cacheGeneration
          ? AppStorage.getJSON<{
              posts: Post[];
              mode: string;
              title: string;
            } | null>(`vibe_offline_feed_${type}`, null)
          : null;
      if (cached?.posts && cached.posts.length > 0) {
        return {
          ...cached,
          nextCursor: null,
          title: `${cached.title || "Flux"} (Hors-ligne)`,
        };
      }
      throw networkErr;
    }
  }

  public static async getTrends(): Promise<{
    success: boolean;
    trends: Array<{
      tag: string;
      category?: string;
      posts: string;
      post_count?: number;
    }>;
  }> {
    try {
      return await ApiServiceCore.cachedRequest("/v1/trends", 60_000);
    } catch {
      return { success: false, trends: [] };
    }
  }

  public static async getTopPosts(
    limit = 5,
    days = 30
  ): Promise<{ success: boolean; posts: Post[] }> {
    const qs = `?limit=${limit}&days=${days}`;
    try {
      return await ApiServiceCore.cachedRequest(`/v1/posts/top${qs}`, 60_000);
    } catch {
      return { posts: [], success: false };
    }
  }

  public static async searchPosts(
    q: string,
    limit = 20,
    offset = 0
  ): Promise<{ posts: Post[]; count: number }> {
    try {
      return await ApiServiceCore.request(
        `/v1/search/posts?q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}`
      );
    } catch {
      return { count: 0, posts: [] };
    }
  }

  public static async votePoll(
    postId: string,
    optionId: string
  ): Promise<{ success: boolean; poll: Poll }> {
    ApiServiceCore.invalidateCache("/v1/posts/");
    return ApiServiceCore.request(`/v1/posts/${postId}/poll/vote`, {
      body: JSON.stringify({ option_id: optionId }),
      method: "POST",
    });
  }

  public static async getPostStats(
    postId: string,
    period: StatsPeriod = "7d"
  ): Promise<PostStats> {
    return ApiServiceCore.cachedRequest(
      `/v1/posts/${postId}/stats?period=${period}`,
      30_000
    );
  }

  public static async getCreatorStats(
    period: StatsPeriod = "30d"
  ): Promise<CreatorStats> {
    return ApiServiceCore.cachedRequest(
      `/v1/users/me/creator-stats?period=${period}`,
      60_000
    );
  }

  public static async getProfileViews(period: StatsPeriod = "30d"): Promise<{
    period: string;
    total: number;
    series: Array<{ day: string; views: number }>;
  }> {
    return ApiServiceCore.cachedRequest(
      `/v1/users/me/profile-views?period=${period}`,
      60_000
    );
  }

  public static async trackProfileView(
    username: string,
    source = "profile"
  ): Promise<{ success: boolean; counted?: boolean }> {
    const clean = username.replace(/^@/, "");
    if (!clean) return { success: false };
    const body = JSON.stringify({ source });
    try {
      return await ApiServiceCore.request(
        `/v1/profiles/${encodeURIComponent(clean)}/view`,
        { body, method: "POST" }
      );
    } catch {
      return { success: false };
    }
  }

  public static async getScheduledPosts(): Promise<{ posts: Post[] }> {
    try {
      return await ApiServiceCore.cachedRequest<{ posts: Post[] }>(
        "/v1/posts/scheduled",
        15_000
      );
    } catch {
      return { posts: [] };
    }
  }

  public static async reschedulePost(
    postId: string,
    scheduledAt: string | null
  ): Promise<{ success: boolean; status?: string; scheduled_at?: string }> {
    ApiServiceCore.invalidateCache("/v1/posts/");
    return ApiServiceCore.request(`/v1/posts/${postId}/reschedule`, {
      body: JSON.stringify({ scheduled_at: scheduledAt }),
      method: "PATCH",
    });
  }

  public static async getDrafts(): Promise<{ drafts: ServerDraft[] }> {
    try {
      return await ApiServiceCore.cachedRequest<{ drafts: ServerDraft[] }>(
        "/v1/drafts",
        15_000
      );
    } catch {
      return { drafts: [] };
    }
  }

  public static async saveDraft(draft: {
    id?: string;
    html: string;
    text: string;
    visibility?: string;
    scheduled_at?: string | null;
    ai_generated?: boolean;
    media_assets?: Array<{
      url: string;
      media_type?: string;
      size?: number;
      alt_text?: string;
    }>;
  }): Promise<{ success: boolean; id: string }> {
    if (draft.id) {
      return ApiServiceCore.request(`/v1/drafts/${draft.id}`, {
        body: JSON.stringify(draft),
        method: "PUT",
      });
    }
    return ApiServiceCore.request("/v1/drafts", {
      body: JSON.stringify(draft),
      method: "POST",
    });
  }

  public static async deleteDraft(id: string): Promise<{ success: boolean }> {
    return ApiServiceCore.request(`/v1/drafts/${id}`, { method: "DELETE" });
  }

  public static async respondToCollab(
    postId: string,
    accept: boolean
  ): Promise<{ success: boolean; status: string }> {
    ApiServiceCore.invalidateCache("/v1/posts/");
    const action = accept ? "accept" : "decline";
    return ApiServiceCore.request(`/v1/posts/${postId}/collaborate/${action}`, {
      method: "POST",
    });
  }

  public static async getUserLikedPosts(
    username: string
  ): Promise<{ posts: Post[] }> {
    const cleanUser = username.trim().replace(/^@/, "");
    try {
      return await ApiServiceCore.cachedRequest<{ posts: Post[] }>(
        `/v1/profiles/${encodeURIComponent(cleanUser)}/likes`,
        15_000
      );
    } catch {
      return { posts: [] };
    }
  }

  public static async createPost(
    content: string,
    media_url?: string,
    media_assets?: Array<{
      url: string;
      media_type: string;
      size?: number;
      alt_text?: string;
    }>,
    options?: {
      aiGenerated?: boolean;
      quotedPostId?: string;
      scheduledAt?: string | null;
      visibility?: "public" | "followers" | "circle" | "private";
      poll?: { question?: string; options: string[]; duration_hours: number };
      collaboratorUsername?: string;
      mediaPositions?: number[];
    }
  ): Promise<{ success: boolean; post: Post }> {
    const payload = {
      ai_generated: options?.aiGenerated,
      collaborator_username: options?.collaboratorUsername,
      content,
      media_assets,
      media_positions: options?.mediaPositions,
      media_url,
      poll: options?.poll,
      quoted_post_id: options?.quotedPostId,
      scheduled_at: options?.scheduledAt || undefined,
      visibility: options?.visibility || "public",
    };
    return ApiServiceCore.request("/v1/posts", {
      body: JSON.stringify(payload),
      method: "POST",
    });
  }

  public static async updatePost(
    id: string,
    content: string,
    media_assets?: Array<{
      url: string;
      media_type: string;
      size?: number;
      alt_text?: string;
    }>,
    options?: {
      scheduledAt?: string | null;
      visibility?: "public" | "followers" | "circle" | "private";
      mediaPositions?: number[];
    }
  ): Promise<{ success: boolean; post: Post }> {
    const payload = {
      content,
      media_assets,
      media_positions: options?.mediaPositions,
      scheduled_at: options?.scheduledAt,
      visibility: options?.visibility,
    };
    return ApiServiceCore.request(`/v1/posts/${id}`, {
      body: JSON.stringify(payload),
      method: "PATCH",
    });
  }

  public static async getPost(id: string): Promise<{ post: Post }> {
    return ApiServiceCore.request(`/v1/posts/${id}`);
  }

  public static async deletePost(id: string): Promise<{ success: boolean }> {
    return ApiServiceCore.request(`/v1/posts/${id}`, { method: "DELETE" });
  }

  public static async toggleLike(
    id: string
  ): Promise<{ success: boolean; liked: boolean }> {
    return ApiServiceCore.request(`/v1/posts/${id}/like`, { method: "POST" });
  }

  public static async toggleRepost(
    id: string
  ): Promise<{ success: boolean; reposted: boolean }> {
    return ApiServiceCore.request(`/v1/posts/${id}/repost`, { method: "POST" });
  }

  public static async toggleBookmark(
    id: string
  ): Promise<{ success: boolean; bookmarked: boolean }> {
    return ApiServiceCore.request(`/v1/posts/${id}/bookmark`, {
      method: "POST",
    });
  }

  public static async sendPostFeedback(
    id: string,
    value: "more" | "less" | null
  ): Promise<{ success: boolean; my_feedback: "more" | "less" | null }> {
    return ApiServiceCore.request(`/v1/posts/${id}/feedback`, {
      body: JSON.stringify({ value }),
      method: "POST",
    });
  }

  public static async viewPost(
    id: string,
    opts?: {
      duration_ms?: number;
      dwell_ms?: number;
      visible_ratio?: number;
      source?: string;
    }
  ): Promise<{ success: boolean; views_count: number | null }> {
    const body = opts
      ? JSON.stringify({
          duration_ms: opts.duration_ms,
          dwell_ms: opts.dwell_ms,
          source: opts.source,
          visible_ratio: opts.visible_ratio,
        })
      : undefined;
    return ApiServiceCore.request(`/v1/posts/${id}/view`, {
      method: "POST",
      ...(body ? { body } : {}),
    });
  }

  public static async setPostPinned(
    id: string,
    pinned: boolean
  ): Promise<{
    success: boolean;
    pinned: boolean;
    pinned_count?: number;
    code?: string;
    error?: string;
  }> {
    return ApiServiceCore.request(`/v1/posts/${id}/pin`, {
      body: JSON.stringify({ pinned }),
      method: "POST",
    });
  }

  public static async setPostProfilePinned(
    id: string,
    pinned: boolean
  ): Promise<{
    success: boolean;
    pinned: boolean;
    pinned_count?: number;
    code?: string;
    error?: string;
  }> {
    return ApiServiceCore.request(`/v1/posts/${id}/profile-pin`, {
      body: JSON.stringify({ pinned }),
      method: "POST",
    });
  }

  public static async getComments(
    postId: string
  ): Promise<{ comments: Comment[]; aiDigest: string | null; count: number }> {
    return ApiServiceCore.cachedRequest(`/v1/posts/${postId}/comments`, 10_000);
  }

  public static async addComment(
    postId: string,
    content: string,
    parent_comment_id?: string,
    media_assets?: Array<{ url: string; media_type: string; alt_text?: string }>
  ): Promise<{ success: boolean; comment: Comment; ai_pending?: boolean }> {
    const payload = { content, media_assets, parent_comment_id };
    return ApiServiceCore.request(`/v1/posts/${postId}/comments`, {
      body: JSON.stringify(payload),
      method: "POST",
    });
  }

  public static async likeComment(
    postId: string,
    commentId: string
  ): Promise<{ success: boolean; liked: boolean; likes_count: number }> {
    return ApiServiceCore.request(
      `/v1/posts/${postId}/comments/${commentId}/like`,
      { method: "POST" }
    );
  }

  public static async aiTransformText(
    text: string,
    action: "complete" | "fix_spelling" | "lengthen" | "shorten" | "tone",
    tone?: string
  ): Promise<{ success: boolean; text: string }> {
    const payload = JSON.stringify({ action, text, tone });
    return ApiServiceCore.request("/v1/ai/text", {
      body: payload,
      method: "POST",
    });
  }

  public static async translatePost(
    postId: string,
    targetLang: string
  ): Promise<TranslateResult> {
    const payload = JSON.stringify({
      post_id: postId,
      target_lang: targetLang,
    });
    return ApiServiceCore.request("/v1/translate", {
      body: payload,
      method: "POST",
    });
  }

  public static async translateComment(
    commentId: string,
    targetLang: string
  ): Promise<TranslateResult> {
    const payload = JSON.stringify({
      comment_id: commentId,
      target_lang: targetLang,
    });
    return ApiServiceCore.request("/v1/translate", {
      body: payload,
      method: "POST",
    });
  }

  public static async translateText(
    text: string,
    targetLang: string
  ): Promise<TranslateResult> {
    return ApiServiceCore.request("/v1/ai/translate", {
      body: JSON.stringify({ target_lang: targetLang, text }),
      method: "POST",
    });
  }
}
