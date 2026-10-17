/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — USERS & PROFILES API (users.ts)
 * Gestion des utilisateurs, profils, auth de session, cercle, abonnement et modération
 * ============================================================================
 */

import type {
  MAIQuotas,
  Post,
  Profile,
  ProfileListUser,
  UnifiedSearchResult,
  User,
} from "@/lib/vibe/types/vibe";
import { ApiServiceCore } from "./base";
import { ApiStoriesService } from "./stories";

export class ApiUsersService extends ApiStoriesService {
  public static async register(
    email: string,
    username: string,
    password: string
  ) {
    return ApiServiceCore.request<{
      success: boolean;
      email: string;
      status: string;
    }>("/register", {
      body: JSON.stringify({ email, password, username }),
      method: "POST",
    });
  }

  public static async verifyRegister(
    email: string,
    username: string,
    password: string,
    code: string
  ) {
    const res = await ApiServiceCore.request<{
      success: boolean;
      token: string;
      tier: string;
    }>("/verify-register", {
      body: JSON.stringify({ code, email, password, username }),
      method: "POST",
    });
    if (res.token) {
      ApiServiceCore.setToken(res.token);
    }
    return res;
  }

  public static async login(identifier: string, password: string) {
    return ApiServiceCore.request<{
      success: boolean;
      email: string;
      status: string;
    }>("/login", {
      body: JSON.stringify({ identifier, password }),
      method: "POST",
    });
  }

  public static async verifyLogin(email: string, code: string) {
    const res = await ApiServiceCore.request<{
      success: boolean;
      token: string;
      tier: string;
    }>("/verify-login", {
      body: JSON.stringify({ code, email }),
      method: "POST",
    });
    if (res.token) {
      ApiServiceCore.setToken(res.token);
    }
    return res;
  }

  public static async resendCode(email: string, action = "login") {
    return ApiServiceCore.request<{ success: boolean; error?: string }>(
      "/resend-code",
      {
        body: JSON.stringify({ action, email }),
        method: "POST",
      }
    );
  }

  public static async getCurrentUser(): Promise<{
    user: User;
    profile: Profile;
    quotas: MAIQuotas;
  }> {
    return ApiServiceCore.request<{
      user: User;
      profile: Profile;
      quotas: MAIQuotas;
    }>("/v1/me");
  }

  public static async getSuggestedUsers(): Promise<{
    users: Array<{
      id: string | number;
      username: string;
      display_name?: string;
      avatar_url?: string;
      bio?: string;
    }>;
  }> {
    return ApiServiceCore.request("/v1/users/suggested");
  }

  public static async getTopVibers(limit = 5): Promise<{
    users: Array<{
      id: number;
      username: string;
      display_name?: string;
      avatar_url?: string;
      is_verified?: boolean;
      followers_count?: number;
      bio?: string;
      is_following?: boolean;
    }>;
  }> {
    const qs = `?limit=${limit}`;
    try {
      return await ApiServiceCore.cachedRequest(`/v1/users/top${qs}`, 60_000);
    } catch {
      return { users: [] };
    }
  }

  public static async searchUsers(q: string): Promise<{
    users: Array<{
      id: number;
      username: string;
      display_name?: string;
      avatar_url?: string;
      is_verified?: boolean;
      followers_count?: number;
    }>;
  }> {
    try {
      return await ApiServiceCore.request(
        `/v1/search/users?q=${encodeURIComponent(q)}`
      );
    } catch (error: any) {
      if (!ApiServiceCore.shouldRetryVibeAlias(error)) return { users: [] };
      try {
        return await ApiServiceCore.request(
          `/v1/dms/users?q=${encodeURIComponent(q)}`
        );
      } catch {
        return { users: [] };
      }
    }
  }

  public static async searchUnified(
    q: string,
    limit = 5
  ): Promise<UnifiedSearchResult> {
    try {
      return await ApiServiceCore.cachedRequest<UnifiedSearchResult>(
        `/v1/search/unified?q=${encodeURIComponent(q)}&limit=${limit}`,
        15_000
      );
    } catch {
      return { books: [], messages: [], posts: [], total: 0, users: [] };
    }
  }

  public static async getOnboardingSuggestions(): Promise<{
    users: Array<{
      id: number;
      username: string;
      display_name?: string;
      avatar_url?: string;
      is_verified?: boolean;
      followers_count?: number;
      bio?: string;
    }>;
  }> {
    try {
      return await ApiServiceCore.cachedRequest(
        "/v1/onboarding/suggestions",
        60_000
      );
    } catch {
      return { users: [] };
    }
  }

  public static async completeOnboarding(): Promise<{ success: boolean }> {
    return ApiServiceCore.request("/v1/onboarding/complete", {
      method: "POST",
    });
  }

  public static async getProfileFollowers(
    username: string,
    limit = 20,
    offset = 0
  ): Promise<{ users: ProfileListUser[]; has_more: boolean }> {
    return ApiServiceCore.request(
      `/v1/profiles/${username}/followers?limit=${limit}&offset=${offset}`
    );
  }

  public static async getProfileFollowing(
    username: string,
    limit = 20,
    offset = 0
  ): Promise<{ users: ProfileListUser[]; has_more: boolean }> {
    return ApiServiceCore.request(
      `/v1/profiles/${username}/following?limit=${limit}&offset=${offset}`
    );
  }

