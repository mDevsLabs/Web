"use client";

import useSWR from "swr";
import {
  NOTIFICATION_TYPES,
  type NotificationType,
} from "@/lib/notifications/types";
import { fetcher } from "@/lib/utils";

// La liste canonique des types vit dans lib/notifications/types.ts (elle est
// contrainte par la base) : on la réexporte pour que les composants n'aient
// qu'un point d'entrée.
export { NOTIFICATION_TYPES, type NotificationType };

export type NotificationItem = {
  id: string;
  userId: string;
  type: NotificationType;
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
  agentApprovalRequired: boolean;
  agentRunFailed: boolean;
  agentRunFinished: boolean;
  agentUserInputRequired: boolean;
  mcpAccessRequest: boolean;
  mcpCreated: boolean;
  news: boolean;
  planningTaskCompleted: boolean;
  projectCreated: boolean;
  quotaWarning: boolean;
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
    {
      dedupingInterval: 60_000,
      refreshInterval: 180_000,
      revalidateOnFocus: false,
    }
  );
}

export function useNotificationPrefs() {
  return useSWR<NotificationPrefs>("/api/notifications/preferences", fetcher, {
    dedupingInterval: 10_000,
  });
}
