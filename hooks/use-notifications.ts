"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/utils";

export type NotificationItem = {
  id: string;
  userId: string;
  type:
    | "ai_response"
    | "project_created"
    | "mcp_created"
    | "mcp_access_request"
    | "news";
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

export type NotificationPrefs = {
  userId: string;
  enabled: boolean;
  aiResponse: boolean;
  projectCreated: boolean;
  mcpCreated: boolean;
  mcpAccessRequest: boolean;
  news: boolean;
  regenerateMode: "truncate" | "fork";
  createdAt: string;
  updatedAt: string;
};

export type NotificationsResponse = {
  notifications: NotificationItem[];
  unreadCount: number;
};

export function useNotifications(limit = 20) {
  return useSWR<NotificationsResponse>(
    `/api/notifications?limit=${limit}`,
    fetcher,
    { refreshInterval: 30_000, revalidateOnFocus: true }
  );
}

export function useNotificationPrefs() {
  return useSWR<NotificationPrefs>("/api/notifications/preferences", fetcher, {
    dedupingInterval: 10_000,
  });
}
