/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — STORIES API (stories.ts)
 * Rail de 24 h, publication, quotas, vues, réactions et archives
 * ============================================================================
 */

import type { Story, StoryAuthor, StoryQuota, StoryViewer } from "@/lib/vibe/types/vibe";
import { ApiServiceCore } from "./base";
import { ApiBooksService } from "./books";

export class ApiStoriesService extends ApiBooksService {
  public static storiesTrayEndpoint(): string {
    return "/v1/stories/tray";
  }

  public static async getStoriesTray(): Promise<{
    stories: StoryAuthor[];
    success: boolean;
  }> {
    return ApiServiceCore.cachedRequest(
      ApiStoriesService.storiesTrayEndpoint(),
      15_000
    );
  }

  public static async getStoryQuota(): Promise<StoryQuota> {
    return ApiServiceCore.cachedRequest("/v1/stories/quota", 15_000);
  }

  public static async getActiveStories(): Promise<{
    stories: Story[];
    success: boolean;
  }> {
    return ApiServiceCore.cachedRequest("/v1/stories/active", 15_000);
  }

  public static async getStoriesArchive(): Promise<{
    stories: Story[];
    success: boolean;
  }> {
    return ApiServiceCore.cachedRequest("/v1/stories/archive", 60_000);
  }

  public static async createStory(payload: {
    caption?: string;
    items: Array<{
      alt_text?: string;
      height?: number | null;
      media_type: "image" | "video";
      pathname: string;
      url: string;
      width?: number | null;
    }>;
    visibility?: "followers" | "public" | "private";
  }): Promise<{ id: string; quota: StoryQuota; success: boolean }> {
    ApiServiceCore.invalidateCache("/v1/stories");
    return ApiServiceCore.request("/v1/stories", {
      body: JSON.stringify(payload),
      method: "POST",
    });
  }

  public static async patchStory(
    id: string,
    payload: { archived?: boolean; caption?: string; visibility?: string }
  ): Promise<{ id: string; success: boolean }> {
    ApiServiceCore.invalidateCache("/v1/stories");
    return ApiServiceCore.request(`/v1/stories/${encodeURIComponent(id)}`, {
      body: JSON.stringify(payload),
      method: "PATCH",
    });
  }

  public static async deleteStory(
    id: string
  ): Promise<{ id: string; success: boolean }> {
    ApiServiceCore.invalidateCache("/v1/stories");
    return ApiServiceCore.request(`/v1/stories/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }

  public static async viewStory(id: string): Promise<void> {
    try {
      await ApiServiceCore.request(`/v1/stories/${encodeURIComponent(id)}/view`, {
        method: "POST",
      });
    } catch {}
  }

  public static async reactStory(
    id: string,
    emoji: string
  ): Promise<{ emoji: string; success: boolean }> {
    return ApiServiceCore.request(
      `/v1/stories/${encodeURIComponent(id)}/react`,
      {
        body: JSON.stringify({ emoji }),
        method: "POST",
      }
    );
  }

  public static async getStoryViews(id: string): Promise<{
    count: number;
    success: boolean;
    viewers: StoryViewer[];
  }> {
    return ApiServiceCore.cachedRequest(
      `/v1/stories/${encodeURIComponent(id)}/views`,
      10_000
    );
  }
}
