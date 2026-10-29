"use client";

/**
 * Permission des notifications du navigateur.
 *
 * POURQUOI UN HOOK DÉDIÉ
 *
 * Le hook de messagerie relève aussi les événements toutes les cinq
 * secondes : sur une page de réglages, cette relève serait inutile. Celui-ci
 * ne lit que l'état de la permission et la demande — et il ne la demande
 * QUE depuis un clic, comme l'exige la règle du domaine (une demande sans
 * geste utilisateur est refusée par les navigateurs).
 *
 * À noter : aucun mécanisme Web Push n'est configuré. L'alerte ne fonctionne
 * donc que tant que l'application reste ouverte.
 */
import { useCallback, useEffect, useState } from "react";

export function useNotificationPermission(): {
  autoriser: () => Promise<void>;
  permission: NotificationPermission | "unsupported";
} {
  const [permission, setPermission] = useState<
    NotificationPermission | "unsupported"
  >("unsupported");

  useEffect(() => {
    if (typeof Notification === "undefined") {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
  }, []);

  const autoriser = useCallback(async () => {
    if (typeof Notification === "undefined") {
      setPermission("unsupported");
      return;
    }
    try {
      setPermission(await Notification.requestPermission());
    } catch {
      setPermission(Notification.permission);
    }
  }, []);

  return { autoriser, permission };
}
