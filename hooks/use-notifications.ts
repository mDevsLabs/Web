"use client";

import useSWR from "swr";
import {
  NOTIFICATION_ORIGIN_LABELS,
  NOTIFICATION_ORIGINS,
  NOTIFICATION_TYPES,
  type NotificationOrigin,
  type NotificationType,
} from "@/lib/notifications/types";
import { fetcher } from "@/lib/utils";

// La liste canonique des types vit dans lib/notifications/types.ts (elle est
// contrainte par la base) : on la réexporte pour que les composants n'aient
// qu'un point d'entrée.
export {
  NOTIFICATION_ORIGIN_LABELS,
  NOTIFICATION_ORIGINS,
  NOTIFICATION_TYPES,
  type NotificationOrigin,
  type NotificationType,
};

export type NotificationItem = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
  /**
   * L'application qui a produit l'événement.
   *
   * `mai` par défaut : une notification sans origine est une notification
   * mAI, comme avant l'unification. Vibe et Wakies sont RÉPLIQUÉES — leur
   * source reste propriétaire de l'événement, la table de l'hôte de l'état
   * lu.
   */
  origin: NotificationOrigin;
  /** Identifiant de l'événement dans sa source. */
  sourceId: string | null;
  /** Charge utile propre à la source (acteur, url, conversation…). */
  sourceMeta: Record<string, unknown> | null;
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

/**
 * Notifications d'une seule origine.
 *
 * La cloche mAI affiche les trois applications. Ce hook sert au FILTRE par
 * application : il n'est pas une seconde requête mais la même, restreinte —
 * sinon le compteur affiché ne correspondrait pas à la liste.
 */
export function useNotificationsByOrigin(
  origin: NotificationOrigin | "all",
  limit = 20
) {
  const query =
    origin === "all" ? `?limit=${limit}` : `?limit=${limit}&origins=${origin}`;
  return useSWR<NotificationsResponse>(`/api/notifications${query}`, fetcher, {
    dedupingInterval: 60_000,
    refreshInterval: 180_000,
    revalidateOnFocus: false,
  });
}

export function useNotificationPrefs() {
  return useSWR<NotificationPrefs>("/api/notifications/preferences", fetcher, {
    dedupingInterval: 10_000,
  });
}
