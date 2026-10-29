"use client";

/**
 * Alerte NAVIGATEUR des réponses Wakies.
 *
 * Une relève par compte ; le verrou navigateur évite les alertes en double
 * entre onglets.
 *
 * POURQUOI LA LISTE N'EST PLUS GARDÉE ICI
 *
 * La cloche du rail Wakies a disparu : les notifications Wakies sont
 * affichées par la cloche mAI, qui lit la table unifiée de l'hôte
 * (migration 0063). Ce hook ne sert donc plus qu'à l'ALERTE SYSTÈME, qui
 * dépend de la fenêtre ouverte et pas d'une page.
 *
 * Il garde donc seulement le curseur de relève et l'état de permission. La
 * liste des événements servait à la cloche ; la garder en mémoire serait
 * du travail inutile.
 */
import { useCallback, useEffect, useId, useRef, useState } from "react";
import useSWR from "swr";
import { alerterUneFois } from "@/lib/wakies/client/notifications";
import { api } from "./api";

export interface MessagingNotification {
  conversationId: string;
  id: string;
  muted: boolean;
  preview: string;
  seq: number;
  title: string;
}

interface Releve {
  cursor: number;
  notifications: MessagingNotification[];
  scope: string;
}

export function useMessagingNotifications(activeConversationId?: string) {
  const instance = useId();
  const cursor = useRef<number | undefined>(undefined);
  const scope = useRef<string | undefined>(undefined);
  const [permission, setPermission] = useState<
    NotificationPermission | "unsupported"
  >("unsupported");
  const displayedScope = useRef<string | undefined>(undefined);
  const active = useRef(activeConversationId);
  active.current = activeConversationId;
  const { data, mutate } = useSWR<Releve>(
    ["wakies-messaging-notifications", instance],
    async () => {
      const releve = await api<Releve>(
        `/notifications${cursor.current === undefined ? "" : `?after=${cursor.current}`}`
      );
      if (scope.current !== undefined && scope.current !== releve.scope) {
        cursor.current = undefined;
        scope.current = releve.scope;
        const initiale = await api<Releve>("/notifications");
        cursor.current = initiale.cursor;
        return initiale;
      }
      scope.current = releve.scope;
      cursor.current = releve.cursor;
      return releve;
    },
    {
      refreshInterval: 5000,
      refreshWhenHidden: true,
      revalidateOnFocus: true,
    }
  );

  useEffect(() => {
    if (typeof Notification !== "undefined")
      setPermission(Notification.permission);
  }, []);

  useEffect(() => {
    if (!data) return;
    const nouveaux = data.notifications.filter(
      (item) =>
        !item.muted &&
        !(
          document.visibilityState === "visible" &&
          item.conversationId === active.current
        )
    );
    displayedScope.current = data.scope;
    if (
      typeof Notification === "undefined" ||
      Notification.permission !== "granted"
    )
      return;
    for (const item of nouveaux) {
      if (document.visibilityState !== "visible")
        void alerterUneFois(data.scope, item);
    }
  }, [data]);

  const autoriser = useCallback(async () => {
    if (typeof Notification === "undefined") return;
    try {
      setPermission(await Notification.requestPermission());
    } catch {
      setPermission(Notification.permission);
    }
  }, []);

  return { autoriser, permission, refresh: mutate };
}