  public static async blockUser(
    userId: string | number
  ): Promise<{ success: boolean }> {
    return ApiServiceCore.request("/v1/dms/block", {
      body: JSON.stringify({ user_id: userId }),
      method: "POST",
    });
  }

  public static async unblockUser(
    userId: string | number
  ): Promise<{ success: boolean }> {
    return ApiServiceCore.request("/v1/dms/unblock", {
      body: JSON.stringify({ user_id: userId }),
      method: "POST",
    });
  }

  public static async getBlockedUsers(): Promise<{
    blocked: Array<{
      id: string;
      blocked_user_id: string;
      blocked_username?: string;
      blocked_display_name?: string;
      blocked_avatar_url?: string;
      created_at: string;
    }>;
  }> {
    return ApiServiceCore.request("/v1/dms/blocked");
  }

  public static async muteUser(
    username: string,
    muted: boolean
  ): Promise<{ success: boolean; muted: boolean }> {
    const clean = username.trim().replace(/^@/, "");
    return ApiServiceCore.request(
      `/v1/users/${encodeURIComponent(clean)}/mute`,
      {
        body: JSON.stringify({ muted }),
        method: "POST",
      }
    );
  }

  public static async getMutedUsers(): Promise<{
    muted: Array<{
      id: string;
      muted_user_id: string;
      muted_username?: string;
      muted_display_name?: string;
      muted_avatar_url?: string;
      created_at: string;
    }>;
  }> {
    return ApiServiceCore.request("/v1/users/muted");
  }

  public static async getCircle(): Promise<{
    members: Array<{
      id: string | number;
      username: string;
      display_name?: string;
      avatar_url?: string;
      is_verified?: boolean;
      added_at?: string;
    }>;
  }> {
    return ApiServiceCore.cachedRequest("/v1/circle", 20_000);
  }

  public static async addToCircle(
    username: string
  ): Promise<{ success: boolean }> {
    ApiServiceCore.invalidateCache("/circle");
    return ApiServiceCore.request(
      `/v1/circle/${encodeURIComponent(username)}`,
      {
        method: "POST",
      }
    );
  }

  public static async removeFromCircle(
    username: string
  ): Promise<{ success: boolean }> {
    ApiServiceCore.invalidateCache("/circle");
    return ApiServiceCore.request(
      `/v1/circle/${encodeURIComponent(username)}`,
      {
        method: "DELETE",
      }
    );
  }

  public static async checkCircle(
    username: string
  ): Promise<{ in_circle: boolean }> {
    return ApiServiceCore.request(
      `/v1/circle/check/${encodeURIComponent(username)}`
    );
  }

  public static async getProfile(
    username: string
  ): Promise<{ profile: Profile; posts: Post[] }> {
    return ApiServiceCore.cachedRequest(
      ApiServiceCore.profileEndpoint(username),
      30_000
    );
  }

  public static async updateProfile(
    data: Partial<Profile>
  ): Promise<{ success: boolean }> {
    ApiServiceCore.invalidateCache("/profiles/");
    return ApiServiceCore.request("/v1/profile/update", {
      body: JSON.stringify(data),
      method: "POST",
    });
  }

  public static async uploadAvatar(
    file: File
  ): Promise<{ avatarUrl: string; success: boolean }> {
    return ApiServiceCore.uploadWithFallback<{
      avatarUrl: string;
      success: boolean;
    }>(
      "/v1/upload-avatar",
      "/upload-avatar",
      "avatar",
      file,
      "Erreur lors de l'upload de l'avatar."
    );
  }

  public static async uploadFile(
    file: File
  ): Promise<{ url: string; pathname: string; contentType: string }> {
    return ApiServiceCore.uploadWithFallback<{
      url: string;
      pathname: string;
      contentType: string;
    }>(
      "/v1/upload-file",
      "/upload-file",
      "file",
      file,
      "Erreur lors de l'upload du fichier."
    );
  }

  public static async updateAvatar(
    avatarUrl: string
  ): Promise<{ success: boolean; avatarUrl: string }> {
    return ApiServiceCore.request("/v1/profile/avatar", {
      body: JSON.stringify({ avatarUrl }),
      method: "POST",
    });
  }

  public static async toggleFollow(
    username: string
  ): Promise<{ success: boolean; following: boolean }> {
    const cleanUser = username.trim().replace(/^@/, "");
    return ApiServiceCore.request(
      `/v1/profiles/${encodeURIComponent(cleanUser)}/follow`,
      { method: "POST" }
    );
  }

  public static async getPostSubscription(
    username: string
  ): Promise<{ success: boolean; subscribed: boolean }> {
    const cleanUser = username.trim().replace(/^@/, "");
    return ApiServiceCore.request(
      `/v1/profiles/${encodeURIComponent(cleanUser)}/subscribe`
    );
  }

  public static async togglePostSubscription(
    username: string
  ): Promise<{ success: boolean; subscribed: boolean }> {
    const cleanUser = username.trim().replace(/^@/, "");
    return ApiServiceCore.request(
      `/v1/profiles/${encodeURIComponent(cleanUser)}/subscribe`,
      { method: "POST" }
    );
  }
}
