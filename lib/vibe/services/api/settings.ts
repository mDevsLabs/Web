/**
 * ============================================================================
 * VIBE SOCIAL PLATFORM — SETTINGS & NOTIFICATIONS API (settings.ts)
 * Notifications, préférences utilisateur, export de données
 * ============================================================================
 */

import type { NotificationItem, UserSettings } from "@/lib/vibe/types/vibe";
import { ApiServiceCore } from "./base";

export class ApiSettingsService extends ApiServiceCore {
  public static async getNotifications(): Promise<{
    notifications: NotificationItem[];
  }> {
    return ApiServiceCore.request("/v1/notifications");
  }

  public static async getUnreadCounts(): Promise<{
    unread_notifications: number;
    unread_messages: number;
  }> {
    return ApiServiceCore.request("/v1/notifications/unread_count");
  }

  public static async markNotificationsRead(): Promise<{ success: boolean }> {
    return ApiServiceCore.request("/v1/notifications/read", { method: "POST" });
  }

  public static async markNotificationRead(
    id: string,
    isRead = true
  ): Promise<{ success: boolean }> {
    const payload = JSON.stringify({ id, is_read: isRead });
    try {
      return await ApiServiceCore.request(
        `/v1/notifications/${encodeURIComponent(id)}/read`,
        {
          body: payload,
          method: "POST",
        }
      );
    } catch (error: any) {
      if (!ApiServiceCore.shouldRetryVibeAlias(error)) throw error;
      return ApiServiceCore.request("/v1/notifications/read", {
        body: payload,
        method: "POST",
      });
    }
  }

  public static async deleteNotification(id: string): Promise<{ success: boolean }> {
    const payload = JSON.stringify({ id });
    try {
      return await ApiServiceCore.request(
        `/v1/notifications/${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
    } catch (error: any) {
      if (!ApiServiceCore.shouldRetryVibeAlias(error)) throw error;
      return ApiServiceCore.request("/v1/notifications/delete", {
        body: payload,
        method: "POST",
      });
    }
  }

  public static async clearAllNotifications(): Promise<{ success: boolean }> {
    try {
      return await ApiServiceCore.request("/v1/notifications", {
        method: "DELETE",
      });
    } catch (error: any) {
      if (!ApiServiceCore.shouldRetryVibeAlias(error)) throw error;
      return ApiServiceCore.request("/v1/notifications/delete", {
        body: JSON.stringify({ all: true }),
        method: "POST",
      });
    }
  }

  public static async getSettings(): Promise<{ settings: UserSettings }> {
    return ApiServiceCore.request("/v1/settings");
  }

  public static async updateSettings(
    settings: Partial<UserSettings>
  ): Promise<{ success: boolean }> {
    return ApiServiceCore.request("/v1/settings/update", {
      body: JSON.stringify(settings),
      method: "POST",
    });
  }

  public static async exportData(): Promise<any> {
    return ApiServiceCore.request("/v1/privacy/export");
  }
}
