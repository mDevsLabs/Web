"use client";

/** Une relève par compte ; le verrou navigateur évite les alertes en double entre onglets. */
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
  const [notifications, setNotifications] = useState<MessagingNotification[]>(
    []
  );
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
    const ancienCompte =
      displayedScope.current !== undefined &&
      displayedScope.current !== data.scope;
    displayedScope.current = data.scope;
    setNotifications((actuelles) => {
      const parId = new Map(
        (ancienCompte ? [] : actuelles).map((item) => [item.id, item])
      );
      for (const item of nouveaux) parId.set(item.id, item);
      return [...parId.values()].sort((a, b) => b.seq - a.seq).slice(0, 50);
    });
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

  const retirer = useCallback((conversationId: string) => {
    setNotifications((actuelles) =>
      actuelles.filter((item) => item.conversationId !== conversationId)
    );
  }, []);
  return { autoriser, notifications, permission, refresh: mutate, retirer };
}
